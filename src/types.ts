export type ExpenseCategory =
  | 'Lodging'
  | 'Flights'
  | 'Ground Transport'
  | 'Food'
  | 'Activities'
  | 'Supplies'
  | 'Other'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Lodging',
  'Flights',
  'Ground Transport',
  'Food',
  'Activities',
  'Supplies',
  'Other',
]

export interface Destination {
  id: string
  city: string
  country: string
  lat: number
  lon: number
  arrive: string // ISO date
  depart: string // ISO date
  notes?: string
}

export type MemberType = 'trip_leader' | 'team_member'

export interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  color: string
  status: 'confirmed' | 'invited'
  memberType: MemberType
}

// Only present for members you're allowed to see (trip leaders see everyone's;
// everyone else sees none, enforced server-side by RLS, not just hidden in the UI).
export interface MemberSensitive {
  legalName?: string
  emergencyContact?: string
  passportPhotoPath?: string
}

export interface CalendarEvent {
  id: string
  date: string // ISO date
  time?: string // "HH:mm"
  title: string
  destinationId: string
  category: ExpenseCategory
  cost?: number
  attendeeIds: string[]
  notes?: string
  fromOptionId?: string
}

export interface Expense {
  id: string
  date: string
  amount: number // always USD equivalent, used for all budget math
  currency: string // ISO 4217 code the expense was actually entered in
  originalAmount: number // amount in `currency` as entered
  fxRateToUsd: number // rate used at entry time (1 for USD)
  category: ExpenseCategory
  description: string
  destinationId?: string
  paidBy?: string
  receiptPath?: string // Dropbox path, once uploaded
  receiptUrl?: string // Dropbox shared link, once created
}

export interface ActivityOption {
  id: string
  destinationId: string
  name: string
  description: string
  cost: number
  category: ExpenseCategory
  addedToSchedule: boolean
}

export interface FlightDetails {
  eventId: string
  airline?: string
  flightNumber?: string
  departureAirport?: string // IATA code
  arrivalAirport?: string
  departureTime?: string // ISO datetime
  arrivalTime?: string // ISO datetime
  seats: Record<string, string> // TeamMember.id -> seat, e.g. "14C"
}

export interface Contact {
  id: string
  name: string
  role?: string
  phone?: string
  email?: string
  notes?: string
}

export interface Trip {
  name: string
  organization: string
  startDate: string
  endDate: string
  totalBudget: number
  dropboxFolder?: string // overrides the auto-derived "/<trip name>/Receipts" path
}

export interface TripState {
  trip: Trip
  destinations: Destination[]
  team: TeamMember[]
  events: CalendarEvent[]
  expenses: Expense[]
  options: ActivityOption[]
  sensitiveByMember: Record<string, MemberSensitive> // keyed by TeamMember.id
  flightsByEvent: Record<string, FlightDetails> // keyed by CalendarEvent.id
  contacts: Contact[]
}

export interface TripRecord extends TripState {
  id: string
  archived: boolean
  createdAt: string
}
