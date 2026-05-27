'use client'

import { useState, useEffect } from 'react'
import type { Client, Objective, Session, Checkin } from '@/types/database'
import { scoreInfo } from './DifficultyRatingModal'

type Props = {
  client: Client
  objectives: Objective[]
  sessions: Session[]
  checkins?: Checkin[]
  isCoach: boolean
  token?: string
}

// ── Streak calculé depuis les habit_logs (jours consécutifs avec ≥1 habitude complétée) ──
function calculateHabitStreak(logDates: string[]): { current: number; best: number } {
  if (logDates.length === 0) return { current: 0, best: 0 }

  const completed = new Set(logDates)
  const today = new Date()

  function dateStr(daysAgo: number): string {
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Start from today or yesterday (client may not have logged yet today)
  const startFrom = completed.has(dateStr(0)) ? 0 : 1

  let current = 0
  for (let i = startFrom; i <= 90; i++) {
    if (completed.has(dateStr(i))) current++
    else break
  }

  let best = 0, temp = 0
  for (let i = 90; i >= 0; i--) {
    if (completed.has(dateStr(i))) { temp++; best = Math.max(best, temp) }
    else temp = 0
  }

  return { current, best: Math.max(best, current) }
}

// ── Streak ring SVG ──────────────────────────────────────────────────────────
function StreakRing({ streak, best }: { streak: number; best: number }) {
  const pct = best > 0 ? Math.min((streak / best) * 100, 100) : 0
  const r = 36, circ = 2 * Math.PI * r, dash = (pct / 100) * circ
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#F0F0EC" strokeWidth="6" />
        {streak > 0 && (
          <circle cx="48" cy="48" r={r} fill="none"
            stroke={streak >= 7 ? '#E8973A' : streak >= 3 ? '#D4A853' : '#A855F7'}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '💤'}</span>
        <span className="text-lg font-bold text-[#0D1F3C] leading-none">{streak}</span>
        <span className="text-[9px] text-[#64748B] leading-none">jour{streak > 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────────────
export function EngagementsTab({ client, sessions, isCoach }: Props) {
  const now = new Date()

  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [habitCount, setHabitCount] = useState(0)
  const [loadingStreak, setLoadingStreak] = useState(false)
  const [difficultyRatings, setDifficultyRatings] = useState<Array<{ date: string; score: number; comment: string | null }>>([])

  // Fetch habit_logs for real streak (coach view uses coach API, client view uses client API)
  useEffect(() => {
    setLoadingStreak(true)
    const fetchLogs = isCoach
      ? fetch(`/api/coach/habits?clientId=${client.id}&logs=true`).then(r => r.json())
      : client.magic_token
        ? fetch(`/api/client/habitudes?token=${client.magic_token}`).then(r => r.json())
        : Promise.resolve({ logs: [] })

    fetchLogs
      .then((data: { logs?: { date: string }[]; habits?: { id: string }[] }) => {
        const logs = data.logs ?? []
        setStreak(calculateHabitStreak(logs.map((l: { date: string }) => l.date)))
        setHabitCount(data.habits?.length ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoadingStreak(false))
  }, [client.id, client.magic_token, isCoach])

  useEffect(() => {
    if (!isCoach) return
    fetch(`/api/difficulty?client_id=${client.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDifficultyRatings(data) })
      .catch(() => {})
  }, [client.id, isCoach])

  // Sessions stats — only count attendance=attended for "réalisées"
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30)
  const attendedThisMonth = sessions.filter(s =>
    s.attendance === 'attended' && new Date(s.session_date) >= thirtyDaysAgo
  )
  const attendedTotal = sessions.filter(s => s.attendance === 'attended').length

  const streakMilestones = [3, 7, 14, 21, 30, 60, 90]
  const nextMilestone = streakMilestones.find(m => m > streak.current) ?? 100
  const prevMilestone = streakMilestones.filter(m => m <= streak.current).pop() ?? 0

  return (
    <div className="space-y-4">

      {/* ── Streak habitudes ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <div className="flex items-start gap-5">

          {/* Ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {loadingStreak ? (
              <div className="w-24 h-24 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-[#A855F7]" />
              </div>
            ) : (
              <StreakRing streak={streak.current} best={streak.best} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[13px] font-bold text-[#0D1F3C]">Série habitudes</p>
              {habitCount > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#A855F7]">
                  {habitCount} habitude{habitCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#94A3B8] mb-3">
              {streak.current === 0
                ? 'Aucune habitude complétée ces derniers jours'
                : `${streak.current} jour${streak.current > 1 ? 's' : ''} consécutif${streak.current > 1 ? 's' : ''} avec au moins 1 habitude cochée`}
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>{prevMilestone}j</span>
                <span className="font-medium" style={{ color: streak.current >= 7 ? '#E8973A' : '#A855F7' }}>
                  objectif {nextMilestone}j
                </span>
              </div>
              <div className="h-1.5 bg-[#F0F0EC] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(((streak.current - prevMilestone) / Math.max(1, nextMilestone - prevMilestone)) * 100, 100)}%`,
                    backgroundColor: streak.current >= 7 ? '#E8973A' : '#A855F7',
                  }}
                />
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                Record · <span className="font-semibold text-[#0D1F3C]">{streak.best}</span> jours
              </p>
            </div>
          </div>
        </div>

        {streak.current >= 3 && (
          <div className="mt-4 w-full text-center bg-[#FFF8EC] border border-[#F0D898] rounded-xl px-3 py-2">
            <p className="text-xs font-medium text-[#C49940]">
              {streak.current >= 30 ? '🏆 Légendaire !'
                : streak.current >= 14 ? '🥇 Impressionnant !'
                : streak.current >= 7 ? '🔥 En feu !'
                : '⚡ Belle série !'}
            </p>
          </div>
        )}
      </div>

      {/* ── Section coach uniquement ── */}
      {isCoach && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#64748B" strokeWidth="1.2" />
              <path d="M7 4v4M7 9.5v.5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Visible uniquement par vous</span>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Séances réalisées — présences confirmées uniquement */}
            <div>
              <p className="text-xs font-medium text-[#64748B] mb-1">Séances réalisées (30 j)</p>
              <p className="text-[10px] text-[#94A3B8] mb-2">Présences confirmées uniquement</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-[#0D1F3C]">{attendedThisMonth.length}</span>
                <span className="text-sm text-[#64748B] mb-1">séance{attendedThisMonth.length > 1 ? 's' : ''}</span>
              </div>
              {attendedTotal > 0 && (
                <p className="text-xs text-[#94A3B8] mb-3">
                  {attendedTotal} au total · {sessions.filter(s => s.attendance === 'missed').length} absence{sessions.filter(s => s.attendance === 'missed').length > 1 ? 's' : ''}
                </p>
              )}
              {/* Mini bar chart — attended sessions only, 4 weeks */}
              <div className="flex gap-1 mt-1">
                {[3, 2, 1, 0].map(weeksAgo => {
                  const wStart = new Date(now)
                  wStart.setDate(now.getDate() - weeksAgo * 7 - ((now.getDay() + 6) % 7))
                  wStart.setHours(0, 0, 0, 0)
                  const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate() + 6)
                  const count = sessions.filter(s => {
                    const d = new Date(s.session_date)
                    return s.attendance === 'attended' && d >= wStart && d <= wEnd
                  }).length
                  const maxH = 32
                  const h = count > 0 ? Math.max(8, (count / 3) * maxH) : 4
                  return (
                    <div key={weeksAgo} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold" style={{ color: count > 0 ? '#4E9B6F' : '#CBD5E1' }}>
                        {count > 0 ? count : ''}
                      </span>
                      <div className="w-full rounded-sm" style={{ height: maxH, display: 'flex', alignItems: 'flex-end' }}>
                        <div className="w-full rounded-sm transition-all duration-500" style={{
                          height: h,
                          backgroundColor: count > 0 ? '#4E9B6F' : '#F0F0EC',
                        }} />
                      </div>
                      <span className="text-[9px] text-[#94A3B8]">S-{weeksAgo || 'act'}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Difficulté perçue */}
            {difficultyRatings.length > 0 && (() => {
              const last10 = [...difficultyRatings].slice(0, 10).reverse()
              const avg = Math.round(last10.reduce((s, r) => s + r.score, 0) / last10.length)
              const { emoji, label, color } = scoreInfo(avg)
              const lastComment = difficultyRatings.find(r => r.comment)?.comment ?? null
              const recent = last10.slice(-5)
              const older = last10.length >= 5 ? last10.slice(0, last10.length - 5) : []
              const avgRecent = recent.reduce((s, r) => s + r.score, 0) / recent.length
              const avgOlder = older.length > 0 ? older.reduce((s, r) => s + r.score, 0) / older.length : avgRecent
              const trend = older.length === 0 ? null : avgRecent - avgOlder
              return (
                <div>
                  <p className="text-xs font-medium text-[#64748B] mb-2">Difficulté perçue</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{emoji}</span>
                    <div>
                      <span className="text-2xl font-bold" style={{ color }}>{avg}</span>
                      <span className="text-xs text-[#64748B] ml-1">/10 · {label}</span>
                    </div>
                    {trend !== null && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: trend > 0.5 ? '#FEF3C7' : trend < -0.5 ? '#DCFCE7' : '#F0F0EC',
                          color: trend > 0.5 ? '#92400E' : trend < -0.5 ? '#166534' : '#64748B',
                        }}>
                        {trend > 0.5 ? '↑ Plus dur' : trend < -0.5 ? '↓ Plus facile' : '→ Stable'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1 h-8 mb-2">
                    {last10.map((r, i) => {
                      const { color: c } = scoreInfo(r.score)
                      const h = Math.max(4, (r.score / 10) * 32)
                      return (
                        <div key={i} className="flex-1 rounded-sm transition-all duration-300"
                          style={{ height: h, backgroundColor: c, opacity: 0.8 }}
                          title={`${r.date} · ${r.score}/10`}
                        />
                      )
                    })}
                  </div>
                  {lastComment && (
                    <p className="text-xs text-[#64748B] italic border-l-2 border-[#E2E8F0] pl-2 line-clamp-2">
                      &ldquo;{lastComment}&rdquo;
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Dernière activité */}
            <div>
              <p className="text-xs font-medium text-[#64748B] mb-2">Dernière activité</p>
              {client.last_checkin_at ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4E9B6F]" />
                    <div>
                      <p className="text-sm font-semibold text-[#0D1F3C]">
                        {(() => {
                          const d = Math.round((now.getTime() - new Date(client.last_checkin_at!).getTime()) / 86400000)
                          if (d === 0) return "Aujourd'hui"
                          if (d === 1) return 'Hier'
                          if (d < 7) return `Il y a ${d} jours`
                          if (d < 14) return 'Il y a 1 semaine'
                          if (d < 30) return `Il y a ${Math.round(d / 7)} semaines`
                          return `Il y a ${Math.round(d / 30)} mois`
                        })()}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {new Date(client.last_checkin_at!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const d = Math.round((now.getTime() - new Date(client.last_checkin_at!).getTime()) / 86400000)
                    if (d > 14) return (
                      <div className="bg-[#FFF8EC] border border-[#F0D898] rounded-lg px-3 py-2">
                        <p className="text-xs text-[#C49940]">Inactif depuis {d} jours — pensez à relancer !</p>
                      </div>
                    )
                    return null
                  })()}
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8]">Aucune activité enregistrée</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
