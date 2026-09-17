import type { ActivityOption, CalendarEvent, Contact, Destination, Expense, FlightDetails, MemberSensitive, TeamMember, Trip } from '../types'

// Supabase rows are snake_case; the app's types are camelCase. These convert both ways.

export interface TripRow {
  id: string
  name: string
  organization: string
  start_date: string
  end_date: string
  total_budget: number
  archived: boolean
  created_by: string | null
  created_at: string
  dropbox_folder: string | null
}
export function tripFromRow(r: TripRow): Trip {
  return {
    name: r.name,
    organization: r.organization,
    startDate: r.start_date,
    endDate: r.end_date,
    totalBudget: r.total_budget,
    dropboxFolder: r.dropbox_folder ?? undefined,
  }
}
export function tripToRow(t: Partial<Trip>) {
  const row: Record<string, unknown> = {}
  if (t.name !== undefined) row.name = t.name
  if (t.organization !== undefined) row.organization = t.organization
  if (t.startDate !== undefined) row.start_date = t.startDate
  if (t.endDate !== undefined) row.end_date = t.endDate
  if (t.totalBudget !== undefined) row.total_budget = t.totalBudget
  if (t.dropboxFolder !== undefined) row.dropbox_folder = t.dropboxFolder || null
  return row
}

export interface MemberRow {
  id: string
  trip_id: string
  user_id: string | null
  email: string
  name: string
  role: string
  color: string
  status: 'confirmed' | 'invited'
  member_type: 'trip_leader' | 'team_member'
}
export function memberFromRow(r: MemberRow): TeamMember {
  return { id: r.id, name: r.name, role: r.role, email: r.email, color: r.color, status: r.status, memberType: r.member_type }
}
export function memberToRow(m: Partial<TeamMember>) {
  const row: Record<string, unknown> = {}
  if (m.name !== undefined) row.name = m.name
  if (m.role !== undefined) row.role = m.role
  if (m.email !== undefined) row.email = m.email
  if (m.color !== undefined) row.color = m.color
  if (m.status !== undefined) row.status = m.status
  if (m.memberType !== undefined) row.member_type = m.memberType
  return row
}

export interface SensitiveRow {
  trip_member_id: string
  trip_id: string
  legal_name: string | null
  emergency_contact: string | null
  passport_photo_path: string | null
}
export function sensitiveFromRow(r: SensitiveRow): MemberSensitive {
  return {
    legalName: r.legal_name ?? undefined,
    emergencyContact: r.emergency_contact ?? undefined,
    passportPhotoPath: r.passport_photo_path ?? undefined,
  }
}
export function sensitiveToRow(s: Partial<MemberSensitive>) {
  const row: Record<string, unknown> = {}
  if (s.legalName !== undefined) row.legal_name = s.legalName
  if (s.emergencyContact !== undefined) row.emergency_contact = s.emergencyContact
  if (s.passportPhotoPath !== undefined) row.passport_photo_path = s.passportPhotoPath
  return row
}

export interface DestinationRow {
  id: string
  trip_id: string
  city: string
  country: string
  lat: number
  lon: number
  arrive: string
  depart: string
  notes: string | null
}
export function destinationFromRow(r: DestinationRow): Destination {
  return { id: r.id, city: r.city, country: r.country, lat: r.lat, lon: r.lon, arrive: r.arrive, depart: r.depart, notes: r.notes ?? undefined }
}
export function destinationToRow(d: Partial<Destination>) {
  const row: Record<string, unknown> = {}
  if (d.city !== undefined) row.city = d.city
  if (d.country !== undefined) row.country = d.country
  if (d.lat !== undefined) row.lat = d.lat
  if (d.lon !== undefined) row.lon = d.lon
  if (d.arrive !== undefined) row.arrive = d.arrive
  if (d.depart !== undefined) row.depart = d.depart
  if (d.notes !== undefined) row.notes = d.notes
  return row
}

export interface EventRow {
  id: string
  trip_id: string
  date: string
  time: string | null
  title: string
  destination_id: string
  category: string
  cost: number | null
  attendee_ids: string[]
  notes: string | null
  from_option_id: string | null
}
export function eventFromRow(r: EventRow): CalendarEvent {
  return {
    id: r.id,
    date: r.date,
    time: r.time ?? undefined,
    title: r.title,
    destinationId: r.destination_id,
    category: r.category as CalendarEvent['category'],
    cost: r.cost ?? undefined,
    attendeeIds: r.attendee_ids ?? [],
    notes: r.notes ?? undefined,
    fromOptionId: r.from_option_id ?? undefined,
  }
}
export function eventToRow(e: Partial<CalendarEvent>) {
  const row: Record<string, unknown> = {}
  if (e.date !== undefined) row.date = e.date
  if (e.time !== undefined) row.time = e.time
  if (e.title !== undefined) row.title = e.title
  if (e.destinationId !== undefined) row.destination_id = e.destinationId
  if (e.category !== undefined) row.category = e.category
  if (e.cost !== undefined) row.cost = e.cost
  if (e.attendeeIds !== undefined) row.attendee_ids = e.attendeeIds
  if (e.notes !== undefined) row.notes = e.notes
  if (e.fromOptionId !== undefined) row.from_option_id = e.fromOptionId
  return row
}

export interface ExpenseRow {
  id: string
  trip_id: string
  date: string
  amount: number
  currency: string
  original_amount: number
  fx_rate_to_usd: number
  category: string
  description: string
  destination_id: string | null
  paid_by: string | null
  receipt_path: string | null
  receipt_url: string | null
}
export function expenseFromRow(r: ExpenseRow): Expense {
  return {
    id: r.id,
    date: r.date,
    amount: r.amount,
    currency: r.currency,
    originalAmount: r.original_amount,
    fxRateToUsd: r.fx_rate_to_usd,
    category: r.category as Expense['category'],
    description: r.description,
    destinationId: r.destination_id ?? undefined,
    paidBy: r.paid_by ?? undefined,
    receiptPath: r.receipt_path ?? undefined,
    receiptUrl: r.receipt_url ?? undefined,
  }
}
export function expenseToRow(e: Partial<Expense>) {
  const row: Record<string, unknown> = {}
  if (e.date !== undefined) row.date = e.date
  if (e.amount !== undefined) row.amount = e.amount
  if (e.currency !== undefined) row.currency = e.currency
  if (e.originalAmount !== undefined) row.original_amount = e.originalAmount
  if (e.fxRateToUsd !== undefined) row.fx_rate_to_usd = e.fxRateToUsd
  if (e.category !== undefined) row.category = e.category
  if (e.description !== undefined) row.description = e.description
  if (e.destinationId !== undefined) row.destination_id = e.destinationId
  if (e.paidBy !== undefined) row.paid_by = e.paidBy
  if (e.receiptPath !== undefined) row.receipt_path = e.receiptPath
  if (e.receiptUrl !== undefined) row.receipt_url = e.receiptUrl
  return row
}

export interface FlightDetailsRow {
  event_id: string
  trip_id: string
  airline: string | null
  flight_number: string | null
  departure_airport: string | null
  arrival_airport: string | null
  departure_time: string | null
  arrival_time: string | null
  seats: Record<string, string>
}
export function flightDetailsFromRow(r: FlightDetailsRow): FlightDetails {
  return {
    eventId: r.event_id,
    airline: r.airline ?? undefined,
    flightNumber: r.flight_number ?? undefined,
    departureAirport: r.departure_airport ?? undefined,
    arrivalAirport: r.arrival_airport ?? undefined,
    departureTime: r.departure_time ?? undefined,
    arrivalTime: r.arrival_time ?? undefined,
    seats: r.seats ?? {},
  }
}
export function flightDetailsToRow(f: Partial<FlightDetails>) {
  const row: Record<string, unknown> = {}
  if (f.airline !== undefined) row.airline = f.airline
  if (f.flightNumber !== undefined) row.flight_number = f.flightNumber
  if (f.departureAirport !== undefined) row.departure_airport = f.departureAirport
  if (f.arrivalAirport !== undefined) row.arrival_airport = f.arrivalAirport
  if (f.departureTime !== undefined) row.departure_time = f.departureTime
  if (f.arrivalTime !== undefined) row.arrival_time = f.arrivalTime
  if (f.seats !== undefined) row.seats = f.seats
  return row
}

export interface ContactRow {
  id: string
  trip_id: string
  name: string
  role: string | null
  phone: string | null
  email: string | null
  notes: string | null
}
export function contactFromRow(r: ContactRow): Contact {
  return { id: r.id, name: r.name, role: r.role ?? undefined, phone: r.phone ?? undefined, email: r.email ?? undefined, notes: r.notes ?? undefined }
}
export function contactToRow(c: Partial<Contact>) {
  const row: Record<string, unknown> = {}
  if (c.name !== undefined) row.name = c.name
  if (c.role !== undefined) row.role = c.role
  if (c.phone !== undefined) row.phone = c.phone
  if (c.email !== undefined) row.email = c.email
  if (c.notes !== undefined) row.notes = c.notes
  return row
}

export interface OptionRow {
  id: string
  trip_id: string
  destination_id: string
  name: string
  description: string | null
  cost: number
  category: string
  added_to_schedule: boolean
}
export function optionFromRow(r: OptionRow): ActivityOption {
  return {
    id: r.id,
    destinationId: r.destination_id,
    name: r.name,
    description: r.description ?? '',
    cost: r.cost,
    category: r.category as ActivityOption['category'],
    addedToSchedule: r.added_to_schedule,
  }
}
export function optionToRow(o: Partial<ActivityOption>) {
  const row: Record<string, unknown> = {}
  if (o.destinationId !== undefined) row.destination_id = o.destinationId
  if (o.name !== undefined) row.name = o.name
  if (o.description !== undefined) row.description = o.description
  if (o.cost !== undefined) row.cost = o.cost
  if (o.category !== undefined) row.category = o.category
  if (o.addedToSchedule !== undefined) row.added_to_schedule = o.addedToSchedule
  return row
}
