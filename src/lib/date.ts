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

export function monthMatrix(year: number, month: number): string[][] {
  const startDay = new Date(year, month, 1).getDay()
  const lastOfMonth = new Date(year, month + 1, 0)
  const endDay = lastOfMonth.getDay()

  const start = new Date(year, month, 1 - startDay)
  const totalDays = startDay + lastOfMonth.getDate() + (6 - endDay)

  const weeks: string[][] = []
  const cur = new Date(start)
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
