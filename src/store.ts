import { create } from 'zustand'
import type { RealtimeChannel, Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { makeSampleTrip, makeBlankTrip } from './data/seed'
import {
  destinationFromRow,
  destinationToRow,
  eventFromRow,
  eventToRow,
  expenseFromRow,
  expenseToRow,
  flightDetailsFromRow,
  flightDetailsToRow,
  memberFromRow,
  memberToRow,
  optionFromRow,
  optionToRow,
  sensitiveFromRow,
  sensitiveToRow,
  tripFromRow,
  tripToRow,
  type DestinationRow,
  type EventRow,
  type ExpenseRow,
  type FlightDetailsRow,
  type MemberRow,
  type OptionRow,
  type SensitiveRow,
  type TripRow,
} from './lib/db'
import type {
  ActivityOption,
  CalendarEvent,
  Destination,
  Expense,
  FlightDetails,
  MemberSensitive,
  TeamMember,
  Trip,
  TripRecord,
} from './types'

function upsertById<T extends { id: string }>(arr: T[], item: T): T[] {
  const idx = arr.findIndex((x) => x.id === item.id)
  if (idx === -1) return [...arr, item]
  const copy = [...arr]
  copy[idx] = item
  return copy
}
function removeById<T extends { id: string }>(arr: T[], id: string): T[] {
  return arr.filter((x) => x.id !== id)
}

interface TripSummary {
  id: string
  archived: boolean
  trip: Trip
}

interface Store {
  authLoading: boolean
  session: Session | null
  needsName: boolean

  trips: TripSummary[]
  activeTripId: string | null
  activeTripData: TripRecord | null
  loadingActiveTrip: boolean

  initAuth: () => void
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  saveDisplayName: (name: string) => Promise<void>
  signOut: () => Promise<void>

  loadTrips: () => Promise<void>
  switchTrip: (id: string) => Promise<void>
  createTrip: (name: string) => Promise<void>
  archiveTrip: (id: string) => Promise<void>
  unarchiveTrip: (id: string) => Promise<void>
  deleteTrip: (id: string) => Promise<void>

  updateTrip: (patch: Partial<Trip>) => void

  addDestination: (d: Omit<Destination, 'id'>) => void
  updateDestination: (id: string, patch: Partial<Destination>) => void
  removeDestination: (id: string) => void

  addTeamMember: (m: Omit<TeamMember, 'id'>) => void
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void
  removeTeamMember: (id: string) => void
  updateMemberSensitive: (memberId: string, patch: Partial<MemberSensitive>) => void
  uploadPassportPhoto: (memberId: string, file: File) => Promise<void>
  getPassportPhotoUrl: (path: string) => Promise<string | null>

  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  removeEvent: (id: string) => void

  updateFlightDetails: (eventId: string, patch: Partial<FlightDetails>) => void
  setFlightSeat: (eventId: string, memberId: string, seat: string) => void
  addFlight: (event: Omit<CalendarEvent, 'id' | 'category'>, flight: Omit<FlightDetails, 'eventId' | 'seats'>) => void

  addExpense: (e: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void

  toggleOption: (id: string) => void
  addOption: (o: Omit<ActivityOption, 'id'>) => void

  resetActiveTripToSample: () => Promise<void>
}

let realtimeChannel: RealtimeChannel | null = null
let tripNameDebounce: ReturnType<typeof setTimeout> | null = null
let seedingPromise: Promise<void> | null = null

async function ensureSelfMembership(tripId: string, userId: string, email: string, name: string) {
  const { data: existing } = await supabase.from('trip_members').select('id').eq('trip_id', tripId).ilike('email', email).maybeSingle()
  if (existing) {
    await supabase.from('trip_members').update({ user_id: userId, status: 'confirmed' }).eq('id', existing.id)
  } else {
    await supabase.from('trip_members').insert({ id: crypto.randomUUID(), trip_id: tripId, user_id: userId, email, name, role: 'Trip Lead', color: '#81e0ae', status: 'confirmed', member_type: 'trip_leader' })
  }
}

async function seedSampleTripForUser(userId: string, email: string, name: string) {
  const sample = makeSampleTrip('unused')
  const tripId = crypto.randomUUID()
  const { error } = await supabase.from('trips').insert({ id: tripId, ...tripToRow(sample.trip), created_by: userId })
  if (error) return

  // Must exist before any child-row insert: every other table's RLS policy requires
  // the actor to already be a trip member, and the creator isn't one until this runs.
  const selfId = crypto.randomUUID()
  await supabase
    .from('trip_members')
    .insert({ id: selfId, trip_id: tripId, user_id: userId, email, name, role: 'Trip Lead', color: '#81e0ae', status: 'confirmed', member_type: 'trip_leader' })

  const destIdMap = new Map<string, string>()
  for (const d of sample.destinations) {
    const newId = crypto.randomUUID()
    destIdMap.set(d.id, newId)
    await supabase.from('destinations').insert({ id: newId, trip_id: tripId, ...destinationToRow(d) })
  }

  const memberIdMap = new Map<string, string>()
  for (const m of sample.team) {
    if (m.email.toLowerCase() === email.toLowerCase()) {
      memberIdMap.set(m.id, selfId) // this placeholder IS the signed-in user; point it at their real row
      continue
    }
    const newId = crypto.randomUUID()
    memberIdMap.set(m.id, newId)
    await supabase.from('trip_members').insert({ id: newId, trip_id: tripId, ...memberToRow(m) })
  }

  for (const e of sample.events) {
    await supabase.from('events').insert({
      id: crypto.randomUUID(),
      trip_id: tripId,
      ...eventToRow(e),
      destination_id: destIdMap.get(e.destinationId) ?? null,
      attendee_ids: e.attendeeIds.map((pid) => memberIdMap.get(pid)).filter((id): id is string => !!id),
    })
  }
  for (const ex of sample.expenses) {
    await supabase.from('expenses').insert({
      id: crypto.randomUUID(),
      trip_id: tripId,
      ...expenseToRow(ex),
      destination_id: ex.destinationId ? (destIdMap.get(ex.destinationId) ?? null) : null,
    })
  }
  for (const o of sample.options) {
    await supabase.from('activity_options').insert({
      id: crypto.randomUUID(),
      trip_id: tripId,
      ...optionToRow(o),
      destination_id: destIdMap.get(o.destinationId) ?? o.destinationId,
    })
  }
}

export const useStore = create<Store>((set, get) => ({
  authLoading: true,
  session: null,
  needsName: false,

  trips: [],
  activeTripId: null,
  activeTripData: null,
  loadingActiveTrip: false,

  initAuth: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, authLoading: false, needsName: !!data.session && !data.session.user.user_metadata?.name })
      if (data.session) get().loadTrips()
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, authLoading: false, needsName: !!session && !session.user.user_metadata?.name })
      if (session) get().loadTrips()
      else set({ trips: [], activeTripId: null, activeTripData: null })
    })
  },

  signInWithEmail: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    return { error: error?.message ?? null }
  },

  saveDisplayName: async (name) => {
    await supabase.auth.updateUser({ data: { name } })
    set({ needsName: false })
  },

  signOut: async () => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel)
    await supabase.auth.signOut()
  },

  loadTrips: async () => {
    const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: true })
    if (error || !data) return
    const rows = data as TripRow[]

    if (rows.length === 0) {
      const session = get().session
      if (session) {
        if (!seedingPromise) {
          const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Trip Lead'
          seedingPromise = seedSampleTripForUser(session.user.id, session.user.email!, name).finally(() => {
            seedingPromise = null
          })
        }
        await seedingPromise
        return get().loadTrips()
      }
    }

    const trips = rows.map((r) => ({ id: r.id, archived: r.archived, trip: tripFromRow(r) }))
    set({ trips })

    const current = get().activeTripId
    if (!current || !trips.some((t) => t.id === current)) {
      const firstActive = trips.find((t) => !t.archived) ?? trips[0]
      if (firstActive) get().switchTrip(firstActive.id)
    }
  },

  switchTrip: async (id) => {
    set({ activeTripId: id, loadingActiveTrip: true })
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }

    const [
      { data: members },
      { data: destinations },
      { data: events },
      { data: expenses },
      { data: options },
      { data: sensitive },
      { data: flights },
    ] = await Promise.all([
      supabase.from('trip_members').select('*').eq('trip_id', id),
      supabase.from('destinations').select('*').eq('trip_id', id),
      supabase.from('events').select('*').eq('trip_id', id),
      supabase.from('expenses').select('*').eq('trip_id', id),
      supabase.from('activity_options').select('*').eq('trip_id', id),
      supabase.from('trip_member_sensitive').select('*').eq('trip_id', id),
      supabase.from('flight_details').select('*').eq('trip_id', id),
    ])

    if (get().activeTripId !== id) return // switched again before this resolved

    const summary = get().trips.find((t) => t.id === id)
    if (!summary) {
      set({ loadingActiveTrip: false })
      return
    }

    set({
      activeTripData: {
        id,
        archived: summary.archived,
        createdAt: '',
        trip: summary.trip,
        team: (members as MemberRow[] | null)?.map(memberFromRow) ?? [],
        destinations: (destinations as DestinationRow[] | null)?.map(destinationFromRow) ?? [],
        events: (events as EventRow[] | null)?.map(eventFromRow) ?? [],
        expenses: (expenses as ExpenseRow[] | null)?.map(expenseFromRow) ?? [],
        options: (options as OptionRow[] | null)?.map(optionFromRow) ?? [],
        sensitiveByMember: Object.fromEntries(
          ((sensitive as SensitiveRow[] | null) ?? []).map((r) => [r.trip_member_id, sensitiveFromRow(r)]),
        ),
        flightsByEvent: Object.fromEntries(
          ((flights as FlightDetailsRow[] | null) ?? []).map((r) => [r.event_id, flightDetailsFromRow(r)]),
        ),
      },
      loadingActiveTrip: false,
    })

    const patchActive = (fn: (t: TripRecord) => TripRecord) => {
      const cur = get().activeTripData
      if (cur && cur.id === id) set({ activeTripData: fn(cur) })
    }

    realtimeChannel = supabase
      .channel(`trip-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') return
        patchActive((t) => ({ ...t, trip: tripFromRow(payload.new as TripRow) }))
        get().loadTrips()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') patchActive((t) => ({ ...t, team: removeById(t.team, (payload.old as MemberRow).id) }))
        else patchActive((t) => ({ ...t, team: upsertById(t.team, memberFromRow(payload.new as MemberRow)) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_member_sensitive', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const removedId = (payload.old as SensitiveRow).trip_member_id
          patchActive((t) => {
            const next = { ...t.sensitiveByMember }
            delete next[removedId]
            return { ...t, sensitiveByMember: next }
          })
        } else {
          const row = payload.new as SensitiveRow
          patchActive((t) => ({ ...t, sensitiveByMember: { ...t.sensitiveByMember, [row.trip_member_id]: sensitiveFromRow(row) } }))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE')
          patchActive((t) => ({ ...t, destinations: removeById(t.destinations, (payload.old as DestinationRow).id) }))
        else patchActive((t) => ({ ...t, destinations: upsertById(t.destinations, destinationFromRow(payload.new as DestinationRow)) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const removedId = (payload.old as EventRow).id
          patchActive((t) => {
            const nextFlights = { ...t.flightsByEvent }
            delete nextFlights[removedId]
            return { ...t, events: removeById(t.events, removedId), flightsByEvent: nextFlights }
          })
        } else patchActive((t) => ({ ...t, events: upsertById(t.events, eventFromRow(payload.new as EventRow)) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flight_details', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const removedId = (payload.old as FlightDetailsRow).event_id
          patchActive((t) => {
            const next = { ...t.flightsByEvent }
            delete next[removedId]
            return { ...t, flightsByEvent: next }
          })
        } else {
          const row = payload.new as FlightDetailsRow
          patchActive((t) => ({ ...t, flightsByEvent: { ...t.flightsByEvent, [row.event_id]: flightDetailsFromRow(row) } }))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') patchActive((t) => ({ ...t, expenses: removeById(t.expenses, (payload.old as ExpenseRow).id) }))
        else patchActive((t) => ({ ...t, expenses: upsertById(t.expenses, expenseFromRow(payload.new as ExpenseRow)) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_options', filter: `trip_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'DELETE') patchActive((t) => ({ ...t, options: removeById(t.options, (payload.old as OptionRow).id) }))
        else patchActive((t) => ({ ...t, options: upsertById(t.options, optionFromRow(payload.new as OptionRow)) }))
      })
      .subscribe()
  },

  createTrip: async (name) => {
    const session = get().session
    if (!session) return
    const blank = makeBlankTrip('unused', name || 'New Trip')
    const tripId = crypto.randomUUID()
    const { error } = await supabase.from('trips').insert({ id: tripId, ...tripToRow(blank.trip), created_by: session.user.id })
    if (error) return
    const displayName = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Trip Lead'
    await ensureSelfMembership(tripId, session.user.id, session.user.email!, displayName)
    await get().loadTrips()
    await get().switchTrip(tripId)
  },

  archiveTrip: async (id) => {
    set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, archived: true } : t)) }))
    await supabase.from('trips').update({ archived: true }).eq('id', id)
    if (get().activeTripId === id) {
      const next = get().trips.find((t) => !t.archived)
      if (next) get().switchTrip(next.id)
    }
  },
  unarchiveTrip: async (id) => {
    set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, archived: false } : t)) }))
    await supabase.from('trips').update({ archived: false }).eq('id', id)
  },
  deleteTrip: async (id) => {
    const wasActive = get().activeTripId === id
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }))
    await supabase.from('trips').delete().eq('id', id)
    if (wasActive) {
      const next = get().trips.find((t) => !t.archived) ?? get().trips[0]
      if (next) get().switchTrip(next.id)
      else set({ activeTripId: null, activeTripData: null })
    }
  },

  updateTrip: (patch) => {
    const id = get().activeTripId
    if (!id) return
    set((s) => ({
      activeTripData: s.activeTripData ? { ...s.activeTripData, trip: { ...s.activeTripData.trip, ...patch } } : s.activeTripData,
      trips: s.trips.map((t) => (t.id === id ? { ...t, trip: { ...t.trip, ...patch } } : t)),
    }))
    if (tripNameDebounce) clearTimeout(tripNameDebounce)
    tripNameDebounce = setTimeout(() => {
      supabase.from('trips').update(tripToRow(patch)).eq('id', id)
    }, 500)
  },

  addDestination: (d) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const id = crypto.randomUUID()
    const item: Destination = { ...d, id }
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, destinations: [...s.activeTripData.destinations, item] } } : {}))
    supabase.from('destinations').insert({ id, trip_id: tripId, ...destinationToRow(d) })
  },
  updateDestination: (id, patch) => {
    set((s) =>
      s.activeTripData
        ? { activeTripData: { ...s.activeTripData, destinations: s.activeTripData.destinations.map((d) => (d.id === id ? { ...d, ...patch } : d)) } }
        : {},
    )
    supabase.from('destinations').update(destinationToRow(patch)).eq('id', id)
  },
  removeDestination: (id) => {
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, destinations: removeById(s.activeTripData.destinations, id) } } : {}))
    supabase.from('destinations').delete().eq('id', id)
  },

  addTeamMember: (m) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const id = crypto.randomUUID()
    const item: TeamMember = { ...m, id }
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, team: [...s.activeTripData.team, item] } } : {}))
    supabase.from('trip_members').insert({ id, trip_id: tripId, ...memberToRow(m) })
  },
  updateTeamMember: (id, patch) => {
    set((s) =>
      s.activeTripData
        ? { activeTripData: { ...s.activeTripData, team: s.activeTripData.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) } }
        : {},
    )
    supabase.from('trip_members').update(memberToRow(patch)).eq('id', id)
  },
  removeTeamMember: (id) => {
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, team: removeById(s.activeTripData.team, id) } } : {}))
    supabase.from('trip_members').delete().eq('id', id)
  },

  updateMemberSensitive: (memberId, patch) => {
    const tripId = get().activeTripId
    if (!tripId) return
    set((s) =>
      s.activeTripData
        ? {
            activeTripData: {
              ...s.activeTripData,
              sensitiveByMember: {
                ...s.activeTripData.sensitiveByMember,
                [memberId]: { ...s.activeTripData.sensitiveByMember[memberId], ...patch },
              },
            },
          }
        : {},
    )
    supabase
      .from('trip_member_sensitive')
      .upsert({ trip_member_id: memberId, trip_id: tripId, ...sensitiveToRow(patch) }, { onConflict: 'trip_member_id' })
  },

  uploadPassportPhoto: async (memberId, file) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const ext = file.type.includes('png') ? 'png' : 'jpg'
    const path = `${tripId}/${memberId}.${ext}`
    const { error } = await supabase.storage.from('passport-photos').upload(path, file, { upsert: true })
    if (error) return
    get().updateMemberSensitive(memberId, { passportPhotoPath: path })
  },

  getPassportPhotoUrl: async (path) => {
    const { data, error } = await supabase.storage.from('passport-photos').createSignedUrl(path, 3600)
    if (error || !data) return null
    return data.signedUrl
  },

  addEvent: (e) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const id = crypto.randomUUID()
    const item: CalendarEvent = { ...e, id }
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, events: [...s.activeTripData.events, item] } } : {}))
    supabase.from('events').insert({ id, trip_id: tripId, ...eventToRow(e) })
  },
  updateEvent: (id, patch) => {
    set((s) =>
      s.activeTripData
        ? { activeTripData: { ...s.activeTripData, events: s.activeTripData.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) } }
        : {},
    )
    supabase.from('events').update(eventToRow(patch)).eq('id', id)
  },
  removeEvent: (id) => {
    set((s) => {
      if (!s.activeTripData) return {}
      const nextFlights = { ...s.activeTripData.flightsByEvent }
      delete nextFlights[id]
      return { activeTripData: { ...s.activeTripData, events: removeById(s.activeTripData.events, id), flightsByEvent: nextFlights } }
    })
    supabase.from('events').delete().eq('id', id)
  },

  updateFlightDetails: (eventId, patch) => {
    const tripId = get().activeTripId
    if (!tripId) return
    set((s) => {
      if (!s.activeTripData) return {}
      const prev: FlightDetails = s.activeTripData.flightsByEvent[eventId] ?? { eventId, seats: {} }
      const merged: FlightDetails = { ...prev, ...patch }
      return { activeTripData: { ...s.activeTripData, flightsByEvent: { ...s.activeTripData.flightsByEvent, [eventId]: merged } } }
    })
    supabase.from('flight_details').upsert({ event_id: eventId, trip_id: tripId, ...flightDetailsToRow(patch) }, { onConflict: 'event_id' })
  },

  setFlightSeat: (eventId, memberId, seat) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const current = get().activeTripData?.flightsByEvent[eventId]
    const nextSeats = { ...(current?.seats ?? {}), [memberId]: seat }
    get().updateFlightDetails(eventId, { seats: nextSeats })
  },

  addFlight: (event, flight) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const id = crypto.randomUUID()
    const item: CalendarEvent = { ...event, id, category: 'Flights' }
    set((s) =>
      s.activeTripData
        ? {
            activeTripData: {
              ...s.activeTripData,
              events: [...s.activeTripData.events, item],
              flightsByEvent: { ...s.activeTripData.flightsByEvent, [id]: { ...flight, eventId: id, seats: {} } },
            },
          }
        : {},
    )
    supabase.from('events').insert({ id, trip_id: tripId, ...eventToRow(item) })
    supabase.from('flight_details').insert({ event_id: id, trip_id: tripId, ...flightDetailsToRow(flight) })
  },

  addExpense: (e) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const id = crypto.randomUUID()
    const item: Expense = { ...e, id }
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, expenses: [...s.activeTripData.expenses, item] } } : {}))
    supabase.from('expenses').insert({ id, trip_id: tripId, ...expenseToRow(e) })
  },
  removeExpense: (id) => {
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, expenses: removeById(s.activeTripData.expenses, id) } } : {}))
    supabase.from('expenses').delete().eq('id', id)
  },

  toggleOption: (id) => {
    const opt = get().activeTripData?.options.find((o) => o.id === id)
    if (!opt) return
    const nextVal = !opt.addedToSchedule
    set((s) =>
      s.activeTripData
        ? { activeTripData: { ...s.activeTripData, options: s.activeTripData.options.map((o) => (o.id === id ? { ...o, addedToSchedule: nextVal } : o)) } }
        : {},
    )
    supabase.from('activity_options').update({ added_to_schedule: nextVal }).eq('id', id)
  },
  addOption: (o) => {
    const tripId = get().activeTripId
    if (!tripId) return
    const id = crypto.randomUUID()
    const item: ActivityOption = { ...o, id }
    set((s) => (s.activeTripData ? { activeTripData: { ...s.activeTripData, options: [...s.activeTripData.options, item] } } : {}))
    supabase.from('activity_options').insert({ id, trip_id: tripId, ...optionToRow(o) })
  },

  resetActiveTripToSample: async () => {
    const tripId = get().activeTripId
    if (!tripId) return
    const sample = makeSampleTrip('unused')

    await Promise.all([
      supabase.from('destinations').delete().eq('trip_id', tripId),
      supabase.from('events').delete().eq('trip_id', tripId),
      supabase.from('expenses').delete().eq('trip_id', tripId),
      supabase.from('activity_options').delete().eq('trip_id', tripId),
    ])
    await supabase.from('trips').update(tripToRow(sample.trip)).eq('id', tripId)

    const destIdMap = new Map<string, string>()
    for (const d of sample.destinations) {
      const newId = crypto.randomUUID()
      destIdMap.set(d.id, newId)
      await supabase.from('destinations').insert({ id: newId, trip_id: tripId, ...destinationToRow(d) })
    }
    for (const e of sample.events) {
      await supabase
        .from('events')
        .insert({ id: crypto.randomUUID(), trip_id: tripId, ...eventToRow(e), destination_id: destIdMap.get(e.destinationId) ?? null })
    }
    for (const ex of sample.expenses) {
      await supabase.from('expenses').insert({
        id: crypto.randomUUID(),
        trip_id: tripId,
        ...expenseToRow(ex),
        destination_id: ex.destinationId ? (destIdMap.get(ex.destinationId) ?? null) : null,
      })
    }
    for (const o of sample.options) {
      await supabase
        .from('activity_options')
        .insert({ id: crypto.randomUUID(), trip_id: tripId, ...optionToRow(o), destination_id: destIdMap.get(o.destinationId) ?? o.destinationId })
    }

    await get().switchTrip(tripId)
  },
}))

const EMPTY_TRIP: TripRecord = {
  id: '',
  archived: false,
  createdAt: '',
  trip: { name: '', organization: '', startDate: '', endDate: '', totalBudget: 0 },
  destinations: [],
  team: [],
  events: [],
  expenses: [],
  options: [],
  sensitiveByMember: {},
  flightsByEvent: {},
}

export function useActiveTrip(): TripRecord {
  return useStore((s) => s.activeTripData ?? EMPTY_TRIP)
}
