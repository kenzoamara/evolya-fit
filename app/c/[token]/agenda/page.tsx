'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type CoachSession = {
  id: string
  session_date: string
  session_time: string | null
  notes: string | null
  attendance: 'attended' | 'missed' | null
}

type WorkoutLog = {
  id: string
  log_date: string
  notes: string | null
  programme_days: { title: string | null; day_number: number } | null
}

type DayEvent =
  | { kind: 'session'; data: CoachSession }
  | { kind: 'workout'; data: WorkoutLog }

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_FR = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']
const DAYS_FR_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MONTHS_FR_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

const COLOR = 'var(--brand)'
const COLOR_BG = 'var(--brand-bg)'
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6)

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

function workoutLabel(w: WorkoutLog): string {
  if (w.notes) return w.notes
  const pd = w.programme_days
  if (pd?.title) return pd.title
  if (pd?.day_number) return `Jour ${pd.day_number}`
  return 'Séance sport'
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr)
  return `${DAYS_FR_FULL[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`
}

function daysFromNow(dateStr: string, todayStr: string): number {
  const a = new Date(dateStr).setHours(0,0,0,0)
  const b = new Date(todayStr).setHours(0,0,0,0)
  return Math.round((a - b) / 86400000)
}

// ─── Day Dots (Hevy-style) ───────────────────────────────────────────────────

function DayDots({ events }: { events: DayEvent[] }) {
  if (events.length === 0) return null
  const hasSession = events.some(e => e.kind === 'session')
  const hasAttended = events.some(e => e.kind === 'session' && (e.data as CoachSession).attendance === 'attended')
  const hasMissed = events.some(e => e.kind === 'session' && (e.data as CoachSession).attendance === 'missed')
  const hasWorkout = events.some(e => e.kind === 'workout')

  return (
    <div className="flex items-center justify-center gap-0.5 mt-0.5">
      {hasWorkout && (
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
      )}
      {hasSession && !hasAttended && !hasMissed && (
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR }} />
      )}
      {hasAttended && (
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#16A34A' }} />
      )}
      {hasMissed && (
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />
      )}
    </div>
  )
}

// ─── Event Card (week view) ───────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: DayEvent; onClick: () => void }) {
  if (event.kind === 'session') {
    const s = event.data
    const isAttended = s.attendance === 'attended'
    const isMissed = s.attendance === 'missed'
    const color = isAttended ? '#16A34A' : isMissed ? '#EF4444' : COLOR
    const bg = isAttended ? '#F0FDF4' : isMissed ? '#FEF2F2' : COLOR_BG
    const border = isAttended ? '#BBF7D0' : isMissed ? '#FECACA' : '#BFDBFE'
    const icon = isAttended ? '✓' : isMissed ? '✗' : '🤝'
    const label = isAttended ? 'Présent(e)' : isMissed ? 'Absent(e)' : 'Séance planifiée'
    return (
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all hover:opacity-80" style={{ background: bg, borderColor: border }}>
          <span className="text-[14px] w-5 text-center">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color }}>Avec le coach</p>
            <p className="text-[11px]" style={{ color: `${color}99` }}>
              {s.session_time ? s.session_time.slice(0, 5) + ' · ' : ''}{label}
            </p>
          </div>
        </div>
      </button>
    )
  }
  const w = event.data
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#FDBA74] bg-[#FFF7ED] transition-all hover:opacity-80">
        <span className="text-[14px] w-5 text-center">💪</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[#C2410C] truncate">{workoutLabel(w)}</p>
          <p className="text-[11px] text-[#FB923C]">Complétée</p>
        </div>
      </div>
    </button>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function EventModal({ event, onClose }: { event: DayEvent; onClose: () => void }) {
  if (event.kind === 'session') {
    const s = event.data
    const attColor = s.attendance === 'attended' ? '#16A34A' : s.attendance === 'missed' ? '#EF4444' : '#64748B'
    const attLabel = s.attendance === 'attended' ? 'Présent(e)' : s.attendance === 'missed' ? 'Absent(e)' : 'En attente'
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: COLOR_BG }}>🤝</div>
              <div>
                <p className="text-[15px] font-bold text-[#0D1F3C]">Séance avec le coach</p>
                <p className="text-[12px] text-[#94A3B8]">{formatDateFR(s.session_date)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B] text-lg leading-none">✕</button>
          </div>
          <div className="space-y-3">
            {s.session_time && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#64748B] w-16">Heure</span>
                <span className="text-[13px] font-semibold text-[#0D1F3C]">{s.session_time.slice(0, 5)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#64748B] w-16">Statut</span>
              <span className="text-[13px] font-semibold" style={{ color: attColor }}>{attLabel}</span>
            </div>
            {s.notes && (
              <div>
                <p className="text-[12px] font-medium text-[#64748B] mb-1">Notes</p>
                <p className="text-[13px] text-[#374151] bg-[#F8FAFB] rounded-xl p-3">{s.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  const w = event.data
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FFF7ED' }}>💪</div>
            <div>
              <p className="text-[15px] font-bold text-[#0D1F3C]">{workoutLabel(w)}</p>
              <p className="text-[12px] text-[#94A3B8]">{formatDateFR(w.log_date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B] text-lg leading-none">✕</button>
        </div>
        <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">
          <span className="text-green-600 font-bold text-[13px]">✓ Séance complétée</span>
        </div>
      </div>
    </div>
  )
}

// ─── Next Session Banner ──────────────────────────────────────────────────────

function NextSessionBanner({ sessions, todayStr, onClick }: {
  sessions: CoachSession[]
  todayStr: string
  onClick: (s: DayEvent) => void
}) {
  const next = sessions
    .filter(s => s.session_date >= todayStr && s.attendance !== 'missed')
    .sort((a, b) => a.session_date.localeCompare(b.session_date))[0]

  if (!next) return null

  const diff = daysFromNow(next.session_date, todayStr)
  const diffLabel = diff === 0 ? "Aujourd'hui !" : diff === 1 ? 'Demain' : `Dans ${diff} jours`
  const isUrgent = diff <= 1

  return (
    <button
      onClick={() => onClick({ kind: 'session', data: next })}
      className="w-full text-left mb-5"
    >
      <div
        className="flex items-center gap-3 rounded-2xl p-4 border transition-all hover:opacity-90"
        style={{
          background: isUrgent ? COLOR_BG : '#F8FAFF',
          borderColor: isUrgent ? '#93C5FD' : '#DBEAFE',
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: COLOR }}>
          <Calendar size={18} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Prochaine séance coach</p>
          <p className="text-[14px] font-bold text-[#0D1F3C] mt-0.5">
            {formatDateFR(next.session_date)}
            {next.session_time ? ` · ${next.session_time.slice(0, 5)}` : ''}
          </p>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0"
          style={{ background: isUrgent ? COLOR : '#DBEAFE', color: isUrgent ? '#fff' : COLOR }}
        >
          {diffLabel}
        </span>
      </div>
    </button>
  )
}

// ─── Month View (Hevy-style dots) ─────────────────────────────────────────────

function MonthView({
  year, month, eventsMap, todayStr, onDayClick,
}: {
  year: number; month: number
  eventsMap: Map<string, DayEvent[]>
  todayStr: string
  onDayClick: (dateStr: string, events: DayEvent[]) => void
}) {
  const days = getMonthDays(year, month)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
        {DAYS_FR.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLOR }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateStr = toDateStr(day)
          const isCurrentMonth = day.getMonth() === month
          const isToday = dateStr === todayStr
          const isPast = dateStr < todayStr
          const dayEvents = eventsMap.get(dateStr) ?? []
          const hasEvents = dayEvents.length > 0

          return (
            <button
              key={i}
              onClick={() => hasEvents ? onDayClick(dateStr, dayEvents) : undefined}
              className={`min-h-[52px] sm:min-h-[60px] p-1 border-b border-r border-[#F1F5F9] flex flex-col items-center pt-1.5 transition-colors ${
                hasEvents ? 'hover:bg-[#F8FAFB] cursor-pointer' : 'cursor-default'
              } ${!isCurrentMonth ? 'bg-[#FAFBFC]' : ''}`}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium ${
                isToday ? 'text-white'
                : isCurrentMonth ? isPast ? 'text-[#CBD5E1]' : 'text-[#0D1F3C]'
                : 'text-[#E2E8F0]'
              }`} style={isToday ? { backgroundColor: COLOR } : {}}>
                {day.getDate()}
              </span>
              <DayDots events={isCurrentMonth ? dayEvents : []} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day Events Panel (shown below month when a day is clicked) ───────────────

function DayPanel({ date, events, onEventClick, onClose }: {
  date: string
  events: DayEvent[]
  onEventClick: (e: DayEvent) => void
  onClose: () => void
}) {
  return (
    <div className="mt-3 bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-bold text-[#0D1F3C]">{formatDateFR(date)}</p>
        <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B] text-sm">✕</button>
      </div>
      <div className="space-y-2">
        {events.map((ev, i) => (
          <EventCard key={i} event={ev} onClick={() => { onEventClick(ev); onClose() }} />
        ))}
      </div>
    </div>
  )
}

// ─── Week View (grid/planning style like coach agenda) ────────────────────────

function WeekView({
  monday, eventsMap, todayStr, onEventClick,
}: {
  monday: Date
  eventsMap: Map<string, DayEvent[]>
  todayStr: string
  onEventClick: (e: DayEvent) => void
}) {
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return d
  })

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white min-w-[560px] rounded-2xl overflow-hidden">

        {/* Day header row */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[#E2E8F0]">
          <div className="py-2.5" />
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day)
            const isToday = dateStr === todayStr
            return (
              <div key={i} className="py-2.5 text-center border-l border-[#F1F5F9]">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-[var(--brand)]' : 'text-[#94A3B8]'}`}>
                  {DAYS_FR_FULL[i].slice(0, 3)}
                </p>
                <div className={`text-[14px] font-bold mt-0.5 mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'text-white' : 'text-[#0D1F3C]'
                }`} style={isToday ? { background: 'var(--brand)' } : {}}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* All-day row — workouts (no specific time) */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[#E2E8F0]">
          <div className="flex items-center justify-end pr-2 py-1 border-r border-[#F1F5F9]">
            <span className="text-[9px] text-[#94A3B8] font-medium leading-tight text-right">tout<br/>jour</span>
          </div>
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day)
            const dayWorkouts = (eventsMap.get(dateStr) ?? []).filter(e => e.kind === 'workout')
            return (
              <div key={i} className="border-l border-[#F8FAFB] p-0.5 min-h-[28px]">
                {dayWorkouts.map((ev, j) => (
                  <button key={j} onClick={() => onEventClick(ev)}
                    className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-lg mb-0.5 truncate bg-[#FFF7ED] text-[#C2410C] hover:opacity-80 transition-opacity">
                    💪 {workoutLabel(ev.data as WorkoutLog)}
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        {/* Hourly grid */}
        <div className="max-h-[480px] overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] min-h-[44px]">
              <div className="flex items-start justify-end pr-2 pt-1 text-[10px] text-[#94A3B8] font-medium border-r border-[#F1F5F9]">
                {hour}h
              </div>
              {weekDays.map((day, i) => {
                const dateStr = toDateStr(day)
                const daySessions = (eventsMap.get(dateStr) ?? []).filter(e => {
                  if (e.kind !== 'session') return false
                  const s = e.data as CoachSession
                  if (!s.session_time) return hour === 9
                  return parseInt(s.session_time.split(':')[0]) === hour
                })
                return (
                  <div key={i} className="border-l border-b border-[#F8FAFB] p-0.5">
                    {daySessions.map((ev, j) => {
                      const s = ev.data as CoachSession
                      const isAttended = s.attendance === 'attended'
                      const isMissed = s.attendance === 'missed'
                      const bg = isAttended ? '#F0FDF4' : isMissed ? '#FEF2F2' : COLOR_BG
                      const textColor = isAttended ? '#166534' : isMissed ? '#991B1B' : '#1D4ED8'
                      const prefix = isAttended ? '✓ ' : isMissed ? '✗ ' : '🤝 '
                      return (
                        <button key={j} onClick={() => onEventClick(ev)}
                          className="w-full text-left text-[10px] font-semibold px-1.5 py-1 rounded-lg mb-0.5 truncate hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: bg, color: textColor }}>
                          {prefix}{s.session_time ? s.session_time.slice(0, 5) + ' ' : ''}Coach
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const params = useParams()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<CoachSession[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [view, setView] = useState<'month' | 'week'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<DayEvent | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<DayEvent[]>([])

  const todayStr = toDateStr(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monday = getMondayOfWeek(currentDate)

  useEffect(() => {
    fetch(`/api/client/agenda?token=${token}`)
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions ?? [])
        setWorkouts(data.workouts ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const eventsMap = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    for (const s of sessions) {
      const arr = map.get(s.session_date) ?? []
      arr.push({ kind: 'session', data: s })
      map.set(s.session_date, arr)
    }
    for (const w of workouts) {
      const arr = map.get(w.log_date) ?? []
      arr.push({ kind: 'workout', data: w })
      map.set(w.log_date, arr)
    }
    return map
  }, [sessions, workouts])

  function prevPeriod() {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
    setSelectedDayDate(null)
  }

  function nextPeriod() {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
    setSelectedDayDate(null)
  }

  function goToToday() {
    setCurrentDate(new Date())
    setSelectedDayDate(null)
  }

  function handleDayClick(dateStr: string, events: DayEvent[]) {
    if (selectedDayDate === dateStr) { setSelectedDayDate(null); return }
    setSelectedDayDate(dateStr)
    setSelectedDayEvents(events)
  }

  const periodLabel = view === 'month'
    ? `${MONTHS_FR[month]} ${year}`
    : (() => {
        const end = new Date(monday); end.setDate(end.getDate() + 6)
        if (monday.getMonth() === end.getMonth())
          return `${monday.getDate()} – ${end.getDate()} ${MONTHS_FR[end.getMonth()]}`
        return `${monday.getDate()} ${MONTHS_FR_SHORT[monday.getMonth()]} – ${end.getDate()} ${MONTHS_FR_SHORT[end.getMonth()]}`
      })()

  const isCurrentPeriod = view === 'month'
    ? (year === new Date().getFullYear() && month === new Date().getMonth())
    : toDateStr(monday) === toDateStr(getMondayOfWeek(new Date()))

  // Monthly stats (follow viewed month)
  const monthWorkouts = workouts.filter(w => {
    const d = new Date(w.log_date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const monthSessions = sessions.filter(s => {
    const d = new Date(s.session_date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const attendedCount = monthSessions.filter(s => s.attendance === 'attended').length

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${COLOR} transparent transparent transparent` }} />
    </div>
  )

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: COLOR_BG }}>📅</div>
        <h1 className="text-[20px] font-bold text-[#0D1F3C]">Agenda</h1>
      </div>

      {/* Next session banner */}
      <NextSessionBanner sessions={sessions} todayStr={todayStr} onClick={setSelectedEvent} />

      {/* View tabs */}
      <div className="flex gap-1 p-1 bg-[#F8FAFB] rounded-xl mb-4">
        {(['week', 'month'] as const).map(v => (
          <button
            key={v}
            onClick={() => { setView(v); setSelectedDayDate(null) }}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={view === v ? { background: COLOR, color: '#fff' } : { color: '#64748B' }}
          >
            {v === 'week' ? 'Semaine' : 'Mois'}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-bold text-[#0D1F3C]">{periodLabel}</p>
          {!isCurrentPeriod && (
            <button onClick={goToToday} className="text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{ color: COLOR, background: COLOR_BG }}>
              Aujourd'hui
            </button>
          )}
        </div>
        <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar views */}
      {view === 'month' ? (
        <>
          <MonthView
            year={year} month={month}
            eventsMap={eventsMap}
            todayStr={todayStr}
            onDayClick={handleDayClick}
          />
          {/* Day panel below month */}
          {selectedDayDate && selectedDayEvents.length > 0 && (
            <DayPanel
              date={selectedDayDate}
              events={selectedDayEvents}
              onEventClick={setSelectedEvent}
              onClose={() => setSelectedDayDate(null)}
            />
          )}

          {/* Stats strip — month context */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 text-center">
              <p className="text-[20px] font-bold" style={{ color: COLOR }}>{monthWorkouts.length}</p>
              <p className="text-[10px] font-medium text-[#94A3B8] mt-0.5">Séances</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 text-center">
              <p className="text-[20px] font-bold text-[#16A34A]">{attendedCount}</p>
              <p className="text-[10px] font-medium text-[#94A3B8] mt-0.5">Avec coach</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 text-center">
              <p className="text-[20px] font-bold text-[var(--brand)]">
                {monthWorkouts.length + attendedCount > 0
                  ? Math.round((monthWorkouts.length / Math.max(1, new Date().getDate())) * 7)
                  : 0}
              </p>
              <p className="text-[10px] font-medium text-[#94A3B8] mt-0.5">/ semaine</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)' }} />
              <span className="text-[11px] text-[#94A3B8]">Séance sport</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: COLOR }} />
              <span className="text-[11px] text-[#94A3B8]">Coach prévu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] text-[#94A3B8]">Coach présent</span>
            </div>
          </div>
        </>
      ) : (
        <WeekView
          monday={monday}
          eventsMap={eventsMap}
          todayStr={todayStr}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}
