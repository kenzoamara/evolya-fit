'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile, Session } from '@/types/database'
import { DisponibilitesContent } from '@/app/(coach)/disponibilites/disponibilites-content'

type ClientWithSessions = {
  id: string
  full_name: string
  status: string
  sessions: Session[]
}

type CoachEvent = {
  id: string
  title: string
  event_date: string
  start_time: string | null
  end_time: string | null
}

type Props = {
  profile: Profile
  clients: ClientWithSessions[]
  events: CoachEvent[]
}

type ViewMode = 'month' | 'week' | 'disponibilites'

const DAYS_FR = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']
const DAYS_FR_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6h to 22h

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const firstDay = first.getDay()
  const startOffset = firstDay === 0 ? -6 : 1 - firstDay
  const start = new Date(year, month, 1 + startOffset)

  const days: Date[] = []
  const cursor = new Date(start)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const DURATIONS = [
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '1 h',    value: '60' },
  { label: '1 h 30', value: '90' },
  { label: '2 h',    value: '120' },
]

/* ── Add Session Modal ── */
function AddSessionModal({ clients, onClose, onAdd, initialDate }: {
  clients: ClientWithSessions[]
  onClose: () => void
  onAdd: (params: { clientId: string; date: string; time: string; duration: string; comment: string }) => void
  initialDate?: string
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [date, setDate]         = useState(initialDate ?? toDateStr(new Date()))
  const [time, setTime]         = useState('09:00')
  const [duration, setDuration] = useState('60')
  const [comment, setComment]   = useState('')

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border border-[#E2E8F0] w-full sm:max-w-sm shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F1F5F9]">
          <h3 className="text-[15px] font-semibold text-[#0D1F3C]">Nouvelle séance</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8] transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Athlete */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Athlète</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] focus:outline-none focus:border-[var(--brand)] transition-colors appearance-none"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] focus:outline-none focus:border-[var(--brand)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Début</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] focus:outline-none focus:border-[var(--brand)] transition-colors"
              />
            </div>
          </div>

          {/* Duree */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Durée</label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    duration === d.value ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                  style={duration === d.value ? { backgroundColor: 'var(--brand)' } : {}}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Commentaire <span className="normal-case font-normal tracking-normal">(facultatif)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Notes sur cette séance..."
              className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder-[#CBD5E1] focus:outline-none focus:border-[var(--brand)] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFB] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onAdd({ clientId, date, time, duration, comment })}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Month View ── */
function MonthView({ year, month, sessions, todayStr, onPickDay }: {
  year: number
  month: number
  sessions: Map<string, { clientName: string; time: string | null }[]>
  todayStr: string
  onPickDay: (dateStr: string) => void
}) {
  const days = getMonthDays(year, month)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
        {DAYS_FR.map(d => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-[var(--brand)] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateStr = toDateStr(day)
          const isCurrentMonth = day.getMonth() === month
          const isToday = dateStr === todayStr
          const daySessions = sessions.get(dateStr) ?? []

          return (
            <div
              key={i}
              onClick={() => onPickDay(dateStr)}
              className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r border-[#F1F5F9] cursor-pointer hover:bg-[#F8FAFB] transition-colors ${
                !isCurrentMonth ? 'bg-[#FAFBFC]' : ''
              }`}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium ${
                isToday
                  ? 'bg-[var(--brand)] text-white'
                  : isCurrentMonth
                  ? 'text-[#0D1F3C]'
                  : 'text-[#CBD5E1]'
              }`}>
                {day.getDate()}
              </span>

              <div className="mt-1 space-y-0.5">
                {daySessions.slice(0, 2).map((s, j) => (
                  <div key={j} className="bg-[var(--brand-bg)] text-[var(--brand)] text-[10px] font-medium px-1.5 py-0.5 rounded truncate">
                    {s.time ? s.time.replace(':', 'h').slice(0, 5) + ' ' : ''}{(s.clientName ?? '').split(' ')[0]}
                  </div>
                ))}
                {daySessions.length > 2 && (
                  <p className="text-[10px] text-[#94A3B8] pl-1">+{daySessions.length - 2}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Week View ── */
const ROW_H = 48   // px per hour slot
const START_H = 6  // first hour in HOURS array

function WeekView({ monday, sessions, todayStr, onPickDay }: {
  monday: Date
  sessions: Map<string, { clientName: string; time: string | null; duration: number }[]>
  todayStr: string
  onPickDay: (dateStr: string) => void
}) {
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const totalH = HOURS.length * ROW_H // 17 * 48 = 816px

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#E2E8F0]">
        <div className="py-2.5" />
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day)
          const isToday = dateStr === todayStr
          return (
            <div key={i} className="py-2.5 text-center border-l border-[#F1F5F9]">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-[var(--brand)]' : 'text-[#94A3B8]'}`}>
                {DAYS_FR_FULL[i].slice(0, 3)}
              </p>
              <p className={`text-[14px] font-bold mt-0.5 ${
                isToday ? 'text-white bg-[var(--brand)] w-7 h-7 rounded-full flex items-center justify-center mx-auto' : 'text-[#0D1F3C]'
              }`}>
                {day.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Time grid — absolute positioning for duration-accurate blocks */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">

          {/* Hour labels */}
          <div className="border-r border-[#F1F5F9]">
            {HOURS.map(hour => (
              <div key={hour} style={{ height: ROW_H }} className="flex items-start justify-end pr-2 pt-1 text-[11px] text-[#94A3B8] font-medium">
                {hour}h
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day)
            const daySessions = sessions.get(dateStr) ?? []

            return (
              <div key={i} onClick={() => onPickDay(dateStr)} className="border-l border-[#F1F5F9] relative cursor-pointer hover:bg-[#FAFBFC] transition-colors" style={{ height: totalH }}>
                {/* Horizontal hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-b border-[#F8FAFB]"
                    style={{ top: (hour - START_H) * ROW_H, height: ROW_H }}
                  />
                ))}

                {/* Session blocks — height proportional to duration */}
                {daySessions.map((s, j) => {
                  let sH = 9, sM = 0
                  if (s.time) {
                    const p = s.time.split(':').map(Number)
                    sH = p[0]; sM = p[1] ?? 0
                  }
                  const top    = (sH - START_H) * ROW_H + (sM / 60) * ROW_H
                  const height = Math.max((s.duration / 60) * ROW_H, 22)

                  return (
                    <div
                      key={j}
                      className="absolute left-0.5 right-0.5 bg-[var(--brand)] text-white text-[10px] font-medium px-1.5 py-1 rounded-lg overflow-hidden"
                      style={{ top, height }}
                    >
                      {s.time && (
                        <span className="opacity-80 block leading-tight">
                          {s.time.slice(0, 5).replace(':', 'h')}
                        </span>
                      )}
                      <span className="truncate block leading-tight">
                        {(s.clientName ?? '').split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}

/* ── Google Calendar Integration Panel ── */
function GoogleCalendarPanel({ isConnected: initialConnected, onEventsLoaded }: {
  isConnected: boolean
  onEventsLoaded: (events: any[]) => void
}) {
  const [connected, setConnected] = useState(initialConnected)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (connected) {
      fetch('/api/google-calendar/events')
        .then(r => r.json())
        .then(d => { if (d.events) onEventsLoaded(d.events) })
        .catch(() => {})
    }
  }, [connected])

  async function disconnect() {
    setLoading(true)
    await fetch('/api/google-calendar/events', { method: 'DELETE' })
    setConnected(false)
    onEventsLoaded([])
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pb-8">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1F3C]">Google Calendar</p>
              <p className="text-xs text-[#64748B]">
                {connected ? 'Connecté — vos événements Google s\'affichent dans l\'agenda' : 'Importez vos événements Google dans Evolya'}
              </p>
            </div>
          </div>
          {connected ? (
            <button
              onClick={disconnect}
              disabled={loading}
              className="text-xs text-[#EF4444] border border-[#FCA5A5] px-3 py-1.5 rounded-xl hover:bg-[#FEF2F2] transition-colors"
            >
              Déconnecter
            </button>
          ) : (
            <a
              href="/api/auth/google"
              className="flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Connecter
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


/* ── Main Component ── */
export function AgendaContent({ profile, clients, events, initialAvails = [], initialRequests = [], isGoogleConnected = false }: Props & { initialAvails?: any[]; initialRequests?: any[]; isGoogleConnected?: boolean }) {
  const router = useRouter()
  // Vue semaine par défaut sur mobile, mois sur desktop
  const [view, setView] = useState<ViewMode>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'week' : 'month'
  )
  const [currentDate, setCurrentDate] = useState(new Date())
  // null = modale fermée ; sinon = date pré-remplie de la séance à créer
  const [addDate, setAddDate] = useState<string | null>(null)
  const [googleEvents, setGoogleEvents] = useState<any[]>([])

  // Ouvre la création de séance (depuis le bouton ou en tapant un jour du calendrier)
  function openCreate(dateStr: string) {
    if (clients.length === 0) {
      toast.error("Ajoutez d'abord un membre pour planifier une séance.")
      return
    }
    setAddDate(dateStr)
  }

  const todayStr = toDateStr(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const sessionsMap = useMemo(() => {
    const map = new Map<string, { clientName: string; time: string | null; duration: number }[]>()

    for (const client of clients) {
      for (const session of client.sessions ?? []) {
        const key = session.session_date
        const arr = map.get(key) ?? []
        let duration = 60
        if (session.private_notes) {
          const m = session.private_notes.match(/duration:(\d+)/)
          if (m) duration = parseInt(m[1])
        }
        arr.push({ clientName: client.full_name, time: session.session_time, duration })
        map.set(key, arr)
      }
    }

    for (const event of events) {
      const key = event.event_date
      const arr = map.get(key) ?? []
      let duration = 60
      if (event.start_time && event.end_time) {
        const [sh, sm] = event.start_time.split(':').map(Number)
        const [eh, em] = event.end_time.split(':').map(Number)
        duration = (eh * 60 + em) - (sh * 60 + sm)
        if (duration <= 0) duration = 60
      }
      arr.push({ clientName: event.title, time: event.start_time, duration })
      map.set(key, arr)
    }

    return map
  }, [clients, events])

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate)
    if (view === 'month') {
      d.setMonth(d.getMonth() + dir)
    } else {
      d.setDate(d.getDate() + 7 * dir)
    }
    setCurrentDate(d)
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  async function handleAddSession({ clientId, date, time, duration, comment }: {
    clientId: string; date: string; time: string; duration: string; comment: string
  }) {
    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions: [{
            client_id: clientId,
            session_date: date,
            session_time: time || null,
            notes: comment || '',
            private_notes: duration ? `duration:${duration}` : '',
          }],
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Séance ajoutée')
      setAddDate(null)
      router.refresh()
    } catch {
      toast.error('Erreur lors de la création')
    }
  }

  const headerLabel = view === 'month'
    ? `${MONTHS_FR[month]} ${year}`
    : (() => {
        const mon = getMondayOfWeek(currentDate)
        const sun = new Date(mon)
        sun.setDate(sun.getDate() + 6)
        return `${mon.getDate()} ${MONTHS_FR[mon.getMonth()].slice(0, 3)} - ${sun.getDate()} ${MONTHS_FR[sun.getMonth()].slice(0, 3)} ${sun.getFullYear()}`
      })()

  return (
    <div className="flex-1 px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold text-[#0D1F3C] tracking-[-0.02em]">Agenda</h1>

        {view !== 'disponibilites' && (
          <div className="flex items-center gap-2">
            {/* Vue toggle calendrier */}
            <div className="flex bg-[#F1F5F9] rounded-xl p-0.5">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  view === 'month' ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B]'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  view === 'week' ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B]'
                }`}
              >
                Semaine
              </button>
            </div>
            <button
              onClick={() => openCreate(toDateStr(new Date()))}
              className="px-3.5 py-2 bg-[var(--brand)] text-white rounded-xl text-[12px] font-medium hover:opacity-90 transition-colors"
            >
              + Séance
            </button>
          </div>
        )}
      </div>

      {/* Onglets page : Calendrier | Disponibilités */}
      <div className="flex gap-0 border-b border-[#E2E8F0] mb-6">
        <button
          onClick={() => setView(view === 'disponibilites' ? 'month' : view)}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px ${
            view !== 'disponibilites'
              ? 'border-[var(--brand)] text-[#0D1F3C]'
              : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          Calendrier
        </button>
        <button
          onClick={() => setView('disponibilites')}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px ${
            view === 'disponibilites'
              ? 'border-[var(--brand)] text-[#0D1F3C]'
              : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          Disponibilités
        </button>
      </div>

      {/* Date navigation — masquée en mode disponibilités */}
      {view !== 'disponibilites' && <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFB] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <span className="text-[15px] font-semibold text-[#0D1F3C] flex-1 sm:flex-none sm:min-w-[180px] text-center">
          {headerLabel}
        </span>

        <button
          onClick={() => navigate(1)}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFB] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <button
          onClick={goToday}
          className="ml-2 px-3 py-1.5 border border-[var(--brand)] text-[var(--brand)] rounded-lg text-[11px] font-semibold hover:bg-[var(--brand-bg)] transition-colors"
        >
          Aujourd'hui
        </button>
      </div>}

      {/* Calendar / Disponibilités */}
      {view === 'disponibilites' ? (
        <>
          <DisponibilitesContent
            initialAvails={initialAvails}
            initialRequests={initialRequests}
          />
          <GoogleCalendarPanel
            isConnected={isGoogleConnected}
            onEventsLoaded={setGoogleEvents}
          />
        </>
      ) : view === 'month' ? (
        <MonthView year={year} month={month} sessions={sessionsMap} todayStr={todayStr} onPickDay={openCreate} />
      ) : (
        <WeekView monday={getMondayOfWeek(currentDate)} sessions={sessionsMap} todayStr={todayStr} onPickDay={openCreate} />
      )}

      {/* Add modal */}
      {view !== 'disponibilites' && addDate && clients.length > 0 && (
        <AddSessionModal
          clients={clients}
          initialDate={addDate}
          onClose={() => setAddDate(null)}
          onAdd={handleAddSession}
        />
      )}
    </div>
  )
}
