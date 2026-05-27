'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from 'recharts'
import type { Checkin, Objective } from '@/types/database'
import {
  buildCheckinMap, toDateKey, getMonday,
  formatShortDate, MONTH_LABELS, loadCompletionsForRange,
} from './utils'

function engagementBarColor(pct: number): string {
  if (pct === 0) return '#E2E8F0'
  if (pct <= 20) return '#FCA5A5'
  if (pct <= 40) return '#FB923C'
  if (pct <= 60) return '#FCD34D'
  if (pct <= 80) return '#86EFAC'
  return '#22C55E'
}

type Props = {
  checkins: Checkin[]
  objectives?: Objective[]
  clientId?: string
  token?: string
}

// Tooltip custom — masqué pour les semaines futures (pct null)
function EngagementTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { fullLabel: string; pct: number | null } }>
}) {
  if (!active || !payload?.length) return null
  const { pct, fullLabel } = payload[0].payload
  if (pct === null || pct === undefined) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 8, fontSize: 12, padding: '8px 12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <p style={{ color: '#64748B', marginBottom: 4, fontSize: 11 }}>{fullLabel}</p>
      <p style={{ color: '#0D1F3C', fontWeight: 600 }}>{pct}%</p>
    </div>
  )
}

type WeekCell = {
  weekStart: Date
  days: Date[]
  month: number
}

function buildYearGrid(year: number): WeekCell[] {
  const cells: WeekCell[] = []
  let d = getMonday(new Date(year, 0, 1))
  while (d.getFullYear() <= year) {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(d)
      day.setDate(day.getDate() + i)
      days.push(day)
    }
    cells.push({ weekStart: new Date(d), days, month: d.getMonth() })
    d = new Date(d)
    d.setDate(d.getDate() + 7)
  }
  return cells
}

export function YearView({ checkins, objectives = [], clientId, token }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  // Map dateKey → pct engagement (0-100)
  const [completionPctMap, setCompletionPctMap] = useState<Map<string, number>>(new Map())
  const checkinMap = buildCheckinMap(checkins)
  const yearCheckins = checkins.filter(c => new Date(c.submitted_at).getFullYear() === year)
  const totalObjectives = objectives.length

  // ── Charger les completions depuis localStorage pour l'année ──
  useEffect(() => {
    if (!clientId || totalObjectives === 0) { setCompletionPctMap(new Map()); return }
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    const rawMap = loadCompletionsForRange(clientId, start, end)
    const pctMap = new Map<string, number>()
    rawMap.forEach((ids, dateKey) => {
      pctMap.set(dateKey, Math.round((ids.size / totalObjectives) * 100))
    })
    setCompletionPctMap(pctMap)

    // Essaie l'API en arrière-plan
    if (clientId) {
      const params = new URLSearchParams({
        client_id: clientId,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
      })
      if (token) params.set('token', token)
      fetch(`/api/daily-completion?${params}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then((data: Array<{ objective_id: string; completed_date: string }>) => {
          const countByDate = new Map<string, number>()
          for (const { completed_date } of data) {
            countByDate.set(completed_date, (countByDate.get(completed_date) ?? 0) + 1)
          }
          const apiPctMap = new Map<string, number>()
          Array.from(countByDate.entries()).forEach(([dateKey, count]) => {
            apiPctMap.set(dateKey, Math.round((count / totalObjectives) * 100))
          })
          setCompletionPctMap(apiPctMap)
        })
        .catch(() => {})
    }
  }, [year, clientId, totalObjectives])

  const weeks = buildYearGrid(year)

  // Group by month
  const monthsMap = new Map<number, WeekCell[]>()
  for (const w of weeks) {
    const m = w.days[0].getFullYear() === year ? w.days[0].getMonth() : w.days[6].getMonth()
    const key = w.days.some(d => d.getFullYear() === year && d.getMonth() <= 11) ? m : -1
    if (key < 0) continue
    if (!monthsMap.has(key)) monthsMap.set(key, [])
    monthsMap.get(key)!.push(w)
  }

  // Couleur RED→ORANGE→YELLOW→GREEN pour la vue annuelle
  function yearCompletionColor(pct: number): string {
    if (pct === 0) return '#F0F0EC'
    if (pct <= 20) return '#FCA5A5'
    if (pct <= 40) return '#FB923C'
    if (pct <= 60) return '#FCD34D'
    if (pct <= 80) return '#86EFAC'
    return '#22C55E'
  }

  // Couleur d'une cellule semaine : engagement moyen si objectifs, sinon checkins
  function weekColor(w: WeekCell): string {
    const daysThisYear = w.days.filter(d => d.getFullYear() === year && d <= now)
    if (daysThisYear.length === 0) return '#F8FAFB'

    if (totalObjectives > 0) {
      // Somme des % journaliers / 7 jours (cohérent avec semaine)
      const totalPct = daysThisYear.reduce((sum, d) => sum + (completionPctMap.get(toDateKey(d)) ?? 0), 0)
      const avgPct = Math.round(totalPct / 7) // sur 7 jours fixes
      return yearCompletionColor(avgPct)
    } else {
      // Fallback : checkins
      const done = daysThisYear.filter(d => checkinMap.has(toDateKey(d))).length
      const pct = Math.round((done / daysThisYear.length) * 100)
      return yearCompletionColor(pct)
    }
  }

  function weekTooltip(w: WeekCell): string {
    const daysThisYear = w.days.filter(d => d.getFullYear() === year && d <= now)
    const rangeStart = w.days.filter(d => d.getFullYear() === year)[0]
    const rangeEnd = w.days.filter(d => d.getFullYear() === year).slice(-1)[0]
    const rangeLabel = rangeStart && rangeEnd ? `${formatShortDate(rangeStart)} – ${formatShortDate(rangeEnd)}` : ''
    if (totalObjectives > 0) {
      const totalPct = daysThisYear.reduce((sum, d) => sum + (completionPctMap.get(toDateKey(d)) ?? 0), 0)
      const avgPct = daysThisYear.length > 0 ? Math.round(totalPct / daysThisYear.length) : 0
      return `${rangeLabel} · Engagement ${avgPct}%`
    }
    const done = daysThisYear.filter(d => checkinMap.has(toDateKey(d)))
    const checkinsList = done.map(d => checkinMap.get(toDateKey(d))!)
    const avg = checkinsList.length > 0
      ? (checkinsList.reduce((s, c) => s + (c.energy_score ?? 0), 0) / checkinsList.length).toFixed(1)
      : '—'
    return `${rangeLabel} : ${done.length} check-ins, score moyen ${avg}/10`
  }

  // Stats annuelles
  const totalEngagedDays = totalObjectives > 0
    ? Array.from(completionPctMap.values()).filter(p => p > 0).length
    : yearCheckins.length

  // Jours écoulés dans l'année (nécessaire avant yearAvgPct)
  const elapsedDaysYear = (() => {
    let count = 0
    for (let d = new Date(year, 0, 1); d <= now && d.getFullYear() === year; d.setDate(d.getDate() + 1)) count++
    return count
  })()

  const yearAvgPct = totalObjectives > 0 && elapsedDaysYear > 0
    ? Math.round(Array.from(completionPctMap.values()).reduce((s, p) => s + p, 0) / elapsedDaysYear)
    : null

  // Weekly engagement chart data — toutes les semaines réelles de l'année (52 ou 53 selon l'année)
  const weeklyEngagementData = (() => {
    return weeks
      .filter(w => w.days.some(d => d.getFullYear() === year)) // semaines ayant ≥1 jour dans l'année
      .map((w, i) => {
        const daysInYear = w.days.filter(d => d.getFullYear() === year)
        const daysElapsed = daysInYear.filter(d => d <= now)
        const isFutureWeek = daysElapsed.length === 0
        // Semaines futures → null (X-axis visible, valeur absente)
        const avgPct = isFutureWeek
          ? null
          : Math.round(daysElapsed.reduce((sum, d) => sum + (completionPctMap.get(toDateKey(d)) ?? 0), 0) / daysElapsed.length)
        // Label = nom du mois quand la semaine contient le 1er du mois
        const monthFirstDay = daysInYear.find(d => d.getDate() === 1)
        const label = monthFirstDay ? MONTH_LABELS[monthFirstDay.getMonth()] : ''
        // Tooltip : plage de dates dans l'année courante
        const rangeStart = daysInYear[0]
        const rangeEnd = daysInYear[daysInYear.length - 1]
        const fullLabel = `${formatShortDate(rangeStart)} – ${formatShortDate(rangeEnd)}`
        return { week: label, fullLabel, pct: avgPct }
      })
  })()

  // ── Données pour les graphiques ──────────────────────────────────────────────

  // Régularité annuelle = % jours avec activité / jours écoulés dans l'année
  const activeDaysYear = Array.from(completionPctMap.entries())
    .filter(([key]) => new Date(key).getFullYear() === year && (completionPctMap.get(key) ?? 0) > 0).length
  const regularityPctYear = elapsedDaysYear > 0 ? Math.round((activeDaysYear / elapsedDaysYear) * 100) : 0

  // Barres horizontales par mois
  const monthlyBarData = MONTH_LABELS.map((label, m) => {
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    let totalPct = 0, elapsed = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d)
      if (date > now) continue
      elapsed++
      totalPct += completionPctMap.get(toDateKey(date)) ?? 0
    }
    const val = elapsed > 0 ? Math.round(totalPct / elapsed) : 0
    return { label, value: val, color: engagementBarColor(val) }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setYear(y => y - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
          ‹
        </button>
        <h3 className="text-base font-semibold text-[#0D1F3C]">{year}</h3>
        <button onClick={() => setYear(y => y + 1)} disabled={year >= now.getFullYear()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors disabled:opacity-30">
          ›
        </button>
      </div>

      {/* Stats + légende */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-[#64748B]">
        {totalObjectives > 0 ? (
          <>
            <span>
              <span className="font-semibold text-[#0D1F3C]">{totalEngagedDays}</span> jours actifs en {year}
            </span>
            {yearAvgPct !== null && (
              <>
                <span className="text-[#E2E8F0]">|</span>
                <span>
                  Engagement moyen <span className="font-semibold text-[#4E9B6F]">{yearAvgPct}%</span>
                </span>
              </>
            )}
          </>
        ) : (
          <span><span className="font-semibold text-[#0D1F3C]">{yearCheckins.length}</span> check-ins en {year}</span>
        )}
        <span className="text-[#E2E8F0]">|</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span>0%</span>
          {['#FCA5A5', '#FB923C', '#FCD34D', '#86EFAC', '#22C55E'].map(c => (
            <div key={c} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>100%</span>
        </div>
      </div>

      {/* Area chart — Taux d'engagement par semaine */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Taux d&apos;engagement par semaine</h4>
          <span className="text-[10px] text-[#94A3B8]">{weeklyEngagementData.length} semaines</span>
        </div>
        {totalObjectives === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-sm text-[#94A3B8]">
            Aucun objectif défini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyEngagementData} margin={{ top: 15, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="weekEngagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4E9B6F" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4E9B6F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(v: number) => `${v}%`}
                width={38}
              />
              <Tooltip content={<EngagementTooltip />} />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#4E9B6F"
                strokeWidth={2}
                fill="url(#weekEngagementGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#4E9B6F' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Grille */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-[640px]">
          {Array.from({ length: 12 }, (_, m) => {
            const monthWeeks = monthsMap.get(m) ?? []
            return (
              <div key={m} className="flex-1">
                <p className="text-[10px] font-medium text-[#64748B] mb-1.5 text-center">{MONTH_LABELS[m]}</p>
                <div className="flex flex-col gap-1">
                  {monthWeeks.map((w, wi) => (
                    <div key={wi} className="w-full rounded-sm cursor-default"
                      style={{ height: 14, backgroundColor: weekColor(w) }}
                      title={weekTooltip(w)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Vue d'ensemble annuelle ──────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">Vue d&apos;ensemble</h4>
        <div className="space-y-3">
          {[
            { label: 'Objectifs (moy. annuelle)', value: totalObjectives > 0 ? (yearAvgPct ?? null) : null },
            { label: 'Régularité', value: regularityPctYear },
          ].map(m => {
            const v = m.value ?? 0
            const color = v >= 70 ? '#4E9B6F' : v >= 40 ? '#D4A853' : '#94A3B8'
            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#64748B]">{m.label}</span>
                  <span className="font-semibold" style={{ color }}>{m.value !== null ? `${v}%` : '—'}</span>
                </div>
                <div className="h-2 bg-[#F0F0EC] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Barres horizontales par mois ─────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">
          Performance par mois
        </h4>
        {totalObjectives === 0 ? (
          <div className="h-[120px] flex items-center justify-center text-sm text-[#94A3B8]">
            Aucun objectif défini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={monthlyBarData}
              margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
              barCategoryGap="20%"
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category" dataKey="label" width={28}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                formatter={(value: unknown) => [`${value as number}%`, 'Engagement']}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
                {monthlyBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => (v !== undefined && v !== null && v !== 0 ? `${v as number}%` : '')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
