'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDateShort, getWeekNumber } from '@/lib/utils'
import { CheckCircle2, MessageCircle, ChevronRight, Dumbbell } from 'lucide-react'
import type { Client, Objective, Checkin, Session, ClientReminder } from '@/types/database'
import { WelcomeGuide } from '@/components/client/welcome-guide'

type PaymentAlert = {
  lateCount: number
  lateAmount: number
  pendingCount: number
  pendingAmount: number
  claimedCount: number
  totalDue: number
} | null

type Props = {
  client: Client
  objectives: Objective[]
  checkins: Checkin[]
  sessions: Session[]
  lastCoachMessage: { id: string; content: string; sender_role: string; created_at: string; read_by_client: boolean } | null
  coachName: string
  coachPhoto?: string | null
  token: string
  pendingReminder: ClientReminder | null
  paymentAlert: PaymentAlert
  coachView?: boolean
}

function KpiCard({ label, value, sub, color, bg }: { label: string; value: string | number; sub?: string; color?: string; bg?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-4" style={bg ? { background: bg } : {}}>
      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5 truncate">{label}</p>
      <p className="text-[22px] font-bold tracking-tight" style={{ color: color ?? '#0D1F3C' }}>{value}</p>
      {sub && <p className="text-[10px] text-[#94A3B8] mt-0.5">{sub}</p>}
    </div>
  )
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_NAMES = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

function formatSessionDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

type ReminderType = 'streak_fail' | 'inactivity' | 'daily'
const REMINDER_CONFIG: Record<ReminderType, { bg: string; border: string; ctaLabel: string; ctaPath: string }> = {
  streak_fail: { bg: '#FFF7ED', border: '#FED7AA', ctaLabel: 'En parler à mon coach', ctaPath: '/messages' },
  inactivity:  { bg: '#FFF7ED', border: '#FED7AA', ctaLabel: 'Reprendre mes objectifs', ctaPath: '/progression' },
  daily:       { bg: '#F0F9F1', border: '#BBF7D0', ctaLabel: 'Voir mes objectifs', ctaPath: '/progression' },
}

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

export function ClientDashboard({ client, objectives, checkins, sessions, lastCoachMessage, coachName, coachPhoto, token, pendingReminder, paymentAlert, coachView = false }: Props) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()
  const hasCheckinThisWeek = checkins.some(c => c.week_number === currentWeek && c.year === currentYear)

  const [activeReminder, setActiveReminder] = useState<ClientReminder | null>(pendingReminder)
  const [dismissing, setDismissing] = useState(false)

  async function handleDismissReminder() {
    if (!activeReminder) return
    setDismissing(true)
    try {
      await fetch('/api/client/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss',
          reminderId: activeReminder.id,
          clientId: client.id,
          token: client.magic_token,
        }),
      })
    } catch {}
    setActiveReminder(null)
    setDismissing(false)
  }

  const [todayDoneIds, setTodayDoneIds] = useState<Set<string>>(new Set())
  const [streak, setStreak] = useState(0)
  const [doneThisMonth, setDoneThisMonth] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const today = new Date()
      const toKey = (d: Date): string =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const getMonday = (d: Date): Date => {
        const copy = new Date(d)
        const day = copy.getDay()
        copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1))
        copy.setHours(0, 0, 0, 0)
        return copy
      }
      const completionsForDay = (d: Date): string[] => {
        try {
          const raw = localStorage.getItem(`cl_completions_${client.id}_${toKey(getMonday(d))}`)
          if (!raw) return []
          return (JSON.parse(raw) as Record<string, string[]>)[toKey(d)] ?? []
        } catch { return [] }
      }
      setTodayDoneIds(new Set(completionsForDay(today)))
      let s = 0
      const startFrom = completionsForDay(today).length > 0 ? 0 : 1
      for (let i = startFrom; i <= 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i)
        if (completionsForDay(d).length > 0) s++
        else break
      }
      setStreak(s)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const uniqueIds = new Set<string>()
      const cursor = new Date(startOfMonth)
      while (cursor <= today) {
        completionsForDay(new Date(cursor)).forEach(id => uniqueIds.add(id))
        cursor.setDate(cursor.getDate() + 1)
      }
      setDoneThisMonth(uniqueIds.size)
    } catch {}
  }, [client.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalObjectives = objectives.length
  const doneObjectives = todayDoneIds.size
  const progressPct = totalObjectives > 0 ? Math.round((doneObjectives / totalObjectives) * 100) : 0
  const upcomingSessions = sessions.filter(s => s.session_date >= todayStr).sort((a, b) => a.session_date.localeCompare(b.session_date))
  const pastSessions = sessions.filter(s => s.session_date < todayStr).sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 5)
  const sessionRows = [
    ...upcomingSessions.slice(0, 5).map(s => ({ ...s, upcoming: true })),
    ...pastSessions.map(s => ({ ...s, upcoming: false })),
  ]

  const streakMilestones = [3, 7, 14, 21, 30, 60, 90]
  const streakNext = streakMilestones.find(m => m > streak) ?? 100
  const streakPrev = streakMilestones.filter(m => m <= streak).pop() ?? 0
  const streakPct = streakNext > streakPrev ? Math.min((streak - streakPrev) / (streakNext - streakPrev), 1) : 1
  const streakR = 28
  const streakCirc = 2 * Math.PI * streakR
  const streakDash = streakPct * streakCirc
  const fireColor = streak >= 7 ? '#E8973A' : streak >= 3 ? '#D4A853' : 'var(--brand)'

  const cfg = activeReminder ? REMINDER_CONFIG[activeReminder.type as ReminderType] : null

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-5xl w-full mx-auto">
      {/* Bannière rappel */}
      {activeReminder && cfg && (
        <div className="flex items-start justify-between gap-3 rounded-xl px-4 py-3.5 mb-5 border"
          style={{ background: cfg.bg, borderColor: cfg.border }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0D1F3C]">{activeReminder.title}</p>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{activeReminder.message}</p>
              <Link href={`/c/${token}${cfg.ctaPath}`} className="inline-block mt-2 text-xs font-medium hover:underline" style={{ color: 'var(--brand)' }}>
                {cfg.ctaLabel} →
              </Link>
            </div>
          </div>
          {!coachView && (
            <button onClick={handleDismissReminder} disabled={dismissing}
              className="flex-shrink-0 text-[#94A3B8] hover:text-[#64748B] transition-colors text-lg leading-none mt-0.5">
              ×
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px] bg-[#EEF2FF]">🏠</div>
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1F3C]">
            Bonjour, {client.full_name.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {coachPhoto
              ? <img src={coachPhoto} alt={coachName} className="w-4 h-4 rounded-full object-cover" />
              : <span className="w-4 h-4 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[8px] font-bold text-[#64748B]">{coachName[0]}</span>
            }
            <p className="text-[11px] text-[#94A3B8]">Suivi par {coachName}</p>
          </div>
        </div>
      </div>

      {/* Guide de bienvenue + contenu drippé (J0–J7) */}
      {!coachView && (
        <WelcomeGuide
          token={token}
          clientId={client.id}
          onboardingCompletedAt={client.onboarding_completed_at}
          coachName={coachName}
          hasCheckinThisWeek={hasCheckinThisWeek}
        />
      )}

      {/* Check-in CTA */}
      {!hasCheckinThisWeek && (
        <Link
          href={`/c/${token}/checkins`}
          className="flex items-center justify-between rounded-xl px-5 py-4 mb-6 group transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: '0 4px 16px color-mix(in srgb, var(--brand) 20%, transparent)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Check-in de la semaine {currentWeek}</p>
              <p className="text-xs text-white/70 mt-0.5">2 minutes · tenir votre coach informé</p>
            </div>
          </div>
          <span className="text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-all text-sm">→</span>
        </Link>
      )}

      {hasCheckinThisWeek && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 border" style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm text-[#4A7A4E] font-medium">Check-in S{currentWeek} complété — à la semaine prochaine !</p>
        </div>
      )}

      {/* Payment alert */}
      {paymentAlert && (paymentAlert.lateCount > 0 || paymentAlert.pendingCount > 0) && (
        <Link
          href={`/c/${token}/paiement`}
          className="flex items-center gap-4 rounded-xl px-4 py-4 mb-6 border transition-opacity hover:opacity-90"
          style={
            paymentAlert.lateCount > 0
              ? { background: '#FEF2F2', borderColor: '#FECACA' }
              : { background: '#FFFBEB', borderColor: '#FDE68A' }
          }
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={paymentAlert.lateCount > 0 ? { background: '#FEE2E2' } : { background: '#FEF3C7' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={paymentAlert.lateCount > 0 ? '#DC2626' : '#D97706'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            {paymentAlert.lateCount > 0 ? (
              <>
                <p className="text-[13px] font-bold text-[#DC2626] leading-snug">
                  {paymentAlert.lateCount} paiement{paymentAlert.lateCount > 1 ? 's' : ''} en retard
                </p>
                <p className="text-[11px] text-[#DC2626]/70 mt-0.5">
                  {fmtAmount(paymentAlert.lateAmount)} à régler dès que possible
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-bold text-[#D97706] leading-snug">
                  {paymentAlert.pendingCount} paiement{paymentAlert.pendingCount > 1 ? 's' : ''} en attente
                </p>
                <p className="text-[11px] text-[#D97706]/70 mt-0.5">
                  {fmtAmount(paymentAlert.pendingAmount)} à échéance prochaine
                </p>
              </>
            )}
          </div>

          {/* Arrow */}
          <svg className="shrink-0" width="14" height="14" viewBox="0 0 15 15" fill="none"
            stroke={paymentAlert.lateCount > 0 ? '#DC2626' : '#D97706'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 3l4 4.5-4 4.5"/>
          </svg>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Progression"
          value={`${progressPct}%`}
          sub={`${doneObjectives}/${totalObjectives} aujourd'hui`}
          color={progressPct >= 75 ? 'var(--brand)' : progressPct >= 40 ? '#D4A853' : '#0D1F3C'}
        />
        <KpiCard
          label="Série"
          value={streak}
          sub="jours consécutifs"
          color={streak >= 4 ? 'var(--brand)' : '#0D1F3C'}
        />
        <KpiCard label="Ce mois" value={doneThisMonth} sub="objectifs atteints" />
        <KpiCard label="Check-ins" value={checkins.length} sub="au total" />
      </div>

      {/* Programme du jour */}
      <Link
        href={`/c/${token}/programme`}
        className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 mb-6 group hover:border-[color-mix(in_srgb,var(--brand)_40%,transparent)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand-bg)' }}>
            <Dumbbell size={16} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0D1F3C]">Programme du jour</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Voir la séance et logger vos performances</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors flex-shrink-0" />
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Objectifs + Streak */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0D1F3C]">Mes objectifs</h2>
              <Link href={`/c/${token}/progression`} className="flex items-center gap-0.5 text-xs hover:underline font-medium" style={{ color: 'var(--brand)' }}>
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>

            {totalObjectives === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-8 text-center text-sm text-[#64748B]">
                Aucun objectif défini pour l&apos;instant.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#0D1F3C]">
                      {doneObjectives} / {totalObjectives} cochés
                    </span>
                    <span className="text-xs font-semibold" style={{ color: progressPct >= 75 ? 'var(--brand)' : '#D4A853' }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{
                        transform: `scaleX(${progressPct / 100})`,
                        background: progressPct >= 75 ? 'var(--brand)' : '#D4A853',
                      }}
                    />
                  </div>
                </div>

                {objectives.filter(o => !todayDoneIds.has(o.id)).slice(0, 3).length > 0 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    {objectives.filter(o => !todayDoneIds.has(o.id)).slice(0, 3).map((obj, i, arr) => (
                      <div key={obj.id}
                        className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
                      >
                        <div className="w-4 h-4 rounded border-2 border-[#CBD5E1] mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-[#0D1F3C] leading-snug">{obj.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Streak */}
          {totalObjectives > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-4">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Série en cours</p>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r={streakR} fill="none" stroke="#F0F0EC" strokeWidth="5" />
                    {streak > 0 && (
                      <circle cx="32" cy="32" r={streakR} fill="none"
                        stroke={fireColor}
                        strokeWidth="5"
                        strokeDasharray={`${streakDash} ${streakCirc}`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-[#0D1F3C] leading-none">{streak}</span>
                    <span className="text-[9px] text-[#64748B] leading-none">j.</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#94A3B8]">
                      <span>{streakPrev}j</span>
                      <span style={{ color: fireColor }} className="font-medium">objectif {streakNext}j</span>
                    </div>
                    <div className="h-1.5 bg-[#F0F0EC] rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-bar"
                        style={{ transform: `scaleX(${streakPct})`, backgroundColor: fireColor, transitionDuration: '700ms' }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    {streak === 0
                      ? "Complétez vos objectifs aujourd'hui pour démarrer une série !"
                      : `Plus que ${streakNext - streak} jour${streakNext - streak > 1 ? 's' : ''} pour atteindre ${streakNext}j`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Séances + message coach */}
        <div className="space-y-4">
          {lastCoachMessage && (
            <div>
              <h2 className="text-sm font-semibold text-[#0D1F3C] mb-3">Message de {coachName}</h2>
              <Link href={`/c/${token}/messages`}
                className="flex items-start gap-3 bg-white rounded-xl px-4 py-3.5 transition-colors group border"
                style={{ borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)' }}>
                <MessageCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#64748B] mb-1">{formatDateShort(lastCoachMessage.created_at)}</p>
                  <p className="text-sm text-[#0D1F3C] line-clamp-2 leading-relaxed">{lastCoachMessage.content}</p>
                  <p className="text-xs mt-2 group-hover:underline" style={{ color: 'var(--brand)' }}>Voir la conversation →</p>
                </div>
              </Link>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0D1F3C]">Mes séances</h2>
              {sessions.length > 0 && (
                <span className="text-xs text-[#64748B]">{upcomingSessions.length} à venir</span>
              )}
            </div>
            {sessionRows.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-8 text-center text-sm text-[#64748B]">
                Aucune séance planifiée.
              </div>
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFB]">
                  <span className="text-xs font-semibold text-[#64748B]">Date</span>
                  <span className="text-xs font-semibold text-[#64748B]">Statut</span>
                </div>
                {sessionRows.map((s, i) => (
                  <div key={s.id} className={`px-4 py-3 ${i < sessionRows.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0D1F3C]">{formatSessionDate(s.session_date)}</p>
                        {s.notes && (
                          <p className="text-xs text-[#64748B] mt-0.5 truncate">{s.notes.slice(0, 50)}{s.notes.length > 50 ? '…' : ''}</p>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={s.upcoming ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-dark)' } : { backgroundColor: '#F1F5F9', color: '#64748B' }}
                      >
                        {s.upcoming ? 'À venir' : 'Passée'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
