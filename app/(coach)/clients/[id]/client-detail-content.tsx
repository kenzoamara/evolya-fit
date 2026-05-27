'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { Client, Session, Checkin, BilanSnapshot } from '@/types/database'
import { EmptyState } from '@/components/shared/empty-state'
import { getWeekNumber } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ClientNote = {
  id: string
  content: string
  is_private: boolean
  author_role?: string
  created_at: string
}

type WeightEntry = { date: string; weight_kg: number }
type BodyMeasurement = { date: string; neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null; l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null; r_forearm_cm: number | null; waist_cm: number | null; hips_cm: number | null; l_thigh_cm: number | null; r_thigh_cm: number | null }
type SleepEntry = { date: string; hours: number }
type PerformanceEntry = { date: string; label: string; value: number; unit: string; notes?: string | null }
type WorkoutLog = {
  id: string
  log_date: string
  completed: boolean
  programme_days: { day_number: number; title: string | null } | null
  programme_assignments: { programmes: { title: string } | null } | null
  exercise_logs: { set_number: number; reps_done: number | null; weight_kg: number | null; programme_day_exercises: { exercise_name: string } | null }[]
}

type Props = {
  client: Client
  sessions: Session[]
  checkins: Checkin[]
  clientNotes?: ClientNote[]
  coachNotes?: ClientNote[]
  weightEntries?: WeightEntry[]
  bodyMeasurements?: BodyMeasurement[]
  sleepEntries?: SleepEntry[]
  performanceEntries?: PerformanceEntry[]
  workoutLogs?: WorkoutLog[]
  latePaymentsCount?: number
  isCoach: boolean
}

type TabId = 'apercu' | 'seances' | 'profil' | 'notes' | 'entrainements'

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const LS_KEY = 'evolya_recent_client_visits'

const AVATAR_COLORS = [
  { bg: '#EEF9F3', text: '#4E9B6F' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#F5F3FF', text: '#7C3AED' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#F0FDFA', text: '#0D9488' },
  { bg: '#FEF2F2', text: '#DC2626' },
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export function ClientDetailContent({ client, sessions, checkins, clientNotes = [], coachNotes = [], weightEntries = [], bodyMeasurements = [], sleepEntries = [], performanceEntries = [], workoutLogs = [], latePaymentsCount = 0, isCoach }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('apercu')
  const router = useRouter()

  useEffect(() => {
    if (!isCoach) return
    try {
      const raw = localStorage.getItem(LS_KEY)
      const visits: Array<{ clientId: string; clientName: string; href: string; at: string }> = raw ? JSON.parse(raw) : []
      const updated = [
        { clientId: client.id, clientName: client.full_name, href: `/clients/${client.id}`, at: new Date().toISOString() },
        ...visits.filter(v => v.clientId !== client.id),
      ].slice(0, 10)
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
    } catch { /* ignore */ }
  }, [client.id, client.full_name, isCoach])

  const tabs: { key: TabId; label: string }[] = [
    { key: 'apercu',   label: 'Aperçu' },
    { key: 'seances',  label: 'Séances' },
    { key: 'profil',   label: 'Profil' },
    ...(isCoach ? [
      { key: 'entrainements' as TabId, label: 'Entraînements' },
      { key: 'notes'         as TabId, label: 'Notes' },
    ] : []),
  ]

  return (
    <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-6 pb-24 sm:py-8 max-w-7xl w-full mx-auto">

      {/* Header client */}
      <div className="flex items-center gap-3 mb-6">
        {isCoach && (
          <button
            onClick={() => router.back()}
            className="text-sm text-[#64748B] hover:text-[#0D1F3C] transition-colors flex-shrink-0"
          >
            ← Retour
          </button>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor(client.full_name).bg, color: avatarColor(client.full_name).text }}
          >
            {client.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-[#0D1F3C] truncate">{client.full_name}</h1>
            <p className="text-xs text-[#64748B] truncate">{client.email}</p>
          </div>
        </div>
        <div className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
          client.status === 'active' ? 'bg-brand-bg text-brand' : 'bg-[#94A3B8]/20 text-[#64748B]'
        }`}>
          {client.status === 'active' ? 'Actif' : 'Inactif'}
        </div>
        {isCoach && latePaymentsCount > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-[#FEE2E2] text-[#DC2626]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="#DC2626" strokeWidth="1.2"/>
              <path d="M5 3v2.5M5 7v.3" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {latePaymentsCount} impayé{latePaymentsCount > 1 ? 's' : ''}
          </div>
        )}
        {isCoach && client.magic_token && (
          <a
            href={`/c/${client.magic_token}/dashboard?coach=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-white btn-brand px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7 2h3v3M10 2L5.5 6.5M3 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Espace client
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-[#0D1F3C] shadow-sm'
                : 'text-[#64748B] hover:text-[#0D1F3C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'apercu' && (
          <ApercuTab
            client={client}
            sessions={sessions}
            checkins={checkins}
            isCoach={isCoach}
            onNewSession={() => setActiveTab('seances')}
          />
        )}
        {activeTab === 'seances' && (
          <SessionsTab client={client} sessions={sessions} isCoach={isCoach} />
        )}
        {activeTab === 'profil' && (
          <ProfilTab
            client={client}
            sessions={sessions}
            checkins={checkins}
            weightEntries={weightEntries}
            bodyMeasurements={bodyMeasurements}
            sleepEntries={sleepEntries}
            performanceEntries={performanceEntries}
            isCoach={isCoach}
          />
        )}
        {activeTab === 'entrainements' && (
          <EntrainementsTab workoutLogs={workoutLogs} />
        )}
        {activeTab === 'notes' && (
          <NotesTab clientNotes={clientNotes} coachNotes={coachNotes} clientId={client.id} />
        )}
      </div>
    </main>
  )
}

// ─── Aperçu Tab ────────────────────────────────────────────────────────────────

function ApercuTab({
  client,
  sessions,
  checkins,
  isCoach,
  onNewSession,
}: {
  client: Client
  sessions: Session[]
  checkins: Checkin[]
  isCoach: boolean
  onNewSession: () => void
}) {
  const [showBilan, setShowBilan] = useState(false)
  const now = new Date()
  const todayStr = localDateStr(now)
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()

  const pastSessions = sessions.filter(s => s.session_date <= todayStr)
  const attended = pastSessions.filter(s => s.attendance === 'attended').length
  const missed = pastSessions.filter(s => s.attendance === 'missed').length
  const attendanceRate = pastSessions.length > 0
    ? Math.round((attended / pastSessions.filter(s => s.attendance !== null).length || 0) * 100) || null
    : null

  const lastSession = sessions
    .filter(s => s.session_date <= todayStr)
    .sort((a, b) => b.session_date.localeCompare(a.session_date))[0] ?? null

  const nextSession = sessions
    .filter(s => s.session_date > todayStr)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))[0] ?? null

  const checkinThisWeek = checkins.find(c => c.week_number === currentWeek && c.year === currentYear) ?? null
  const lastCheckin = checkins.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] ?? null

  const memberSince = new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip
          label="Séances"
          value={String(sessions.length)}
          sub={sessions.length > 0 ? `${pastSessions.length} passées` : 'Aucune planifiée'}
        />
        <StatChip
          label="Présence"
          value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
          sub={pastSessions.filter(s => s.attendance !== null).length > 0
            ? `${attended} présent${attended > 1 ? 's' : ''}, ${missed} absent${missed > 1 ? 's' : ''}`
            : 'Non marquée'}
        />
        <StatChip
          label="Check-ins"
          value={String(checkins.length)}
          sub={checkinThisWeek ? 'Semaine en cours ✓' : 'En attente cette sem.'}
          highlight={!!checkinThisWeek}
        />
      </div>

      {/* Prochaine séance */}
      {nextSession && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-brand uppercase tracking-wide">Prochaine séance</span>
          </div>
          <p className="text-sm font-semibold text-[#0D1F3C]">
            {formatDate(nextSession.session_date)}
            {nextSession.session_time && (
              <span className="ml-2 text-xs font-medium text-[#4E9B6F]">
                {nextSession.session_time.replace(':', 'h')}
              </span>
            )}
          </p>
          {nextSession.notes && (
            <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{nextSession.notes}</p>
          )}
        </div>
      )}

      {/* Dernière séance */}
      {lastSession ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Dernière séance</span>
            <div className="flex items-center gap-1.5">
              {lastSession.attendance === 'attended' && (
                <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full">✓ Présent</span>
              )}
              {lastSession.attendance === 'missed' && (
                <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">✗ Absent</span>
              )}
              <span className="text-xs text-[#64748B]">{formatDate(lastSession.session_date)}</span>
            </div>
          </div>
          {lastSession.notes ? (
            <p className="text-sm text-[#0D1F3C] leading-relaxed line-clamp-3">{lastSession.notes}</p>
          ) : (
            <p className="text-sm text-[#94A3B8] italic">Aucune note pour cette séance.</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-4 text-center">
          <p className="text-sm text-[#94A3B8]">Aucune séance passée.</p>
        </div>
      )}

      {/* Check-in semaine courante */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Check-in — Semaine {currentWeek}</span>
          {checkinThisWeek ? (
            <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full">Reçu</span>
          ) : (
            <span className="text-[10px] font-semibold bg-[#F1F5F9] text-[#94A3B8] px-2 py-0.5 rounded-full">En attente</span>
          )}
        </div>
        {checkinThisWeek ? (
          <div className="space-y-1.5">
            {checkinThisWeek.q1_answer && (
              <p className="text-sm text-[#0D1F3C] line-clamp-2">{checkinThisWeek.q1_answer}</p>
            )}
            {!checkinThisWeek.q1_answer && !checkinThisWeek.q2_answer && !checkinThisWeek.q3_answer && (
              <p className="text-sm text-[#94A3B8] italic">Check-in envoyé sans réponses.</p>
            )}
          </div>
        ) : lastCheckin ? (
          <p className="text-xs text-[#94A3B8]">
            Dernier check-in reçu le {new Date(lastCheckin.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} (S{lastCheckin.week_number})
          </p>
        ) : (
          <p className="text-xs text-[#94A3B8]">{client.full_name} n&apos;a pas encore envoyé de check-in.</p>
        )}
      </div>

      {/* Infos client + actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Informations</p>
          <InfoRow label="Email" value={client.email.includes('@evolya.internal') ? '—' : client.email} />
          <InfoRow label="Statut" value={client.status === 'active' ? 'Actif' : 'Inactif'} />
          <InfoRow label="Client depuis" value={memberSince} />
        </div>

        {isCoach && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Actions rapides</p>
            <button
              onClick={onNewSession}
              className="w-full flex items-center gap-2 px-3 py-2.5 btn-brand rounded-lg text-sm font-medium transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Nouvelle séance
            </button>
            <button
              onClick={() => setShowBilan(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg text-sm font-medium transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L8 4.5H12L9 7l1 3.5L6.5 8.5 3.5 10.5l1-3.5L1.5 4.5H5L6.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Préparer le bilan
            </button>
            {client.magic_token && (
              <a
                href={`/c/${client.magic_token}/dashboard?coach=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] rounded-lg text-sm font-medium transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M7.5 2.5h3v3M10.5 2.5L6 7M3 3.5H2A1 1 0 001 4.5v6a1 1 0 001 1h6a1 1 0 001-1V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Voir l&apos;espace client
              </a>
            )}
          </div>
        )}
      </div>

      {/* Profil client — données onboarding */}
      <ClientProfilCard client={client} />

      {showBilan && (
        <BilanModal
          clientId={client.id}
          clientName={client.full_name}
          onClose={() => setShowBilan(false)}
        />
      )}
    </div>
  )
}

const GOAL_LABELS: Record<string, string> = {
  perte_de_poids:  'Perte de poids',
  prise_de_masse:  'Prise de masse',
  performance:     'Performance sportive',
  remise_en_forme: 'Remise en forme',
  autre:           'Autre',
}
const ACTIVITY_LABELS: Record<string, string> = {
  sedentaire:       'Sédentaire',
  leger:            'Légèrement actif',
  moderement_actif: 'Modérément actif',
  tres_actif:       'Très actif',
}

function calcBmiCoach(h: number | null, w: number | null) {
  if (!h || !w) return null
  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10
  if (bmi < 18.5) return { value: bmi, color: '#3B82F6' }
  if (bmi < 25)   return { value: bmi, color: '#4E9B6F' }
  if (bmi < 30)   return { value: bmi, color: '#D97706' }
  return { value: bmi, color: '#EF4444' }
}

function calcAgeCoach(birth: string | null): number | null {
  if (!birth) return null
  const d = new Date(birth)
  const t = new Date()
  let age = t.getFullYear() - d.getFullYear()
  const m = t.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--
  return age
}

function ProfileChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: color ?? '#0D1F3C' }}>{value}</span>
    </div>
  )
}

function ClientProfilCard({ client }: { client: Client }) {
  const hasPhysical = client.height_cm || client.weight_kg || client.gender || client.birth_date
  const hasCoaching = client.main_goal || client.activity_level
  const hasHabits   = client.injuries || client.dietary_habits || client.avg_sleep_hours
  const hasPerf     = client.sport_performances || client.daily_calories_estimated
  const hasAny      = hasPhysical || hasCoaching || hasHabits || hasPerf

  if (!hasAny) return (
    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-4 text-center">
      <p className="text-[12px] text-[#94A3B8]">Onboarding non complété — aucune donnée de profil.</p>
    </div>
  )

  const age  = calcAgeCoach(client.birth_date)
  const bmi  = calcBmiCoach(client.height_cm, client.weight_kg)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-3">Profil client</p>

      {/* Physical stats row */}
      {hasPhysical && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#F1F5F9] border-y border-[#F1F5F9]">
          {age !== null && (
            <div className="bg-white px-4 py-3"><ProfileChip label="Âge" value={`${age} ans`} /></div>
          )}
          {client.gender && (
            <div className="bg-white px-4 py-3"><ProfileChip label="Genre" value={client.gender === 'homme' ? 'Homme' : 'Femme'} /></div>
          )}
          {client.height_cm && (
            <div className="bg-white px-4 py-3"><ProfileChip label="Taille" value={`${client.height_cm} cm`} /></div>
          )}
          {client.weight_kg && (
            <div className="bg-white px-4 py-3"><ProfileChip label="Poids" value={`${client.weight_kg} kg`} /></div>
          )}
          {bmi && (
            <div className="bg-white px-4 py-3"><ProfileChip label="IMC" value={String(bmi.value)} color={bmi.color} /></div>
          )}
        </div>
      )}

      {/* Text rows */}
      <div className="px-4 py-1 divide-y divide-[#F8FAFB]">
        {client.main_goal && <InfoRow label="Objectif" value={GOAL_LABELS[client.main_goal] ?? client.main_goal} />}
        {client.activity_level && <InfoRow label="Activité" value={ACTIVITY_LABELS[client.activity_level] ?? client.activity_level} />}
        {client.injuries && <InfoRow label="Blessures" value={client.injuries} />}
        {client.dietary_habits && <InfoRow label="Alimentation" value={client.dietary_habits} />}
        {client.avg_sleep_hours && <InfoRow label="Sommeil" value={`${client.avg_sleep_hours}h / nuit`} />}
        {client.sport_performances && <InfoRow label="Performances" value={client.sport_performances} />}
        {client.daily_calories_estimated && <InfoRow label="Calories / jour" value={`${client.daily_calories_estimated} kcal`} />}
      </div>
    </div>
  )
}

function StatChip({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 sm:p-3.5 ${highlight ? 'bg-brand-bg border-brand/20' : 'bg-white border-[#E2E8F0]'}`}>
      <p className={`text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide mb-1 leading-tight ${highlight ? 'text-brand' : 'text-[#94A3B8]'}`}>{label}</p>
      <p className={`text-[20px] sm:text-[26px] font-bold leading-none ${highlight ? 'text-brand' : 'text-[#0D1F3C]'}`}>{value}</p>
      {sub && <p className="text-[9px] sm:text-[11px] text-[#94A3B8] mt-0.5 sm:mt-1">{sub}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#94A3B8]">{label}</span>
      <span className="text-xs font-medium text-[#0D1F3C] text-right">{value}</span>
    </div>
  )
}

// ─── Sessions Tab ───────────────────────────────────────────────────────────────

function SessionsTab({ client, sessions, isCoach }: { client: Client; sessions: Session[]; isCoach: boolean }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [date, setDate] = useState(localDateStr(new Date()))
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [recurring, setRecurring] = useState(false)
  const [recurringDow, setRecurringDow] = useState(1)
  const [recurringInterval, setRecurringInterval] = useState<1 | 2>(1)
  const [recurringEndMode, setRecurringEndMode] = useState<'count' | 'date'>('count')
  const [recurringCount, setRecurringCount] = useState(8)
  const [recurringEndDate, setRecurringEndDate] = useState('')

  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineNotes, setInlineNotes] = useState('')
  const [inlinePrivateNotes, setInlinePrivateNotes] = useState('')
  const [inlineSaving, setInlineSaving] = useState(false)
  const [notesOverride, setNotesOverride] = useState<Record<string, { notes: string; private_notes: string }>>({})

  function openInlineEdit(session: Session) {
    setInlineEditId(session.id)
    setInlineNotes(notesOverride[session.id]?.notes ?? session.notes ?? '')
    setInlinePrivateNotes(notesOverride[session.id]?.private_notes ?? session.private_notes ?? '')
  }

  async function saveInlineNotes(sessionId: string) {
    setInlineSaving(true)
    const res = await fetch('/api/sessions/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, notes: inlineNotes, private_notes: inlinePrivateNotes }),
    })
    setInlineSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Notes enregistrées.')
    setNotesOverride(prev => ({ ...prev, [sessionId]: { notes: inlineNotes, private_notes: inlinePrivateNotes } }))
    setInlineEditId(null)
    router.refresh()
  }

  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'attended' | 'missed' | null>>(() =>
    Object.fromEntries(sessions.map(s => [s.id, s.attendance ?? null]))
  )

  async function handleAttendance(sessionId: string, value: 'attended' | 'missed' | null) {
    const next = { ...attendanceMap, [sessionId]: value }
    setAttendanceMap(next)
    await fetch('/api/sessions/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, attendance: value }),
    })
  }

  async function handleDelete(sessionId: string) {
    const res = await fetch('/api/sessions/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    if (!res.ok) { toast.error('Erreur lors de la suppression.'); return }
    toast.success('Séance supprimée.')
    setDeleteConfirmId(null)
    router.refresh()
  }

  const now = new Date()
  const todayStr = localDateStr(now)
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())

  function openNew(prefillDate?: string) {
    const d = prefillDate ?? localDateStr(new Date())
    setEditId(null)
    setDate(d)
    setTime('')
    setNotes('')
    setPrivateNotes('')
    setRecurring(false)
    setRecurringDow(new Date(d + 'T12:00:00').getDay())
    setRecurringInterval(1)
    setRecurringEndMode('count')
    setRecurringCount(8)
    setRecurringEndDate('')
    setShowModal(true)
  }

  function openEdit(session: Session) {
    setEditId(session.id)
    setDate(session.session_date)
    setTime(session.session_time ?? '')
    setNotes(session.notes ?? '')
    setPrivateNotes(session.private_notes ?? '')
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (editId) {
      const res = await fetch('/api/sessions/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: editId, session_date: date, session_time: time || null, notes, private_notes: privateNotes }),
      })
      if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); setLoading(false); return }
      toast.success('Séance modifiée avec succès.')
    } else {
      const existingDates = new Set(sessions.map(s => s.session_date))
      const inserts: { client_id: string; coach_id: string; session_date: string; session_time: string | null; notes: string; private_notes: string }[] = [
        { client_id: client.id, coach_id: '', session_date: date, session_time: time || null, notes, private_notes: privateNotes }
      ]
      if (recurring) {
        const startD = new Date(date + 'T12:00:00')
        const startDow = startD.getDay()
        let daysToFirst = (recurringDow - startDow + 7) % 7
        if (daysToFirst === 0) daysToFirst = recurringInterval * 7
        const endDateLimit = recurringEndMode === 'date' && recurringEndDate
          ? new Date(recurringEndDate + 'T23:59:59')
          : null
        const maxCount = recurringEndMode === 'count' ? recurringCount : 500
        const cursor = new Date(startD)
        cursor.setDate(cursor.getDate() + daysToFirst)
        let added = 0
        while (added < maxCount) {
          if (endDateLimit && cursor > endDateLimit) break
          const ds = localDateStr(cursor)
          if (!existingDates.has(ds)) {
            inserts.push({ client_id: client.id, coach_id: '', session_date: ds, session_time: time || null, notes, private_notes: privateNotes })
          }
          cursor.setDate(cursor.getDate() + recurringInterval * 7)
          added++
        }
      }
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: inserts }),
      })
      if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); setLoading(false); return }
      toast.success(inserts.length > 1 ? `${inserts.length} séances planifiées.` : 'Séance ajoutée avec succès.')
    }

    setLoading(false)
    setShowModal(false)
    router.refresh()
  }

  function buildCalendarGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const calCells = buildCalendarGrid(calYear, calMonth)

  const sessionByDate = new Map<string, Session>()
  for (const s of sessions) sessionByDate.set(s.session_date, s)

  const MONTH_NAMES_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ]
  const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  function calPrevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function calNextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  function handleCalDayClick(d: Date) {
    const dateStr = localDateStr(d)
    const session = sessionByDate.get(dateStr)
    if (session) openEdit(session)
    else openNew(dateStr)
  }

  return (
    <div>
      {isCoach && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => openNew()}
            className="flex items-center gap-2 px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-colors"
          >
            + Nouvelle séance
          </button>
        </div>
      )}

      {isCoach && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={calPrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors text-base">
              ‹
            </button>
            <p className="text-sm font-semibold text-[#0D1F3C]">
              {MONTH_NAMES_FR[calMonth]} {calYear}
            </p>
            <button onClick={calNextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors text-base">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((h, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-[#94A3B8] py-1">{h}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calCells.map((d, i) => {
              if (!d) return <div key={i} />
              const dateStr = localDateStr(d)
              const isPast = d < now
              const isToday = dateStr === todayStr
              const session = sessionByDate.get(dateStr)
              const att = session ? (attendanceMap[session.id] ?? null) : null
              const hasFutureSession = !!session && !isPast

              const bgClass = !session ? '' :
                isPast && att === 'attended' ? 'bg-brand text-white' :
                isPast && att === 'missed'   ? 'bg-red-400 text-white' :
                isPast                       ? 'bg-[#E2E8F0] text-[#64748B]' : ''

              const borderClass = hasFutureSession ? 'border-2 border-brand text-brand' : ''
              const hoverClass = !session ? 'hover:bg-[#F1F5F9]' : ''

              return (
                <button
                  key={i}
                  onClick={() => handleCalDayClick(d)}
                  className="relative flex items-center justify-center h-8 w-full transition-all"
                >
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all ${bgClass} ${borderClass} ${hoverClass}`}>
                    {d.getDate()}
                  </span>
                  {isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F1F5F9] flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
              <span className="w-4 h-4 rounded-full bg-brand inline-block" />
              Présent
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
              <span className="w-4 h-4 rounded-full bg-red-400 inline-block" />
              Absent
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
              <span className="w-4 h-4 rounded-full bg-[#E2E8F0] inline-block" />
              Non marquée
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
              <span className="w-4 h-4 rounded-full border-2 border-brand inline-block" />
              Planifiée
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg">
          <EmptyState
            icon="sessions"
            title="Aucune séance enregistrée"
            description={isCoach ? "Ajoutez votre première note de séance pour ce client." : "Votre coach n'a pas encore enregistré de séance."}
            action={isCoach ? (
              <button onClick={() => openNew()} className="px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-colors">
                + Nouvelle séance
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isPast = session.session_date <= todayStr
            const att = attendanceMap[session.id] ?? null
            const isInlineEditing = inlineEditId === session.id
            const displayNotes = notesOverride[session.id]?.notes ?? session.notes
            const displayPrivateNotes = notesOverride[session.id]?.private_notes ?? session.private_notes

            return (
              <div
                key={session.id}
                className={`bg-white rounded-xl border transition-colors ${
                  isPast && att === 'attended' ? 'border-brand/30' :
                  isPast && att === 'missed'   ? 'border-red-200' :
                  'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#0D1F3C]">
                      {formatDate(session.session_date)}
                      {session.session_time && (
                        <span className="ml-2 text-xs font-medium text-brand bg-brand-bg px-2 py-0.5 rounded-full">
                          {session.session_time.replace(':', 'h')}
                        </span>
                      )}
                    </span>
                    {isPast && att === 'attended' && (
                      <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full">✓ Présent</span>
                    )}
                    {isPast && att === 'missed' && (
                      <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">✗ Absent</span>
                    )}
                    {!isPast && (
                      <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Planifiée</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCoach && isPast && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAttendance(session.id, att === 'attended' ? null : 'attended')}
                          className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                            att === 'attended' ? 'bg-brand text-white border-brand'
                              : 'text-[#64748B] border-[#E2E8F0] hover:border-brand hover:text-brand'
                          }`}
                          title="Présent"
                        >✓</button>
                        <button
                          onClick={() => handleAttendance(session.id, att === 'missed' ? null : 'missed')}
                          className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                            att === 'missed' ? 'bg-red-400 text-white border-red-400'
                              : 'text-[#64748B] border-[#E2E8F0] hover:border-red-300 hover:text-red-400'
                          }`}
                          title="Absent"
                        >✗</button>
                      </div>
                    )}
                    {isCoach && (
                      deleteConfirmId === session.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(session.id)}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors">
                            Confirmer
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-[#64748B] border border-[#E2E8F0] px-2.5 py-1 rounded-md hover:bg-[#F1F5F9] transition-colors">
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(session.id)}
                          className="text-xs text-[#64748B] hover:text-red-500 border border-[#E2E8F0] hover:border-red-200 px-2.5 py-1 rounded-md transition-colors">
                          Supprimer
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-4 space-y-3">
                  {isCoach && isInlineEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
                          Note de séance <span className="normal-case font-normal text-[#94A3B8]">— visible par le client</span>
                        </label>
                        <textarea
                          value={inlineNotes}
                          onChange={e => setInlineNotes(e.target.value)}
                          rows={4}
                          placeholder="Ce qui a été abordé, les avancées, les points clés de la séance..."
                          autoFocus
                          className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] focus:outline-none focus:border-brand transition-colors resize-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
                          Note privée <span className="normal-case font-normal text-[#94A3B8]">— invisible pour le client</span>
                        </label>
                        <textarea
                          value={inlinePrivateNotes}
                          onChange={e => setInlinePrivateNotes(e.target.value)}
                          rows={3}
                          placeholder="Observations personnelles, hypothèses, plan pour la prochaine séance..."
                          className="w-full px-3 py-2.5 bg-[#FFFBF2] border border-[#D4A853]/30 rounded-lg text-sm text-[#0D1F3C] focus:outline-none focus:border-[#D4A853] transition-colors resize-none leading-relaxed"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveInlineNotes(session.id)}
                          disabled={inlineSaving}
                          className="px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                        >
                          {inlineSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          onClick={() => setInlineEditId(null)}
                          className="px-4 py-2 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {displayNotes ? (
                        <p className="text-sm text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{displayNotes}</p>
                      ) : (
                        <p className="text-sm text-[#94A3B8] italic">
                          {isCoach ? 'Aucune note — cliquez sur "Écrire" pour ajouter.' : 'Aucune note pour cette séance.'}
                        </p>
                      )}
                      {isCoach && displayPrivateNotes && (
                        <div className="mt-3 bg-[#FFFBF2] border border-[#D4A853]/30 rounded-lg px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-[#D4A853] uppercase tracking-wide mb-1">Note privée</p>
                          <p className="text-xs text-[#64748B] leading-relaxed whitespace-pre-wrap">{displayPrivateNotes}</p>
                        </div>
                      )}
                      {isCoach && (
                        <button
                          onClick={() => openInlineEdit(session)}
                          className="mt-3 text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1 transition-colors"
                        >
                          <span className="text-base leading-none">✎</span>
                          {displayNotes ? 'Modifier les notes' : 'Écrire une note'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl border border-[#E2E8F0] w-full sm:max-w-lg shadow-md overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-semibold text-[#0D1F3C]">{editId ? 'Modifier la séance' : 'Nouvelle séance'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#94A3B8] hover:text-[#64748B] text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">
                    Heure <span className="text-xs font-normal text-[#9B9B93]">(optionnel)</span>
                  </label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Notes de séance</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  placeholder="Notes visibles par le client..."
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-1">
                  Notes privées <span className="text-xs font-normal text-[#64748B] ml-1">— invisibles du client</span>
                </label>
                <textarea value={privateNotes} onChange={e => setPrivateNotes(e.target.value)} rows={3}
                  placeholder="Notes uniquement visibles par vous..."
                  className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors resize-none" />
              </div>
              {!editId && (() => {
                const DOW_SHORT = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']
                const DOW_FULL  = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
                const previewDates: string[] = []
                if (recurring && date) {
                  const startD = new Date(date + 'T12:00:00')
                  let daysToFirst = (recurringDow - startD.getDay() + 7) % 7
                  if (daysToFirst === 0) daysToFirst = recurringInterval * 7
                  const endLimit = recurringEndMode === 'date' && recurringEndDate
                    ? new Date(recurringEndDate + 'T23:59:59') : null
                  const max = recurringEndMode === 'count' ? recurringCount : 500
                  const cur = new Date(startD); cur.setDate(cur.getDate() + daysToFirst)
                  let n = 0
                  while (n < max && previewDates.length < 60) {
                    if (endLimit && cur > endLimit) break
                    previewDates.push(localDateStr(cur))
                    cur.setDate(cur.getDate() + recurringInterval * 7); n++
                  }
                }
                const totalCount = recurring ? 1 + previewDates.length : 1
                const lastDate = previewDates[previewDates.length - 1]
                const intervalOptions: (1 | 2)[] = [1, 2]
                const endModeOptions: ('count' | 'date')[] = ['count', 'date']

                return (
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <button type="button" onClick={() => setRecurring(r => !r)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFB] hover:bg-[#F1F5F9] transition-colors">
                      <span className="text-sm font-medium text-[#0D1F3C]">Répétition</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${recurring ? 'bg-brand text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        {recurring ? 'Activée' : 'Désactivée'}
                      </span>
                    </button>
                    {recurring && (
                      <div className="px-4 py-4 space-y-4 border-t border-[#E2E8F0] bg-white">
                        <div>
                          <p className="text-xs text-[#64748B] mb-2">Répéter chaque</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 0].map(dow => (
                              <button key={dow} type="button"
                                onClick={() => setRecurringDow(dow)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  recurringDow === dow ? 'bg-brand text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                                }`}>
                                {DOW_SHORT[dow]}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-brand mt-1.5 font-medium">
                            Tous les {DOW_FULL[recurringDow]}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1.5">Fréquence</p>
                          <div className="flex gap-2">
                            {intervalOptions.map(v => (
                              <button key={v} type="button"
                                onClick={() => setRecurringInterval(v)}
                                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                  recurringInterval === v
                                    ? 'border-brand bg-brand-bg text-brand'
                                    : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                                }`}>
                                {v === 1 ? 'Toutes les semaines' : 'Toutes les 2 semaines'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-1 mb-2">
                            {endModeOptions.map(mode => (
                              <button key={mode} type="button"
                                onClick={() => setRecurringEndMode(mode)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  recurringEndMode === mode ? 'bg-[#0D1F3C] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                                }`}>
                                {mode === 'count' ? 'Nombre de séances' : 'Date de fin'}
                              </button>
                            ))}
                          </div>
                          {recurringEndMode === 'count' ? (
                            <select value={recurringCount} onChange={e => setRecurringCount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand">
                              {[4, 6, 8, 10, 12, 16, 20, 26, 52].map(n => (
                                <option key={n} value={n}>{n} répétitions supplémentaires</option>
                              ))}
                            </select>
                          ) : (
                            <input type="date" value={recurringEndDate} min={date}
                              onChange={e => setRecurringEndDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand" />
                          )}
                        </div>
                        {totalCount > 1 && (
                          <div className="bg-brand-bg rounded-lg px-3 py-2.5">
                            <p className="text-xs font-medium text-brand">
                              {totalCount} séances planifiées
                              {lastDate && (
                                <span className="font-normal"> · jusqu&apos;au {new Date(lastDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                              )}
                            </p>
                          </div>
                        )}
                        {totalCount === 1 && recurringEndMode === 'date' && !recurringEndDate && (
                          <p className="text-xs text-[#94A3B8]">Choisissez une date de fin.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
              <div className="flex gap-3 pb-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({
  clientNotes,
  coachNotes: initialCoachNotes,
  clientId,
}: {
  clientNotes: ClientNote[]
  coachNotes: ClientNote[]
  clientId: string
}) {
  const [coachNotes, setCoachNotes] = useState<ClientNote[]>(initialCoachNotes)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/coach/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, content }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setCoachNotes(prev => [data.note, ...prev])
    setContent('')
    toast.success('Note ajoutée.')
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId)
    const res = await fetch('/api/coach/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, clientId }),
    })
    const data = await res.json()
    setDeletingId(null)
    if (data.error) { toast.error(data.error); return }
    setCoachNotes(prev => prev.filter(n => n.id !== noteId))
    toast.success('Note supprimée.')
  }

  function formatNoteDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[#0D1F3C]">Mes notes privées</h3>
          <span className="text-xs text-[#94A3B8]">visibles uniquement par vous</span>
        </div>
        <form onSubmit={handleAdd} className="mb-3">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder="Observations, impressions, points à aborder en séance..."
              className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">{content.length}/2000</span>
              <button
                type="submit"
                disabled={!content.trim() || saving}
                className="px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </form>
        {coachNotes.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl px-4 py-6 text-center text-sm text-[#94A3B8]">
            Aucune note privée pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-2">
            {coachNotes.map(note => (
              <div key={note.id} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 flex items-start gap-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-[#94A3B8] mt-1.5">{formatNoteDate(note.created_at)}</p>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="flex-shrink-0 px-2 py-1 text-xs text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                >
                  {deletingId === note.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[#0D1F3C]">Notes du client</h3>
          <span className="text-xs text-[#94A3B8]">notes partagées par le client</span>
        </div>
        {clientNotes.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl px-4 py-6 text-center text-sm text-[#94A3B8]">
            Aucune note publique pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-2">
            {clientNotes.map(note => (
              <div key={note.id} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                <p className="text-sm text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-[#94A3B8] mt-1.5">{formatNoteDate(note.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profil Tab (Sport / Nutrition / Habitudes) ───────────────────────────────

const MONTHS_FR_P = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return {
    week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
    year: d.getUTCFullYear(),
  }
}

type ProfilSection = 'sport' | 'nutrition' | 'habitudes'

function ProfilTab({
  client, sessions, checkins, weightEntries, bodyMeasurements, sleepEntries, performanceEntries, isCoach,
}: {
  client: Client; sessions: Session[]; checkins: Checkin[]
  weightEntries: WeightEntry[]; bodyMeasurements: BodyMeasurement[]
  sleepEntries: SleepEntry[]; performanceEntries: PerformanceEntry[]; isCoach: boolean
}) {
  const [section, setSection] = useState<ProfilSection>('sport')

  const TABS: { key: ProfilSection; label: string }[] = [
    { key: 'sport',      label: '⚡ Sport' },
    { key: 'nutrition',  label: '🥗 Nutrition' },
    { key: 'habitudes',  label: '🌙 Habitudes' },
  ]

  return (
    <div>
      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-5 w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${section === key ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
            {label}
          </button>
        ))}
      </div>
      {section === 'sport' && <SportSection client={client} sessions={sessions} performanceEntries={performanceEntries} isCoach={isCoach} />}
      {section === 'nutrition' && <NutritionSection client={client} weightEntries={weightEntries} bodyMeasurements={bodyMeasurements} />}
      {section === 'habitudes' && <HabiudesSection client={client} checkins={checkins} sleepEntries={sleepEntries} />}
    </div>
  )
}

function SportSection({ client, sessions, performanceEntries, isCoach }: { client: Client; sessions: Session[]; performanceEntries: PerformanceEntry[]; isCoach: boolean }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const pastSessions = sessions.filter(s => s.session_date <= todayStr)
  const nextSession = sessions.filter(s => s.session_date > todayStr).sort((a, b) => a.session_date.localeCompare(b.session_date))[0]
  const attended = pastSessions.filter(s => s.attendance === 'attended').length
  const missed = pastSessions.filter(s => s.attendance === 'missed').length
  const markedSessions = pastSessions.filter(s => s.attendance !== null)
  const attendanceRate = markedSessions.length > 0 ? Math.round((attended / markedSessions.length) * 100) : null
  const recentSessions = [...pastSessions].sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip label="⚡ Séances" value={String(sessions.length)} sub={`${pastSessions.length} passées`} />
        <StatChip label="✅ Présence" value={attendanceRate !== null ? `${attendanceRate}%` : '—'} sub={markedSessions.length > 0 ? `${attended}P · ${missed}A` : 'Non marquée'} />
        <StatChip label="📅 Prochaine" value={nextSession ? formatDate(nextSession.session_date) : '—'} sub={nextSession?.session_time?.replace(':', 'h') ?? ''} />
      </div>

      {(client.main_goal || client.activity_level) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">🏅 Profil sportif</p>
          <div className="divide-y divide-[#F8FAFB]">
            {client.main_goal && <InfoRow label="Objectif" value={GOAL_LABELS[client.main_goal] ?? client.main_goal} />}
            {client.activity_level && <InfoRow label="Niveau activité" value={ACTIVITY_LABELS[client.activity_level] ?? client.activity_level} />}
            {client.sport_performances && (
              <div className="py-2.5">
                <p className="text-xs text-[#94A3B8] mb-1">Notes performances</p>
                <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.sport_performances}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {performanceEntries.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2">🏆 Performances enregistrées</p>
          <div className="divide-y divide-[#F8FAFB]">
            {performanceEntries.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-semibold text-[#0D1F3C]">{p.label}</span>
                  {p.notes && <span className="text-[11px] text-[#94A3B8] ml-2 truncate hidden sm:inline">{p.notes}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[13px] font-bold text-brand">{p.value} {p.unit}</span>
                  <span className="text-[10px] text-[#94A3B8]">{new Date(p.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentSessions.length > 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2">📋 5 dernières séances</p>
          <div className="divide-y divide-[#F8FAFB]">
            {recentSessions.map(s => {
              const att = s.attendance
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[12px] font-medium text-[#0D1F3C] shrink-0">{formatDate(s.session_date)}</span>
                    {s.session_time && <span className="text-[11px] text-[#94A3B8] shrink-0">{s.session_time.replace(':', 'h')}</span>}
                    {isCoach && s.notes && <span className="text-[11px] text-[#94A3B8] truncate hidden sm:block">{s.notes.slice(0, 60)}{s.notes.length > 60 ? '…' : ''}</span>}
                  </div>
                  {att === 'attended' && <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full shrink-0">✓ Présent</span>}
                  {att === 'missed' && <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full shrink-0">✗ Absent</span>}
                  {!att && <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full shrink-0">Non marquée</span>}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-6 text-center">
          <p className="text-sm text-[#94A3B8]">Aucune séance enregistrée.</p>
        </div>
      )}
    </div>
  )
}

function NutritionProgrammeEditor({ clientId }: { clientId: string }) {
  const [programme, setProgramme] = useState<{ id: string; title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach/nutrition?clientId=${clientId}`)
      .then(r => r.json())
      .then(d => { setProgramme(d.programme ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  function startEdit() {
    setTitle(programme?.title ?? 'Programme nutritionnel')
    setContent(programme?.content ?? '')
    setEditing(true)
  }

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/coach/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, title, content }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setProgramme(data.programme)
    setEditing(false)
    toast.success('Programme nutritionnel sauvegardé !')
  }

  if (loading) return null

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">🥗 Programme nutritionnel client</p>
        {!editing && (
          <button onClick={startEdit} className="text-[12px] font-medium text-brand hover:underline">
            {programme ? 'Modifier' : 'Rédiger'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Titre du programme"
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand"
          />
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            rows={6}
            placeholder="Rédigez ici le programme nutritionnel du client : objectifs caloriques, répartition des macros, conseils repas…"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand resize-none"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !content.trim()}
              className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-[13px] text-[#64748B] hover:text-[#0D1F3C]">Annuler</button>
          </div>
        </div>
      ) : programme ? (
        <p className="text-[13px] text-[#0D1F3C] leading-relaxed whitespace-pre-wrap line-clamp-4">{programme.content}</p>
      ) : (
        <p className="text-[12px] text-[#94A3B8] text-center py-4">Aucun programme nutritionnel défini pour ce client.</p>
      )}
    </div>
  )
}

function NutritionSection({ client, weightEntries, bodyMeasurements }: { client: Client; weightEntries: WeightEntry[]; bodyMeasurements: BodyMeasurement[] }) {
  const bmi = calcBmiCoach(client.height_cm, client.weight_kg)
  const weightData = useMemo(() =>
    weightEntries.map(w => ({
      date: new Date(w.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      poids: w.weight_kg,
    })), [weightEntries])
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].poids : client.weight_kg
  const weightDelta = weightData.length >= 2 ? +(weightData[weightData.length - 1].poids - weightData[0].poids).toFixed(1) : null
  const measFields: { key: keyof BodyMeasurement; label: string }[] = [
    { key: 'neck_cm',       label: 'Cou' },
    { key: 'shoulders_cm',  label: 'Épaules' },
    { key: 'chest_cm',      label: 'Poitrine' },
    { key: 'waist_cm',      label: 'Tour de taille' },
    { key: 'hips_cm',       label: 'Tour de hanches' },
    { key: 'l_bicep_cm',    label: 'Biceps gauche' },
    { key: 'r_bicep_cm',    label: 'Biceps droit' },
    { key: 'l_forearm_cm',  label: 'Avant-bras gauche' },
    { key: 'r_forearm_cm',  label: 'Avant-bras droit' },
    { key: 'l_thigh_cm',    label: 'Cuisse gauche' },
    { key: 'r_thigh_cm',    label: 'Cuisse droite' },
  ]
  const firstMeas = bodyMeasurements[0]
  const lastMeas = bodyMeasurements[bodyMeasurements.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="⚖️ Poids" value={currentWeight ? `${currentWeight} kg` : '—'} sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg` : 'profil statique'} />
        <StatChip label="📏 Taille" value={client.height_cm ? `${client.height_cm} cm` : '—'} sub={client.gender === 'homme' ? 'Homme' : client.gender === 'femme' ? 'Femme' : ''} />
        <StatChip label="📊 IMC" value={bmi ? String(bmi.value) : '—'} sub={bmi ? (bmi.value < 18.5 ? 'Insuffisant' : bmi.value < 25 ? 'Normal' : bmi.value < 30 ? 'Surpoids' : 'Obésité') : ''} />
        <StatChip label="🔥 Calories" value={client.daily_calories_estimated ? `${client.daily_calories_estimated}` : '—'} sub="kcal / jour" />
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C]">📈 Évolution du poids</p>
            {weightDelta !== null && (
              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${weightDelta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : weightDelta > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {weightDelta > 0 ? '+' : ''}{weightDelta} kg depuis le début
              </span>
            )}
          </div>
          {currentWeight && <p className="text-[13px] font-bold text-[#0D1F3C]">{currentWeight} kg</p>}
        </div>
        {weightData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#CBD5E1' }} tickFormatter={v => `${v}kg`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} kg`, 'Poids']} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Line type="monotone" dataKey="poids" stroke="var(--brand)" strokeWidth={2} dot={{ fill: 'var(--brand)', r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[12px] text-[#94A3B8] text-center py-6">
            {weightData.length === 0 ? 'Aucune pesée enregistrée' : 'Il faut au minimum 2 pesées pour afficher la courbe'}
          </p>
        )}
      </div>

      {bodyMeasurements.length > 0 && firstMeas && lastMeas && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">📐 Mensurations</p>
          <p className="text-[11px] text-[#94A3B8] mb-4">
            {bodyMeasurements.length === 1
              ? `Mesure du ${new Date(firstMeas.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
              : `${new Date(firstMeas.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${new Date(lastMeas.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
            }
          </p>
          <div className="space-y-2">
            {measFields.map(({ key, label }) => {
              const first = firstMeas[key] as number | null
              const last = lastMeas[key] as number | null
              if (last === null) return null
              const delta = (bodyMeasurements.length > 1 && first !== null) ? +(last - first).toFixed(1) : null
              return (
                <div key={key as string} className="flex items-center gap-3 py-2 border-b border-[#F8FAFB] last:border-0">
                  <span className="text-[12px] text-[#64748B] w-36 shrink-0">{label}</span>
                  <span className="text-[13px] font-semibold text-[#0D1F3C] tabular-nums">{last} cm</span>
                  {delta !== null && delta !== 0 && (
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full tabular-nums ${delta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                      {delta > 0 ? '+' : ''}{delta} cm
                    </span>
                  )}
                  {delta === 0 && <span className="text-[11px] text-[#CBD5E1]">stable</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(client.dietary_habits || client.daily_calories_estimated) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">🥗 Profil alimentaire</p>
          <div className="divide-y divide-[#F8FAFB]">
            {client.dietary_habits && (
              <div className="py-2.5">
                <p className="text-xs text-[#94A3B8] mb-1">Habitudes</p>
                <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.dietary_habits}</p>
              </div>
            )}
            {client.daily_calories_estimated && <InfoRow label="Calories / jour" value={`${client.daily_calories_estimated} kcal`} />}
          </div>
        </div>
      )}

      <NutritionProgrammeEditor clientId={client.id} />
    </div>
  )
}

function HabitsManager({ clientId }: { clientId: string }) {
  const [habits, setHabits] = useState<{ id: string; name: string; emoji: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach/habits?clientId=${clientId}`)
      .then(r => r.json())
      .then(d => { setHabits(d.habits ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  async function addHabit() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/coach/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, name: newName.trim(), emoji: newEmoji }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setHabits(prev => [...prev, data.habit])
    setNewName(''); setNewEmoji('✅')
    toast.success('Habitude ajoutée !')
  }

  async function deleteHabit(id: string) {
    await fetch(`/api/coach/habits?clientId=${clientId}&id=${id}`, { method: 'DELETE' })
    setHabits(prev => prev.filter(h => h.id !== id))
    toast.success('Supprimé')
  }

  if (loading) return null

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">💤 Habitudes à cocher (client)</p>
      {habits.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {habits.map(h => (
            <div key={h.id} className="flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFB] rounded-lg">
              <span className="text-[15px]">{h.emoji}</span>
              <span className="flex-1 text-[13px] text-[#0D1F3C]">{h.name}</span>
              <button onClick={() => deleteHabit(h.id)} className="text-[#D1D5DB] hover:text-red-400 transition-colors text-[18px] leading-none">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text" value={newEmoji} onChange={e => setNewEmoji(e.target.value.slice(0, 4))}
          className="w-12 text-center px-1 py-2 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none"
          placeholder="✅"
        />
        <input
          type="text" value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="Ex : 8 verres d'eau, 30 min marche…"
          className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand"
          onKeyDown={e => e.key === 'Enter' && addHabit()}
        />
        <button onClick={addHabit} disabled={saving || !newName.trim()}
          className="px-3 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50 whitespace-nowrap">
          +
        </button>
      </div>
    </div>
  )
}

function HabiudesSection({ client, checkins, sleepEntries }: { client: Client; checkins: Checkin[]; sleepEntries: SleepEntry[] }) {
  const now = new Date()
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()
  const hasCheckinThisWeek = checkins.some(c => c.week_number === currentWeek && c.year === currentYear)

  // Sleep stats from real data
  const sleep7d = sleepEntries.filter(s => {
    const d = new Date(s.date + 'T00:00')
    return (now.getTime() - d.getTime()) / 86400000 <= 7
  })
  const avgSleep7d = sleep7d.length > 0
    ? +(sleep7d.reduce((acc, s) => acc + s.hours, 0) / sleep7d.length).toFixed(1) : null

  const recentCheckins = checkins.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatChip label="✅ Check-ins" value={String(checkins.length)} sub={hasCheckinThisWeek ? 'Semaine ✓' : 'En attente'} highlight={hasCheckinThisWeek} />
        <StatChip label="🌙 Sommeil moy." value={avgSleep7d !== null ? `${avgSleep7d}h` : client.avg_sleep_hours ? `${client.avg_sleep_hours}h` : '—'} sub={avgSleep7d !== null ? '7 derniers jours' : 'profil statique'} />
      </div>

      {recentCheckins.length > 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2">✅ Derniers check-ins</p>
          <div className="divide-y divide-[#F8FAFB]">
            {recentCheckins.map(c => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-brand bg-brand-bg px-2 py-0.5 rounded-full">S{c.week_number}</span>
                  <span className="text-[11px] text-[#94A3B8]">{new Date(c.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
                {c.q1_answer ? <p className="text-[12px] text-[#0D1F3C] leading-relaxed line-clamp-2">{c.q1_answer}</p> : <p className="text-[12px] text-[#94A3B8] italic">Aucune réponse.</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-6 text-center">
          <p className="text-sm text-[#94A3B8]">Aucun check-in reçu pour ce client.</p>
        </div>
      )}

      {(client.injuries || client.avg_sleep_hours || sleepEntries.length > 0) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">💚 Santé & bien-être</p>
          <div className="divide-y divide-[#F8FAFB]">
            {client.injuries && (
              <div className="py-2.5">
                <p className="text-xs text-[#94A3B8] mb-1">Blessures / contraintes</p>
                <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.injuries}</p>
              </div>
            )}
            {avgSleep7d !== null && <InfoRow label="🌙 Sommeil moyen (7j)" value={`${avgSleep7d}h / nuit`} />}
            {avgSleep7d === null && client.avg_sleep_hours && <InfoRow label="🌙 Sommeil (profil)" value={`${client.avg_sleep_hours}h / nuit`} />}
          </div>
        </div>
      )}

      <HabitsManager clientId={client.id} />
    </div>
  )
}

// ─── Entraînements Tab ─────────────────────────────────────────────────────────

function EntrainementsTab({ workoutLogs }: { workoutLogs: WorkoutLog[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (workoutLogs.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-8 text-center">
        <p className="text-sm text-[#94A3B8]">Aucune séance enregistrée pour ce client.</p>
        <p className="text-xs text-[#CBD5E1] mt-1">Les logs apparaîtront dès que le client aura complété une séance.</p>
      </div>
    )
  }

  const grouped: Record<string, WorkoutLog[]> = {}
  for (const log of workoutLogs) {
    const month = log.log_date.slice(0, 7)
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(log)
  }

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-')
    const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
    return `${MONTHS[parseInt(m) - 1]} ${y}`
  }

  const groupExercises = (logs: WorkoutLog['exercise_logs']) => {
    const map: Record<string, { reps: number[]; weights: number[] }> = {}
    for (const l of logs) {
      const name = l.programme_day_exercises?.exercise_name ?? 'Exercice'
      if (!map[name]) map[name] = { reps: [], weights: [] }
      if (l.reps_done != null) map[name].reps.push(l.reps_done)
      if (l.weight_kg != null) map[name].weights.push(l.weight_kg)
    }
    return map
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([month, logs]) => (
        <div key={month}>
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">{monthLabel(month)} · {logs.length} séance{logs.length > 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {logs.map(log => {
              const progTitle = (log.programme_assignments as { programmes: { title: string } | null } | null)?.programmes?.title ?? 'Programme'
              const dayTitle = log.programme_days?.title ?? `Jour ${log.programme_days?.day_number ?? '?'}`
              const isOpen = openId === log.id
              const exercises = groupExercises(log.exercise_logs)

              return (
                <div key={log.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : log.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFBFD] transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.completed ? 'bg-[#4E9B6F]' : 'bg-[#CBD5E1]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0D1F3C] truncate">{dayTitle}</p>
                      <p className="text-[11px] text-[#94A3B8] truncate">{progTitle}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(log.log_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${log.completed ? 'bg-[#EEF9F3] text-[#4E9B6F]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                        {log.completed ? 'Complété' : 'Partiel'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#CBD5E1] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#F1F5F9]">
                      {Object.keys(exercises).length === 0 ? (
                        <p className="text-[12px] text-[#CBD5E1] pt-3 text-center">Aucune donnée enregistrée.</p>
                      ) : (
                        <div className="pt-3 space-y-2">
                          {Object.entries(exercises).map(([name, data]) => (
                            <div key={name} className="flex items-center justify-between gap-4">
                              <p className="text-[12px] font-medium text-[#0D1F3C] flex-1 min-w-0 truncate">{name}</p>
                              <div className="flex items-center gap-3 shrink-0">
                                {data.reps.length > 0 && (
                                  <span className="text-[11px] text-[#64748B]">
                                    {data.reps.join(' / ')} reps
                                  </span>
                                )}
                                {data.weights.length > 0 && (
                                  <span className="text-[11px] font-semibold text-[#0D1F3C]">
                                    {Math.max(...data.weights)} kg
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Bilan Modal ────────────────────────────────────────────────────────────

const MEAS_LABELS: Record<string, string> = {
  waist_cm: 'Tour de taille', hips_cm: 'Tour de hanches', chest_cm: 'Tour de poitrine',
  l_bicep_cm: 'Bicep G', r_bicep_cm: 'Bicep D', l_thigh_cm: 'Cuisse G', r_thigh_cm: 'Cuisse D',
}

function BilanModal({ clientId, clientName, onClose }: { clientId: string; clientName: string; onClose: () => void }) {
  const [snapshot, setSnapshot] = useState<BilanSnapshot | null>(null)
  const [loading, setLoading]   = useState(true)
  const [coachNote, setCoachNote] = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)

  useEffect(() => {
    fetch(`/api/bilan/preview?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => { setSnapshot(d.snapshot); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  async function handleSend() {
    setSending(true)
    const res = await fetch('/api/bilan/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, coach_note: coachNote || null }),
    })
    setSending(false)
    if (res.ok) { setSent(true); toast.success('Bilan envoyé !') }
    else { const d = await res.json(); toast.error(d.error ?? 'Erreur') }
  }

  function handlePrint() { window.print() }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col print:shadow-none print:max-h-none">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] print:hidden">
          <div>
            <p className="text-[14px] font-semibold text-[#0D1F3C]">Bilan — {clientName}</p>
            {snapshot && <p className="text-[11px] text-[#94A3B8]">{snapshot.period_label}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-[13px] text-[#94A3B8]">Chargement…</div>
          ) : !snapshot ? (
            <div className="py-12 text-center text-[13px] text-[#94A3B8]">Impossible de charger les données.</div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8FAFB] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] mb-1">Check-ins (8 sem.)</p>
                  <p className="text-[22px] font-bold text-[#0D1F3C] leading-none">{snapshot.checkin_count}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Taux : {snapshot.checkin_rate_pct ?? 0}%</p>
                </div>
                <div className="bg-[#F8FAFB] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] mb-1">Objectifs atteints</p>
                  <p className="text-[22px] font-bold text-[#0D1F3C] leading-none">{snapshot.objectives_done}<span className="text-[14px] font-normal text-[#94A3B8]">/{snapshot.objectives_total}</span></p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{snapshot.objectives_total > 0 ? Math.round((snapshot.objectives_done / snapshot.objectives_total) * 100) : 0}% complétés</p>
                </div>
                {snapshot.weight_delta_kg !== null && (
                  <div className="bg-[#F8FAFB] rounded-xl p-3">
                    <p className="text-[10px] text-[#94A3B8] mb-1">Évolution du poids</p>
                    <p className={`text-[22px] font-bold leading-none ${snapshot.weight_delta_kg < 0 ? 'text-[#16A34A]' : snapshot.weight_delta_kg > 0 ? 'text-[#DC2626]' : 'text-[#0D1F3C]'}`}>
                      {snapshot.weight_delta_kg > 0 ? '+' : ''}{snapshot.weight_delta_kg} kg
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{snapshot.weight_start_kg}→{snapshot.weight_end_kg} kg</p>
                  </div>
                )}
                {snapshot.roi_weeks !== null && snapshot.roi_weeks > 0 && (
                  <div className="bg-[#FFF9F0] border border-[#FDE68A] rounded-xl p-3">
                    <p className="text-[10px] text-[#B45309] mb-1">Accompagnement</p>
                    <p className="text-[22px] font-bold text-[#92400E] leading-none">{snapshot.roi_weeks}</p>
                    <p className="text-[11px] text-[#B45309] mt-0.5">semaines ensemble</p>
                  </div>
                )}
              </div>

              {/* Mensurations */}
              {snapshot.measurements_delta && Object.entries(snapshot.measurements_delta).filter(([,v]) => v !== null).length > 0 && (
                <div className="bg-[#F8FAFB] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Mensurations (delta)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(snapshot.measurements_delta).filter(([,v]) => v !== null).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[11px] text-[#64748B]">{MEAS_LABELS[key] ?? key}</span>
                        <span className={`text-[11px] font-bold ${val! < 0 ? 'text-[#16A34A]' : val! > 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                          {val! > 0 ? '+' : ''}{val} cm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objectif principal */}
              {snapshot.main_goal && (
                <div className="bg-[#FFF9F0] border border-[#FDE68A] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-[#B45309] uppercase mb-1">Objectif principal</p>
                  <p className="text-[13px] text-[#92400E]">{snapshot.main_goal}</p>
                </div>
              )}

              {/* Note coach */}
              {!sent && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1.5">
                    Message personnalisé (optionnel)
                  </label>
                  <textarea
                    value={coachNote}
                    onChange={e => setCoachNote(e.target.value)}
                    rows={3}
                    placeholder="Ex : Excellent mois, tu as bien progressé sur la régularité…"
                    className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-xl resize-none focus:outline-none focus:border-[#4E9B6F] bg-white"
                  />
                </div>
              )}

              {sent && (
                <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">
                  <span className="text-[#16A34A]">✓</span>
                  <p className="text-[13px] text-[#166534] font-medium">Bilan envoyé avec succès</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && snapshot && (
          <div className="px-5 py-4 border-t border-[#E2E8F0] flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] rounded-lg text-[13px] font-medium transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5V2h6v3M4 9H2a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1h-2M4 7v5h6V7H4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              PDF
            </button>
            {!sent && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 btn-brand rounded-lg text-[13px] font-semibold disabled:opacity-60 transition-colors"
              >
                {sending ? 'Envoi…' : 'Envoyer au client'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
