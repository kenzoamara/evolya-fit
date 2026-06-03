'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Calendar, Users, CheckSquare, ArrowRight, Plus, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'
import { PlanGate } from '@/components/ui/plan-gate'
import { OnboardingChecklist } from '@/components/coach/onboarding-checklist'

type SessionRow = { id: string; session_date: string; session_time: string | null; created_at: string }
type ClientRow = {
  id: string
  full_name: string
  status: string
  objectives: Array<{ status: string; completed_at?: string | null }>
  checkins: Array<{ submitted_at: string }>
  sessions: SessionRow[]
}
type Programme = { id: string; title: string; created_at: string }
type Task = { id: string; title: string; completed: boolean; created_at: string }
type UpcomingSession = {
  id: string
  session_date: string
  session_time: string | null
  client_id: string
  clients: { full_name: string }
}

type Props = {
  profile: Profile
  clients: ClientRow[]
  programmes: Programme[]
  tasks: Task[]
  upcomingSessions: UpcomingSession[]
  todayStr: string
  hasMessage: boolean
}

const LS_KEY = 'evolya_recent_client_visits'
export type ClientVisit = { clientId: string; clientName: string; href: string; at: string }

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}

function fmtTime(t: string | null) {
  if (!t) return ''
  return t.slice(0, 5).replace(':', 'h')
}

function fmtRelative(iso: string): string {
  const now = new Date()
  const d = new Date(iso)
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'hier'
  if (diffD < 7) return `il y a ${diffD}j`
  return fmtDate(iso)
}

function getDayLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Aujourd'hui"
  const tomorrow = new Date(todayStr)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Demain'
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
  return day.charAt(0).toUpperCase() + day.slice(1)
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

// Renvoie le dernier dimanche 23:59:59 déjà passé (clôture de fenêtre check-in)
function getLastWindowClose(now: Date): Date {
  const d = new Date(now)
  const dow = d.getDay() // 0=dim, 1=lun, ..., 6=sam
  const daysSinceSunday = dow === 0 ? 0 : dow
  d.setDate(d.getDate() - daysSinceSunday)
  d.setHours(23, 59, 59, 999)
  // Si ce dimanche 23:59 est dans le futur (on est dim avant 23:59), reculer d'une semaine
  if (d > now) d.setDate(d.getDate() - 7)
  return d
}

function getWeekStart(now: Date): Date {
  const d = new Date(now)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export function DashboardContent({ profile, clients, programmes, tasks: initialTasks, upcomingSessions, todayStr, hasMessage }: Props) {
  const now = new Date()
  const weekStart = getWeekStart(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  const [clientVisits, setClientVisits] = useState<ClientVisit[]>([])
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [sendingRelance, setSendingRelance] = useState<string | null>(null)
  const [relancedAt, setRelancedAt] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setClientVisits(JSON.parse(raw))
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem('evolya_relance_ts')
      if (raw) setRelancedAt(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (showAddTask) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showAddTask])

  const activeClients = useMemo(() => clients.filter(c => c.status === 'active'), [clients])

  const inactiveAlerts = useMemo(() => {
    const threshold = profile.inactivity_threshold_days ?? 7
    // Le compteur démarre à la clôture de la dernière fenêtre (dimanche 23:59)
    const lastWindowClose = getLastWindowClose(now)
    const daysSinceWindowClose = (now.getTime() - lastWindowClose.getTime()) / 86400000

    // Pas encore assez de jours écoulés depuis la fermeture → aucune alerte
    if (daysSinceWindowClose <= threshold) return []

    return activeClients
      .filter(c => {
        // Jamais soumis → toujours en alerte
        if (c.checkins.length === 0) return true
        const last = new Date(Math.max(...c.checkins.map(ch => new Date(ch.submitted_at).getTime())))
        // En alerte si le dernier check-in est antérieur à la clôture de fenêtre
        return last < lastWindowClose
      })
      .map(c => {
        const neverCheckedIn = c.checkins.length === 0
        const last = neverCheckedIn
          ? null
          : new Date(Math.max(...c.checkins.map(ch => new Date(ch.submitted_at).getTime())))
        const daysAgo = last ? Math.floor((now.getTime() - last.getTime()) / 86400000) : null
        const relancedAtStr = relancedAt[c.id] ?? null
        const relancedDaysAgo = relancedAtStr
          ? Math.floor((now.getTime() - new Date(relancedAtStr).getTime()) / 86400000)
          : null
        return { ...c, neverCheckedIn, last, daysAgo, relancedDaysAgo }
      })
      // Caché pendant les 3 premiers jours après relance
      .filter(c => c.relancedDaysAgo === null || c.relancedDaysAgo >= 3)
  }, [activeClients, now, profile.inactivity_threshold_days, relancedAt])

  const weeklyCheckins = useMemo(() =>
    activeClients.reduce((count, c) =>
      count + c.checkins.filter(ch => ch.submitted_at >= weekStart.toISOString()).length, 0),
  [activeClients, weekStart])

  const weekSessionCount = useMemo(() => {
    let n = 0
    for (const c of activeClients)
      for (const s of c.sessions)
        if (s.session_date >= weekStartStr && s.session_date <= weekEndStr) n++
    return n
  }, [activeClients, weekStartStr, weekEndStr])

  const recentActions = useMemo(() => {
    type Action = { label: string; sub: string; href: string; at: string; icon: 'session' | 'programme' | 'client' }
    const items: Action[] = []

    for (const c of clients) {
      for (const s of c.sessions) {
        if (!s.created_at) continue
        const daysAgo = (now.getTime() - new Date(s.created_at).getTime()) / 86400000
        if (daysAgo > 30) continue
        const dateLabel = s.session_date === todayStr ? "aujourd'hui" : fmtDate(s.session_date)
        const timeLabel = fmtTime(s.session_time)
        items.push({
          label: `Séance planifiée avec ${c.full_name}`,
          sub: timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel,
          href: '/seance',
          at: s.created_at,
          icon: 'session',
        })
      }
    }

    for (const p of programmes) {
      items.push({ label: `Programme créé : ${p.title}`, sub: fmtDate(p.created_at), href: '/programmes', at: p.created_at, icon: 'programme' })
    }

    for (const v of clientVisits) {
      items.push({ label: `Profil consulté : ${v.clientName}`, sub: fmtRelative(v.at), href: v.href, at: v.at, icon: 'client' })
    }

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6)
  }, [clients, programmes, clientVisits, todayStr, now])

  async function toggleTask(task: Task) {
    const optimistic = tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
    setTasks(optimistic)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  async function sendRelance(client: ClientRow) {
    setSendingRelance(client.id)
    const firstName = client.full_name.split(' ')[0]
    const content = `Salut ${firstName} ! Je voulais prendre de tes nouvelles — ça fait quelques jours que je n'ai pas reçu de check-in de ta part. Tout va bien ? N'hésite pas à me dire si tu as besoin de quelque chose. 💪`
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, content }),
    })
    const ts = new Date().toISOString()
    const updated = { ...relancedAt, [client.id]: ts }
    setRelancedAt(updated)
    try { localStorage.setItem('evolya_relance_ts', JSON.stringify(updated)) } catch { /* ignore */ }
    setSendingRelance(null)
    toast.success(`Message envoyé à ${client.full_name}`)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim()) return
    setAddingTask(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask.trim() }),
    })
    const data = await res.json()
    setAddingTask(false)
    if (data.task) {
      setTasks(prev => [...prev, data.task])
      setNewTask('')
      setShowAddTask(false)
    }
  }

  const firstName = (profile.full_name ?? 'Coach').split(' ')[0]
  const todayFr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const completedTasks = tasks.filter(t => t.completed).length

  const cardStyle = { backgroundColor: 'var(--evolya-card)', border: '1px solid var(--evolya-border)' }
  const mutedStyle = { color: 'var(--evolya-muted)' }
  const subtleStyle = { color: 'var(--evolya-subtle)' }
  const textStyle = { color: 'var(--evolya-text)' }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-7xl w-full mx-auto overflow-y-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em]" style={textStyle}>
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-[13px] mt-1 capitalize" style={subtleStyle}>{todayFr}</p>
        </div>
        <Link
          href="/clients?invite=1"
          className="shrink-0 inline-flex items-center gap-2 text-[13px] font-bold text-white px-4 py-2.5 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--brand)', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
        >
          <Plus size={15} />
          Inviter un client
        </Link>
      </div>

      {/* Checklist d'onboarding coach */}
      <OnboardingChecklist
        coachId={profile.id}
        hasBranding={!!(profile.brand_color_primary || profile.brand_color_accent || profile.brand_icon)}
        hasClients={clients.length > 0}
        hasProgrammes={programmes.length > 0}
        hasMessage={hasMessage}
      />

      {/* Alerte inactivité */}
      <PlanGate featureKey="relance_inactifs" userPlan={profile.plan ?? 'free'}>
      {inactiveAlerts.length > 0 && (
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--evolya-card)', border: '1px solid var(--evolya-border)' }}>
          <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: 'var(--evolya-border)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F59E0B' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2v3M5 7.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[13px] font-semibold" style={textStyle}>
              {inactiveAlerts.length} membre{inactiveAlerts.length > 1 ? 's' : ''} inactif{inactiveAlerts.length > 1 ? 's' : ''}
            </p>
            <span className="text-[11px]" style={subtleStyle}>
              — aucun check-in depuis {profile.inactivity_threshold_days ?? 7}+ jours
            </span>
          </div>
          <div>
            {inactiveAlerts.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: '1px solid var(--evolya-border)' }}>
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: 'var(--evolya-bg)', color: 'var(--evolya-muted)' }}
                >
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={textStyle}>{c.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.relancedDaysAgo !== null && c.relancedDaysAgo >= 7 ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                        <p className="text-[11px] text-[#DC2626]">
                          Relancé il y a {c.relancedDaysAgo}j — toujours sans réponse
                        </p>
                      </>
                    ) : c.relancedDaysAgo !== null && c.relancedDaysAgo >= 3 ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                        <p className="text-[11px] text-[#F59E0B]">
                          Relancé il y a {c.relancedDaysAgo}j — pas encore de check-in
                        </p>
                      </>
                    ) : c.neverCheckedIn ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#94A3B8] shrink-0" />
                        <p className="text-[11px]" style={subtleStyle}>
                          Jamais check-in — <span className="text-[#94A3B8]">pas encore onboardé</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                        <p className="text-[11px]" style={subtleStyle}>
                          Décrochage — <span className="text-[#F59E0B]">dernier check-in il y a {c.daysAgo}j</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => sendRelance(c)}
                  disabled={sendingRelance === c.id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-bg, rgba(78,155,111,0.1))', color: 'var(--brand)' }}
                >
                  {sendingRelance === c.id ? (
                    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 5.5h8M6.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  Relancer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      </PlanGate>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { icon: <Users size={12} />, label: 'Clients actifs', value: activeClients.length, sub: `sur ${profile.client_limit} max`, href: '/clients' },
          { icon: <Calendar size={12} />, label: 'Séances cette semaine', value: weekSessionCount, sub: 'lun. → dim.', href: '/seance' },
          { icon: <CheckSquare size={12} />, label: 'Check-ins semaine', value: weeklyCheckins, sub: 'reset lundi' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-3 sm:p-4 hover:opacity-90 transition-opacity" style={cardStyle}>
            {s.href ? (
              <Link href={s.href} className="block h-full">
                <StatInner {...s} />
              </Link>
            ) : <StatInner {...s} />}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">

        {/* Agenda à venir */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold" style={textStyle}>Agenda à venir</h2>
              <p className="text-[11px] mt-0.5" style={subtleStyle}>— 7 prochains jours</p>
            </div>
            <Link href="/seance" className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: 'var(--brand)' }}>
              Planning <ArrowRight size={11} />
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[22px]" style={{ backgroundColor: 'var(--evolya-bg)' }}>
                📅
              </div>
              <p className="text-[13px] font-medium" style={mutedStyle}>Aucune séance prévue</p>
              <Link href="/seance" className="text-[12px] font-semibold mt-2 inline-block" style={{ color: 'var(--brand)' }}>
                Planifier →
              </Link>
            </div>
          ) : (
            <div className="space-y-0">
              {upcomingSessions.map((s, i) => (
                <Link key={i} href="/seance"
                  className="flex items-center gap-3 py-2.5 -mx-1 px-1 rounded-lg transition-colors group"
                  style={{ borderBottom: i < upcomingSessions.length - 1 ? '1px solid var(--evolya-border)' : undefined }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.session_date === todayStr ? 'var(--brand)' : 'var(--evolya-border)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={textStyle}>{s.clients.full_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-medium" style={{ color: s.session_date === todayStr ? 'var(--brand)' : 'var(--evolya-subtle)' }}>
                      {getDayLabel(s.session_date, todayStr)}
                    </p>
                    {s.session_time && (
                      <p className="text-[10px]" style={subtleStyle}>{fmtTime(s.session_time)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Dernières actions */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold flex items-center gap-1.5" style={textStyle}>
              <span style={{ color: 'var(--brand)' }}>⚡</span> Dernières actions
            </h2>
            <Link href="/clients" className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: 'var(--brand)' }}>
              Tout voir <ArrowRight size={11} />
            </Link>
          </div>

          {recentActions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[13px]" style={mutedStyle}>Aucune action récente</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActions.map((a, i) => (
                <Link key={i} href={a.href}
                  className="flex items-start gap-3 py-2.5 -mx-1 px-1 rounded-lg transition-colors group"
                  style={{ borderBottom: i < recentActions.length - 1 ? '1px solid var(--evolya-border)' : undefined }}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-[11px]"
                    style={{ backgroundColor: 'var(--evolya-bg)' }}>
                    {a.icon === 'session' ? '📅' : a.icon === 'programme' ? '📋' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={textStyle}>{a.label}</p>
                    <p className="text-[11px]" style={subtleStyle}>{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* À faire */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold flex items-center gap-2" style={textStyle}>
            <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: 'var(--brand)' }}>
              <Check size={11} strokeWidth={3} />
            </span>
            À faire
            {tasks.length > 0 && (
              <span className="text-[12px] font-normal" style={subtleStyle}>— {completedTasks}/{tasks.length}</span>
            )}
          </h2>
          <button
            onClick={() => setShowAddTask(v => !v)}
            className="text-[12px] font-semibold flex items-center gap-1 transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {/* Add form */}
        {showAddTask && (
          <form onSubmit={addTask} className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Nouvelle tâche…"
              className="flex-1 px-3 py-2 rounded-xl text-[13px] focus:outline-none"
              style={{ backgroundColor: 'var(--evolya-bg)', border: '1px solid var(--evolya-border)', color: 'var(--evolya-text)' }}
            />
            <button
              type="submit"
              disabled={addingTask || !newTask.trim()}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {addingTask ? '…' : 'OK'}
            </button>
          </form>
        )}

        {tasks.length === 0 && !showAddTask ? (
          <div className="text-center py-6">
            <p className="text-[13px]" style={mutedStyle}>Aucune tâche — commence par en ajouter une.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 group px-1 py-1.5 rounded-lg">
                <button
                  onClick={() => toggleTask(task)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={task.completed
                    ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }
                    : { borderColor: 'var(--evolya-border)', backgroundColor: 'transparent' }
                  }
                >
                  {task.completed && <Check size={10} strokeWidth={3} color="white" />}
                </button>
                <span
                  className="flex-1 text-[13px] leading-snug transition-colors"
                  style={{ color: task.completed ? 'var(--evolya-subtle)' : 'var(--evolya-text)', textDecoration: task.completed ? 'line-through' : 'none' }}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                  style={{ color: 'var(--evolya-subtle)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatInner({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <>
      <div className="flex items-center gap-1 mb-1.5" style={{ color: 'var(--evolya-subtle)' }}>
        <span className="shrink-0">{icon}</span>
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide leading-tight truncate">{label}</p>
      </div>
      <p className="text-[22px] sm:text-[28px] font-bold leading-none" style={{ color: 'var(--evolya-text)' }}>{value}</p>
      <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: 'var(--evolya-subtle)' }}>{sub}</p>
    </>
  )
}
