import type { CalendarEvent, Destination, Expense, TripState } from '../types'
import { toLocalIso, addDaysIso, todayIso as todayIsoImpl } from './date'

export function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function scheduledActivityCost(events: CalendarEvent[]): number {
  return events.reduce((sum, e) => sum + (e.cost ?? 0), 0)
}

export function destinationForDate(destinations: Destination[], date: string): Destination | undefined {
  return destinations.find((d) => date >= d.arrive && date < d.depart) ?? destinations.find((d) => date === d.depart)
}

export function destinationsForDateRange(destinations: Destination[], fromDate: string, toDate: string): Destination[] {
  return destinations.filter((d) => d.arrive <= toDate && d.depart >= fromDate)
}

export function spentByCategory(expenses: Expense[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of expenses) {
    out[e.category] = (out[e.category] ?? 0) + e.amount
  }
  return out
}

export function tripDateRange(state: TripState): string[] {
  const dates: string[] = []
  const cur = new Date(state.trip.startDate + 'T00:00:00')
  const end = new Date(state.trip.endDate + 'T00:00:00')
  while (cur <= end) {
    dates.push(toLocalIso(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export const todayIso = todayIsoImpl
export function tomorrowIso(): string {
  return addDaysIso(todayIsoImpl(), 1)
}
