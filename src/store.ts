import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from './lib/id'
import { makeBlankTrip, makeSampleTrip } from './data/seed'
import type {
  ActivityOption,
  CalendarEvent,
  Destination,
  Expense,
  TeamMember,
  Trip,
  TripRecord,
} from './types'

interface Store {
  trips: TripRecord[]
  activeTripId: string

  switchTrip: (id: string) => void
  createTrip: (name: string) => string
  archiveTrip: (id: string) => void
  unarchiveTrip: (id: string) => void
  deleteTrip: (id: string) => void

  updateTrip: (patch: Partial<Trip>) => void

  addDestination: (d: Omit<Destination, 'id'>) => void
  updateDestination: (id: string, patch: Partial<Destination>) => void
  removeDestination: (id: string) => void

  addTeamMember: (m: Omit<TeamMember, 'id'>) => void
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void
  removeTeamMember: (id: string) => void

  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  removeEvent: (id: string) => void

  addExpense: (e: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void

  toggleOption: (id: string) => void
  addOption: (o: Omit<ActivityOption, 'id'>) => void

  resetActiveTripToSample: () => void
}

function updateActiveTrip(trips: TripRecord[], activeTripId: string, fn: (t: TripRecord) => TripRecord): TripRecord[] {
  return trips.map((t) => (t.id === activeTripId ? fn(t) : t))
}

const initialId = nanoid()

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      trips: [makeSampleTrip(initialId)],
      activeTripId: initialId,

      switchTrip: (id) => set({ activeTripId: id }),

      createTrip: (name) => {
        const id = nanoid()
        const trip = makeBlankTrip(id, name || 'New Trip')
        set((s) => ({ trips: [...s.trips, trip], activeTripId: id }))
        return id
      },

      archiveTrip: (id) => {
        set((s) => {
          const trips = s.trips.map((t) => (t.id === id ? { ...t, archived: true } : t))
          let activeTripId = s.activeTripId
          if (activeTripId === id) {
            const nextActive = trips.find((t) => !t.archived)
            activeTripId = nextActive?.id ?? id
          }
          return { trips, activeTripId }
        })
      },

      unarchiveTrip: (id) =>
        set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, archived: false } : t)) })),

      deleteTrip: (id) => {
        set((s) => {
          const trips = s.trips.filter((t) => t.id !== id)
          let activeTripId = s.activeTripId
          if (activeTripId === id) {
            activeTripId = trips.find((t) => !t.archived)?.id ?? trips[0]?.id ?? ''
          }
          if (trips.length === 0) {
            const fresh = makeBlankTrip(nanoid())
            return { trips: [fresh], activeTripId: fresh.id }
          }
          return { trips, activeTripId }
        })
      },

      updateTrip: (patch) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({ ...t, trip: { ...t.trip, ...patch } })),
        })),

      addDestination: (d) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            destinations: [...t.destinations, { ...d, id: nanoid() }],
          })),
        })),
      updateDestination: (id, patch) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            destinations: t.destinations.map((d) => (d.id === id ? { ...d, ...patch } : d)),
          })),
        })),
      removeDestination: (id) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            destinations: t.destinations.filter((d) => d.id !== id),
          })),
        })),

      addTeamMember: (m) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({ ...t, team: [...t.team, { ...m, id: nanoid() }] })),
        })),
      updateTeamMember: (id, patch) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            team: t.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          })),
        })),
      removeTeamMember: (id) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({ ...t, team: t.team.filter((m) => m.id !== id) })),
        })),

      addEvent: (e) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({ ...t, events: [...t.events, { ...e, id: nanoid() }] })),
        })),
      updateEvent: (id, patch) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            events: t.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          })),
        })),
      removeEvent: (id) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({ ...t, events: t.events.filter((e) => e.id !== id) })),
        })),

      addExpense: (e) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            expenses: [...t.expenses, { ...e, id: nanoid() }],
          })),
        })),
      removeExpense: (id) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            expenses: t.expenses.filter((e) => e.id !== id),
          })),
        })),

      toggleOption: (id) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            options: t.options.map((o) => (o.id === id ? { ...o, addedToSchedule: !o.addedToSchedule } : o)),
          })),
        })),
      addOption: (o) =>
        set((s) => ({
          trips: updateActiveTrip(s.trips, s.activeTripId, (t) => ({
            ...t,
            options: [...t.options, { ...o, id: nanoid() }],
          })),
        })),

      resetActiveTripToSample: () => {
        const s = get()
        const fresh = makeSampleTrip(s.activeTripId)
        set((s2) => ({ trips: s2.trips.map((t) => (t.id === s2.activeTripId ? fresh : t)) }))
      },
    }),
    { name: '501-trip-planner' },
  ),
)

export function getActiveTrip(s: Store): TripRecord {
  return s.trips.find((t) => t.id === s.activeTripId) ?? s.trips[0]
}

export function useActiveTrip(): TripRecord {
  return useStore(getActiveTrip)
}
