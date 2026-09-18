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

export type BudgetTone = 'green' | 'yellow' | 'red'

// Single "status thermometer" reading: red once actually over budget, yellow
// once 95%+ of the budget is spent-or-scheduled, green otherwise. A $0 total
// budget with any spending at all reads as 100%/red — there's no such thing
// as "under" a budget that doesn't exist.
export function budgetStatus(spent: number, committed: number, totalBudget: number): { usedPct: number; tone: BudgetTone } {
  const used = spent + committed
  const usedPct = totalBudget > 0 ? (used / totalBudget) * 100 : used > 0 ? 100 : 0
  const tone: BudgetTone = used > totalBudget ? 'red' : usedPct >= 95 ? 'yellow' : 'green'
  return { usedPct: Math.min(100, Math.max(0, usedPct)), tone }
}

export function destinationForDate(destinations: Destination[], date: string): Destination | undefined {
  return destinations.find((d) => date >= d.arrive && date < d.depart) ?? destinations.find((d) => date === d.depart)
}

// All destinations touching this date, inclusive of both ends — on a normal day
// that's one place, but on a transit day (depart one destination, arrive at the
// next) it returns both, e.g. landing in Romania and driving into Ukraine.
export function destinationsActiveOnDate(destinations: Destination[], date: string): Destination[] {
  return destinations.filter((d) => date >= d.arrive && date <= d.depart)
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
