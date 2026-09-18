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

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// "Sept 19 - 26" for a same-month range, "Dec 26 - Jan 3" across months.
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso + 'T00:00:00')
  const end = new Date(endIso + 'T00:00:00')
  const startLabel = `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()}`
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startLabel} - ${end.getDate()}`
  }
  return `${startLabel} - ${SHORT_MONTHS[end.getMonth()]} ${end.getDate()}`
}

// "September 19 - 26, 2026" for a same-month range, "December 26, 2026 - January 3, 2027" across months.
// Hand-rolled (no Intl/toLocaleDateString) so it renders identically everywhere, including
// stripped-down ICU environments that otherwise fall back to a garbled "(day: 26)" style format.
export function formatDateRangeLong(startIso: string, endIso: string): string {
  const start = new Date(startIso + 'T00:00:00')
  const end = new Date(endIso + 'T00:00:00')
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    return `${FULL_MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`
  }
  const startLabel = `${FULL_MONTHS[start.getMonth()]} ${start.getDate()}${start.getFullYear() !== end.getFullYear() ? `, ${start.getFullYear()}` : ''}`
  return `${startLabel} - ${FULL_MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
}

// "9.19.26"
export function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}.${d.getDate()}.${String(d.getFullYear()).slice(-2)}`
}

export interface CountdownParts {
  months: number
  weeks: number
  days: number
  hours: number
}

// Calendar-aware breakdown (respects real month lengths), largest unit first, no minutes/seconds.
export function countdownParts(from: Date, to: Date): CountdownParts {
  if (to <= from) return { months: 0, weeks: 0, days: 0, hours: 0 }
  let months = 0
  const cursor = new Date(from)
  while (true) {
    const next = new Date(cursor)
    next.setMonth(next.getMonth() + 1)
    if (next <= to) {
      months++
      cursor.setTime(next.getTime())
    } else break
  }
  let weeks = 0
  while (true) {
    const next = new Date(cursor)
    next.setDate(next.getDate() + 7)
    if (next <= to) {
      weeks++
      cursor.setTime(next.getTime())
    } else break
  }
  let days = 0
  while (true) {
    const next = new Date(cursor)
    next.setDate(next.getDate() + 1)
    if (next <= to) {
      days++
      cursor.setTime(next.getTime())
    } else break
  }
  const hours = Math.floor((to.getTime() - cursor.getTime()) / 3_600_000)
  return { months, weeks, days, hours }
}

// True if a passport (or similar document) expires within 6 months of the trip's
// end date — the standard "6 months' validity" entry requirement many countries have.
export function isExpiringSoon(expiryIso: string, tripEndIso: string): boolean {
  const expiry = new Date(expiryIso + 'T00:00:00')
  const sixMonthsAfterEnd = new Date(tripEndIso + 'T00:00:00')
  sixMonthsAfterEnd.setMonth(sixMonthsAfterEnd.getMonth() + 6)
  return expiry < sixMonthsAfterEnd
}

export function formatCountdown(parts: CountdownParts): string {
  const segments: string[] = []
  if (parts.months > 0) segments.push(`${parts.months} month${parts.months === 1 ? '' : 's'}`)
  if (parts.weeks > 0) segments.push(`${parts.weeks} week${parts.weeks === 1 ? '' : 's'}`)
  if (parts.days > 0) segments.push(`${parts.days} day${parts.days === 1 ? '' : 's'}`)
  if (parts.hours > 0 || segments.length === 0) segments.push(`${parts.hours} hour${parts.hours === 1 ? '' : 's'}`)
  return segments.join(', ')
}

