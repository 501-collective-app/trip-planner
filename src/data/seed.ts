import type { Expense, TripRecord } from '../types'

// Sample data for a 501 Collective team trip. Everything here is
// editable from the Settings, Team, Budget and Activities tabs —
// swap it out for your real trip details.

function usd(amount: number): Pick<Expense, 'amount' | 'currency' | 'originalAmount' | 'fxRateToUsd'> {
  return { amount, currency: 'USD', originalAmount: amount, fxRateToUsd: 1 }
}

export function makeSampleTrip(id: string): TripRecord {
  return {
    id,
    archived: false,
    createdAt: new Date().toISOString(),
    trip: {
      name: '501 Collective Field Trip',
      organization: '501 Collective',
      startDate: '2026-09-21',
      endDate: '2026-10-04',
      totalBudget: 42000,
    },
    destinations: [
      {
        id: 'dest-nairobi',
        city: 'Nairobi',
        country: 'Kenya',
        lat: -1.2921,
        lon: 36.8219,
        arrive: '2026-09-21',
        depart: '2026-09-26',
        notes: 'Home base for partner meetings and the Kibera program visit.',
      },
      {
        id: 'dest-kampala',
        city: 'Kampala',
        country: 'Uganda',
        lat: 0.3476,
        lon: 32.5825,
        arrive: '2026-09-26',
        depart: '2026-09-30',
        notes: 'Site visits with the regional partner team.',
      },
      {
        id: 'dest-kigali',
        city: 'Kigali',
        country: 'Rwanda',
        lat: -1.9441,
        lon: 30.0619,
        arrive: '2026-09-30',
        depart: '2026-10-04',
        notes: 'Wrap-up, donor storytelling shoot, and closing dinner.',
      },
    ],
    team: [
      { id: 'tm-tom', name: 'Tom Baker', role: 'Trip Lead', email: 'tom@tombaker.co', color: '#81e0ae', status: 'confirmed', memberType: 'trip_leader' },
      { id: 'tm-2', name: 'Maya Ortiz', role: 'Program Director', email: 'maya@example.org', color: '#ffc800', status: 'confirmed', memberType: 'trip_leader' },
      { id: 'tm-3', name: 'Jonah Reyes', role: 'Videographer', email: 'jonah@example.org', color: '#2563eb', status: 'confirmed', memberType: 'team_member' },
      { id: 'tm-4', name: 'Priya Nair', role: 'Finance Lead', email: 'priya@example.org', color: '#ea580c', status: 'invited', memberType: 'team_member' },
      { id: 'tm-5', name: 'Sam Whitfield', role: 'Logistics', email: 'sam@example.org', color: '#dc2626', status: 'invited', memberType: 'team_member' },
    ],
    events: [
      { id: 'ev-1', date: '2026-09-21', time: '09:00', title: 'Team flights depart', destinationId: 'dest-nairobi', category: 'Flights', cost: 14200, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'], notes: 'Meet at gate 2 hours early, group booking reference in email.' },
      { id: 'ev-2', date: '2026-09-21', time: '20:30', title: 'Arrive Nairobi, hotel check-in', destinationId: 'dest-nairobi', category: 'Lodging', cost: 0, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'] },
      { id: 'ev-3', date: '2026-09-22', time: '10:00', title: 'Partner kickoff meeting', destinationId: 'dest-nairobi', category: 'Other', cost: 0, attendeeIds: ['tm-tom', 'tm-2'] },
      { id: 'ev-4', date: '2026-09-22', time: '15:00', title: 'Kibera program site visit', destinationId: 'dest-nairobi', category: 'Activities', cost: 0, attendeeIds: ['tm-tom', 'tm-2', 'tm-3'] },
      { id: 'ev-5', date: '2026-09-23', time: '09:00', title: 'Classroom filming day', destinationId: 'dest-nairobi', category: 'Activities', cost: 0, attendeeIds: ['tm-2', 'tm-3'] },
      { id: 'ev-6', date: '2026-09-24', time: '08:00', title: 'Day trip: Nairobi National Park', destinationId: 'dest-nairobi', category: 'Activities', cost: 900, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'], fromOptionId: 'opt-nbo-safari' },
      { id: 'ev-7', date: '2026-09-25', time: '18:00', title: 'Team dinner with partner staff', destinationId: 'dest-nairobi', category: 'Food', cost: 380, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'] },
      { id: 'ev-8', date: '2026-09-26', time: '07:30', title: 'Ground transport to Kampala', destinationId: 'dest-kampala', category: 'Ground Transport', cost: 620, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'] },
      { id: 'ev-9', date: '2026-09-27', time: '10:00', title: 'Regional office walkthrough', destinationId: 'dest-kampala', category: 'Other', cost: 0, attendeeIds: ['tm-tom', 'tm-4', 'tm-5'] },
      { id: 'ev-10', date: '2026-09-28', time: '09:00', title: 'Rural school program visit', destinationId: 'dest-kampala', category: 'Activities', cost: 0, attendeeIds: ['tm-tom', 'tm-2', 'tm-3'] },
      { id: 'ev-11', date: '2026-09-29', time: '17:00', title: 'Donor update call (from hotel)', destinationId: 'dest-kampala', category: 'Other', cost: 0, attendeeIds: ['tm-tom', 'tm-4'] },
      { id: 'ev-12', date: '2026-09-30', time: '08:00', title: 'Flight to Kigali', destinationId: 'dest-kigali', category: 'Flights', cost: 1450, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'] },
      { id: 'ev-13', date: '2026-10-01', time: '10:00', title: 'Donor storytelling shoot', destinationId: 'dest-kigali', category: 'Activities', cost: 0, attendeeIds: ['tm-2', 'tm-3'] },
      { id: 'ev-14', date: '2026-10-02', time: '09:00', title: 'Genocide Memorial visit', destinationId: 'dest-kigali', category: 'Activities', cost: 120, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'], fromOptionId: 'opt-kgl-memorial' },
      { id: 'ev-15', date: '2026-10-03', time: '19:00', title: 'Closing dinner + team debrief', destinationId: 'dest-kigali', category: 'Food', cost: 450, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'] },
      { id: 'ev-16', date: '2026-10-04', time: '11:00', title: 'Flights home', destinationId: 'dest-kigali', category: 'Flights', cost: 0, attendeeIds: ['tm-tom', 'tm-2', 'tm-3', 'tm-4', 'tm-5'] },
    ],
    expenses: [
      { id: 'ex-1', date: '2026-08-30', ...usd(14200), category: 'Flights', description: 'Group international flights (5 pax)', destinationId: 'dest-nairobi', paidBy: 'Priya Nair' },
      { id: 'ex-2', date: '2026-09-02', ...usd(1450), category: 'Flights', description: 'Nairobi → Kigali connecting flights', destinationId: 'dest-kigali', paidBy: 'Priya Nair' },
      { id: 'ex-3', date: '2026-09-05', ...usd(3600), category: 'Lodging', description: 'Nairobi hotel, 5 nights x 5 rooms (deposit)', destinationId: 'dest-nairobi', paidBy: 'Priya Nair' },
      { id: 'ex-4', date: '2026-09-05', ...usd(2400), category: 'Lodging', description: 'Kampala guesthouse, 4 nights (deposit)', destinationId: 'dest-kampala', paidBy: 'Priya Nair' },
      { id: 'ex-5', date: '2026-09-08', ...usd(2800), category: 'Lodging', description: 'Kigali hotel, 4 nights (deposit)', destinationId: 'dest-kigali', paidBy: 'Priya Nair' },
      { id: 'ex-6', date: '2026-09-10', ...usd(620), category: 'Ground Transport', description: 'Nairobi → Kampala private van', destinationId: 'dest-kampala', paidBy: 'Sam Whitfield' },
      { id: 'ex-7', date: '2026-09-12', ...usd(900), category: 'Activities', description: 'Nairobi National Park day trip, 5 pax', destinationId: 'dest-nairobi', paidBy: 'Sam Whitfield' },
      { id: 'ex-8', date: '2026-09-14', ...usd(340), category: 'Supplies', description: 'Filming gear rental + extra batteries', paidBy: 'Jonah Reyes' },
    ],
    options: [
      { id: 'opt-nbo-safari', destinationId: 'dest-nairobi', name: 'Nairobi National Park day trip', description: 'Half-day game drive, closest safari park to a capital city in the world.', cost: 900, category: 'Activities', addedToSchedule: true },
      { id: 'opt-nbo-giraffe', destinationId: 'dest-nairobi', name: 'Giraffe Centre visit', description: 'Short conservation visit, easy to combine with the park day.', cost: 150, category: 'Activities', addedToSchedule: false },
      { id: 'opt-nbo-market', destinationId: 'dest-nairobi', name: 'Maasai Market afternoon', description: 'Craft market, good for team downtime and souvenirs.', cost: 0, category: 'Other', addedToSchedule: false },
      { id: 'opt-kla-source', destinationId: 'dest-kampala', name: 'Source of the Nile day trip (Jinja)', description: 'Full-day trip, ~2hrs each way, rafting optional.', cost: 1100, category: 'Activities', addedToSchedule: false },
      { id: 'opt-kla-market', destinationId: 'dest-kampala', name: 'Owino Market walk', description: 'Local guide, good story material for donor updates.', cost: 200, category: 'Activities', addedToSchedule: false },
      { id: 'opt-kgl-memorial', destinationId: 'dest-kigali', name: 'Kigali Genocide Memorial', description: 'Essential context visit, allow a quiet afternoon after.', cost: 120, category: 'Activities', addedToSchedule: true },
      { id: 'opt-kgl-coop', destinationId: 'dest-kigali', name: "Women's cooperative coffee tour", description: 'Farm-to-cup tour with a partner cooperative, good b-roll.', cost: 300, category: 'Activities', addedToSchedule: false },
    ],
    sensitiveByMember: {},
  }
}

export function makeBlankTrip(id: string, name = 'New Trip'): TripRecord {
  const today = new Date()
  const in7 = new Date(today.getTime() + 7 * 86400000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    id,
    archived: false,
    createdAt: new Date().toISOString(),
    trip: {
      name,
      organization: '501 Collective',
      startDate: iso(today),
      endDate: iso(in7),
      totalBudget: 0,
    },
    destinations: [],
    team: [],
    events: [],
    expenses: [],
    options: [],
    sensitiveByMember: {},
  }
}
