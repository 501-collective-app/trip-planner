// Date.toISOString() converts to UTC, which silently shifts the calendar date
// for anyone east of UTC (e.g. early morning in Romania/Ukraine reads as
// "yesterday"). These format using local fields instead.

export function toLocalIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayIso(): string {
  return toLocalIso(new Date())
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toLocalIso(d)
}

export function tomorrowIso(): string {
  return addDaysIso(todayIso(), 1)
}

// Weeks (Sun-start) covering just the trip's date range, not a full calendar month.
// Days outside [startIso, endIso] but inside a boundary week are still included
// (as blanks) so the 7-day grid alignment holds.
export function tripRangeWeeks(startIso: string, endIso: string): string[][] {
  const start = new Date(startIso + 'T00:00:00')
  const end = new Date(endIso + 'T00:00:00')
  const gridStart = new Date(start)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())
  const gridEnd = new Date(end)
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))

  const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1
  const weeks: string[][] = []
  const cur = new Date(gridStart)
  for (let i = 0; i < totalDays; i += 7) {
    const week: string[] = []
    for (let j = 0; j < 7; j++) {
      week.push(toLocalIso(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

