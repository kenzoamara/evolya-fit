'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, LabelList,
} from 'recharts'
import type { Checkin, Objective } from '@/types/database'
import {
  buildCheckinMap, formatMonthYear, formatShortDate, getWeeksOfMonth,
  toDateKey, DAY_LABELS, getWeekRateColor, loadCompletionsForRange,
} from './utils'

type Props = {
  checkins: Checkin[]
  objectives: Objective[]
  clientId?: string
  token?: string
}

// Couleur de case — même échelle rouge→vert que la vue année
function getCompletionBg(pct: number | null): string {
  if (pct === null || pct === 0) return '#F0F0EC'
  if (pct <= 20) return '#FCA5A5' // rouge clair
  if (pct <= 40) return '#FB923C' // orange
  if (pct <= 60) return '#FCD34D' // jaune
  if (pct <= 80) return '#86EFAC' // vert clair
  return '#22C55E'                // vert
}

// Couleur du texte sur fond coloré
function getCellTextColor(pct: number): string {
  if (pct <= 60) return '#0D1F3C' // fond clair → texte sombre
  return 'white'                  // fond vert → texte blanc
}

export function MonthlyTracker({ checkins, objectives, clientId, token }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // Map dateKey → % completion from daily_completions
  const [completionPctMap, setCompletionPctMap] = useState<Map<string, number>>(new Map())

  const totalObjectives = objectives.length

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const todayKey = toDateKey(now)

  // Checkins de ce mois
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)
  const monthCheckins = checkins.filter(c => {
    const d = new Date(c.submitted_at)
    return d >= startOfMonth && d <= endOfMonth
  })
  const checkinMap = buildCheckinMap(checkins)
  const weeksOfMonth = getWeeksOfMonth(year, month)

  // ── Charger completions depuis localStorage (même source que WeeklyView) ──
  const loadMonthCompletions = useCallback(() => {
    if (!clientId || totalObjectives === 0) { setCompletionPctMap(new Map()); return }

    // Filtre les IDs valides pour ignorer les objectifs supprimés
    const validObjIds = new Set(objectives.map(o => o.id))

    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    const rawMap = loadCompletionsForRange(clientId, start, end)

    const pctMap = new Map<string, number>()
    rawMap.forEach((ids, dateKey) => {
      const validCount = Array.from(ids).filter(id => validObjIds.has(id)).length
      pctMap.set(dateKey, Math.round((validCount / totalObjectives) * 100))
    })
    setCompletionPctMap(pctMap)

    // Essaie aussi l'API en arrière-plan (si table Supabase existe)
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const params = new URLSearchParams({ client_id: clientId, start_date: startStr, end_date: endStr })
    if (token) params.set('token', token)
    fetch(`/api/daily-completion?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: Array<{ objective_id: string; completed_date: string }>) => {
        const countByDate = new Map<string, number>()
        for (const { objective_id, completed_date } of data) {
          if (validObjIds.has(objective_id)) {
            countByDate.set(completed_date, (countByDate.get(completed_date) ?? 0) + 1)
          }
        }
        const apiPctMap = new Map<string, number>()
        Array.from(countByDate.entries()).forEach(([dateKey, count]) => {
          apiPctMap.set(dateKey, Math.round((count / totalObjectives) * 100))
        })
        setCompletionPctMap(apiPctMap)
      })
      .catch(() => {}) // Silencieux si table pas encore créée
  }, [year, month, clientId, token, totalObjectives, objectives])

  useEffect(() => { loadMonthCompletions() }, [loadMonthCompletions])

  // Nombre de jours avec au moins 1 engagement coché ce mois
  const monthEngagedDays = Array.from(completionPctMap.entries())
    .filter(([key]) => {
      const d = new Date(key)
      return d >= startOfMonth && d <= endOfMonth
    })
    .filter(([, pct]) => pct > 0).length

  // Total des engagements réalisés ce mois (somme des % par jour)
  const monthTotalPct = Array.from(completionPctMap.entries())
    .filter(([key]) => {
      const d = new Date(key)
      return d >= startOfMonth && d <= endOfMonth
    })
    .reduce((sum, [, pct]) => sum + pct, 0)
  const daysElapsed = (() => {
    let count = 0
    for (let d = new Date(startOfMonth); d <= now && d <= endOfMonth; d.setDate(d.getDate() + 1)) count++
    return count
  })()
  const monthAvgPct = daysElapsed > 0 ? Math.round(monthTotalPct / daysElapsed) : 0

  // Chart data — tous les jours du mois (vrai nb de jours : 28/29/30/31)
  const engagementChartData = (() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate() // vrai nb de jours du mois
    const result: { day: string; pct: number | null; date: string }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const dateKey = toDateKey(date)
      const dayStr = String(d).padStart(2, '0')
      // Jours futurs → null (pas de valeur, pas de trait)
      const pct = date > now ? null : (completionPctMap.get(dateKey) ?? 0)
      result.push({ day: dayStr, pct, date: dateKey })
    }
    return result
  })()

  // Nombre de check-ins par semaine
  const weekCheckinCounts = weeksOfMonth.map(w => {
    let count = 0
    for (let d = new Date(w.start); d <= w.end; d.setDate(d.getDate() + 1)) {
      if (checkinMap.get(toDateKey(new Date(d)))) count++
    }
    return count
  })

  // Taux d'engagement par semaine (moyenne des % journaliers, jours du mois seulement)
  const weekRates = weeksOfMonth.map(w => {
    let totalPct = 0, days = 0
    for (let d = new Date(w.start); d <= w.end; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d)
      if (cur > now) continue
      if (cur.getMonth() !== month || cur.getFullYear() !== year) continue // ignorer jours hors mois
      const dk = toDateKey(cur)
      days++
      totalPct += completionPctMap.get(dk) ?? 0
    }
    return days > 0 ? Math.round(totalPct / days) : null
  })

  // Moyenne mensuelle = somme des taux / TOUTES les semaines du mois (futures = 0)
  // ex: S1=100% S2=100% S3-S5=non commencées → 200/5 = 40%
  const totalWeeksInMonth = weeksOfMonth.length
  const monthlyAvgFromWeeks = totalWeeksInMonth > 0
    ? Math.round(weekRates.reduce<number>((s, r) => s + (r ?? 0), 0) / totalWeeksInMonth)
    : null

  return (
    <div className="space-y-5">
      {/* Header mois */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
        >
          ‹
        </button>
        <h3 className="text-base font-semibold text-[#0D1F3C]">{formatMonthYear(year, month)}</h3>
        <button
          onClick={nextMonth}
          disabled={year === now.getFullYear() && month === now.getMonth()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3">
          <p className="text-xs text-[#64748B] mb-1">Check-ins</p>
          <p className="text-xl font-semibold text-[#0D1F3C]">{monthCheckins.length}</p>
          <p className="text-xs text-[#94A3B8]">ce mois</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3">
          <p className="text-xs text-[#64748B] mb-1">Engagements</p>
          <p className="text-xl font-semibold text-[#4E9B6F]">
            {totalObjectives > 0 ? `${monthAvgPct}%` : '—'}
          </p>
          <p className="text-xs text-[#94A3B8]">moy. par jour</p>
        </div>
      </div>

      {/* Grille mensuelle */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Bilan du Mois</h4>
          {totalObjectives > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
              <div className="flex gap-0.5">
                {['#F0F0EC', '#FCA5A5', '#FB923C', '#FCD34D', '#86EFAC', '#22C55E'].map(c => (
                  <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>0% → 100%</span>
            </div>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          {/* Entête jours */}
          <div className="flex gap-0 min-w-[500px]">
            <div className="w-8 flex-shrink-0" />
            {DAY_LABELS.map(d => (
              <div key={d} className="flex-1 text-center text-xs text-[#64748B] font-medium pb-2">{d}</div>
            ))}
            <div className="w-12 flex-shrink-0" />
          </div>

          {/* Semaines */}
          {weeksOfMonth.map((week, wi) => {
            const days: { date: Date; key: string; checkin: Checkin | undefined; isFuture: boolean }[] = []
            for (let i = 0; i < 7; i++) {
              const d = new Date(week.start)
              d.setDate(d.getDate() + i)
              const key = toDateKey(d)
              days.push({ date: d, key, checkin: checkinMap.get(key), isFuture: d > now })
            }
            const weekRate = weekRates[wi]

            return (
              <div key={wi} className="mb-3">
                <div className="flex gap-0 items-center min-w-[500px]">
                  {/* Label semaine */}
                  <div className="w-8 flex-shrink-0 text-xs text-[#64748B] font-medium">{week.label}</div>
                  {days.map(({ date, key, isFuture }) => {
                    const isToday = key === todayKey
                    const isThisMonth = date.getMonth() === month
                    const pct = isFuture ? null : (completionPctMap.get(key) ?? (isThisMonth ? 0 : null))
                    const bg = isFuture ? '#F8FAFB' : getCompletionBg(isThisMonth ? pct : null)
                    const tooltip = isFuture
                      ? formatShortDate(date)
                      : totalObjectives > 0 && pct !== null
                        ? `${formatShortDate(date)} · ${pct}% engagements`
                        : formatShortDate(date)

                    return (
                      <div key={key} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="relative rounded-md flex items-center justify-center"
                          style={{
                            width: 32, height: 32,
                            backgroundColor: bg,
                            border: isToday ? '2px solid #4E9B6F' : '1px solid #E2E8F0',
                            opacity: !isThisMonth ? 0.3 : 1,
                          }}
                          title={tooltip}
                        >
                          {/* Pastille % réel du jour */}
                          {!isFuture && isThisMonth && pct != null && pct > 0 && (
                            <span
                              className="text-[7px] font-bold leading-none"
                              style={{ color: getCellTextColor(pct) }}
                            >
                              {pct}%
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {/* Taux de la semaine — colonne droite */}
                  <div className="w-12 flex-shrink-0 flex items-center justify-end">
                    {weekRate !== null && totalObjectives > 0 ? (
                      <span
                        className="text-xs font-bold"
                        style={{ color: getWeekRateColor(weekRate) }}
                      >
                        {weekRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">—</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Taux d'activité — résumé mensuel aligné avec la colonne droite */}
          <div className="flex gap-0 mt-3 pt-3 border-t border-[#E2E8F0] min-w-[500px] items-center">
            <div className="w-8 flex-shrink-0 text-[10px] font-semibold text-[#64748B] uppercase tracking-wide" />
            <div className="flex-1 text-[10px] font-semibold text-[#64748B] uppercase tracking-wide whitespace-nowrap">
              Taux d&apos;objectif complété mensuel
            </div>
            <div className="w-12 flex-shrink-0 flex items-center justify-end">
              {monthlyAvgFromWeeks !== null && totalObjectives > 0 && (
                <span
                  className="text-sm font-bold"
                  style={{ color: getWeekRateColor(monthlyAvgFromWeeks) }}
                >
                  {monthlyAvgFromWeeks}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Area chart — Taux d'engagement journalier */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">Engagement journalier</h4>
        {totalObjectives === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-sm text-[#94A3B8]">
            Aucun objectif défini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={engagementChartData} margin={{ top: 15, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4E9B6F" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4E9B6F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(v: string) => {
                  const n = parseInt(v, 10)
                  return n === 1 || n % 5 === 0 ? String(n) : ''
                }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(v: number) => `${v}%`}
                width={38}
              />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                formatter={(value: unknown) => [value !== null ? `${value}%` : '—', 'Engagement']}
                labelFormatter={(label: unknown) => `Jour ${label}`}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#4E9B6F"
                strokeWidth={2}
                fill="url(#engagementGradient)"
                dot={{ fill: '#4E9B6F', r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Vue d'ensemble : 2 métriques ─────────────────────────────────────── */}
      {(() => {
        const regularityPctMonth = daysElapsed > 0
          ? Math.round((monthEngagedDays / daysElapsed) * 100)
          : 0
        const metrics = [
          { label: 'Objectifs complétés', value: totalObjectives > 0 ? monthAvgPct : null, color: monthAvgPct >= 70 ? '#4E9B6F' : monthAvgPct >= 40 ? '#D4A853' : '#94A3B8' },
          { label: 'Régularité', value: regularityPctMonth, color: regularityPctMonth >= 70 ? '#4E9B6F' : regularityPctMonth >= 40 ? '#D4A853' : '#94A3B8' },
        ]
        return (
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
            <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">Vue d&apos;ensemble</h4>
            <div className="space-y-3">
              {metrics.map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748B]">{m.label}</span>
                    <span className="font-semibold" style={{ color: m.color }}>{m.value !== null ? `${m.value}%` : '—'}</span>
                  </div>
                  <div className="h-2 bg-[#F0F0EC] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.value ?? 0}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Barres horizontales par semaine ──────────────────────────────────── */}
      {(() => {
        const weeklyBarData = weeksOfMonth.map((w, i) => {
          const val = weekRates[i] ?? 0
          const color = val === 0 ? '#E2E8F0'
            : val <= 20 ? '#FCA5A5'
            : val <= 40 ? '#FB923C'
            : val <= 60 ? '#FCD34D'
            : val <= 80 ? '#86EFAC'
            : '#22C55E'
          return { label: w.label, value: val, color }
        })
        return (
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
            <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">
              Performance par semaine
            </h4>
            {totalObjectives === 0 ? (
              <div className="h-[100px] flex items-center justify-center text-sm text-[#94A3B8]">
                Aucun objectif défini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={weeksOfMonth.length * 44}>
                <BarChart
                  layout="vertical"
                  data={weeklyBarData}
                  margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
                  barCategoryGap="25%"
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
                    {weeklyBarData.map((entry, i) => (
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
        )
      })()}

      {/* ── Répartition objectifs ────────────────────────────────────────────── */}
      {totalObjectives > 0 && (() => {
        const OBJ_DATA = [
          { label: 'Complétés',     color: '#4E9B6F', count: monthAvgPct },
          { label: 'Non complétés', color: '#E2E8F0', count: 100 - monthAvgPct },
        ]
        const total = OBJ_DATA.reduce((s, d) => s + d.count, 0)
        const pieData = OBJ_DATA.filter(d => d.count > 0)

        const tone = monthAvgPct >= 60
          ? { bg: 'bg-[#4E9B6F]/5 border-[#4E9B6F]/20', dot: 'bg-[#4E9B6F]', text: 'Bon taux de réalisation sur vos objectifs ce mois. Maintenez cette régularité.' }
          : monthAvgPct >= 30
          ? { bg: 'bg-[#D4A853]/8 border-[#D4A853]/30', dot: 'bg-[#D4A853]', text: 'Taux d\'objectifs moyen ce mois. Analysez les obstacles avec votre coach si besoin.' }
          : { bg: 'bg-[#F1F5F9] border-[#E2E8F0]', dot: 'bg-[#94A3B8]', text: 'Peu d\'objectifs atteints ce mois. Parlez-en à votre coach pour ajuster votre programme.' }

        return (
          <>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Répartition objectifs</h4>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={pieData} dataKey="count" cx="50%" cy="50%" outerRadius={52} innerRadius={26}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11 }}
                    formatter={(_v: unknown, _n: unknown, p: { payload?: { label: string; count: number } }) => {
                      const pl = p.payload
                      if (!pl) return ['', '']
                      return [`${pl.count}% (${Math.round((pl.count / total) * 100)}%)`, pl.label]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                {OBJ_DATA.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-[#64748B]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span>{d.label} — {d.count}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${tone.bg}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${tone.dot}`} />
              <p className="text-sm leading-relaxed text-[#0D1F3C]">{tone.text}</p>
            </div>
          </>
        )
      })()}
    </div>
  )
}
