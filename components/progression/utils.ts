import type { Checkin } from '@/types/database'

export function getMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function buildCheckinMap(checkins: Checkin[]): Map<string, Checkin> {
  const map = new Map<string, Checkin>()
  for (const c of checkins) {
    const d = new Date(c.submitted_at)
    const key = toDateKey(d)
    if (!map.has(key)) map.set(key, c) // keep first checkin per day
  }
  return map
}

export function formatMonthYear(year: number, month: number): string {
  const str = new Date(year, month, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function getWeeksOfMonth(
  year: number,
  month: number
): { start: Date; end: Date; label: string }[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let weekStart = getMonday(firstDay)
  const weeks: { start: Date; end: Date; label: string }[] = []
  let weekNum = 1
  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `S${weekNum}`,
    })
    weekStart = new Date(weekStart)
    weekStart.setDate(weekStart.getDate() + 7)
    weekNum++
  }
  return weeks
}

export function calcBestStreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0
  const dates = Array.from(new Set(checkins.map(c => toDateKey(new Date(c.submitted_at))))).sort()
  let max = 1
  let cur = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
    )
    if (diff === 1) { cur++; max = Math.max(max, cur) }
    else cur = 1
  }
  return max
}

export function getCompletionColor(pct: number): string {
  if (pct === 0) return '#F0F0EC'
  if (pct < 50) return '#B8D4BC'
  if (pct < 80) return '#8AB48F'
  return '#4E9B6F'
}

export function getWeekRateColor(pct: number): string {
  if (pct >= 70) return '#4E9B6F'
  if (pct >= 40) return '#D4A853'
  return '#94A3B8'
}

// ─── Lecture localStorage partagée entre Week/Month/Year ─────────────────────
export function loadCompletionsForRange(
  clientId: string,
  startDate: Date,
  endDate: Date,
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>()
  if (typeof window === 'undefined') return result
  const current = getMonday(new Date(startDate))
  const end = new Date(endDate)
  while (current <= end) {
    const weekKey = toDateKey(current)
    try {
      const raw = localStorage.getItem(`cl_completions_${clientId}_${weekKey}`)
      if (raw) {
        const parsed: Record<string, string[]> = JSON.parse(raw)
        Object.entries(parsed).forEach(([date, ids]) => {
          result.set(date, new Set(ids))
        })
      }
    } catch {}
    current.setDate(current.getDate() + 7)
  }
  return result
}

export const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
export const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
]
