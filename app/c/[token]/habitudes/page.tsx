'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

type Habit = { id: string; name: string; emoji: string; position: number; source?: string }
type HabitLog = { habit_id: string; date: string; completed: boolean }

const COLOR     = 'var(--brand)'
const COLOR_BG  = 'var(--brand-bg)'
const COLOR_LIGHT = '#E9D5FF'
const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const EMOJI_OPTIONS = ['✅', '💧', '🕯️', '📚', '👟', '💤', '🥗', '💊', '🧠', '🎯', '🦶', '🛏️']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getWeekDays() {
  const today = new Date()
  const dow = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return { date: ds, dayLabel: DAYS_FR[i], dayNum: String(d.getDate()) }
  })
}

// Donut SVG — pct 0→1, starts from top
function Donut({ pct, size = 30 }: { pct: number; size?: number }) {
  const r = size * 0.36
  const circ = 2 * Math.PI * r
  const full = pct >= 1
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={full ? COLOR : COLOR_LIGHT} strokeWidth={size * 0.14} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={COLOR} strokeWidth={size * 0.14}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(pct, 1))}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      )}
    </svg>
  )
}

export default function HabitudesPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const coachView    = searchParams.get('coach') === '1'
  const token        = params?.token as string
  const today        = todayStr()
  const weekDays     = getWeekDays()

  const [habits,      setHabits]      = useState<Habit[]>([])
  const [logs,        setLogs]        = useState<HabitLog[]>([])
  const [loading,     setLoading]     = useState(true)
  const [toggling,    setToggling]    = useState<string | null>(null)

  // Add form
  const [showAdd,     setShowAdd]     = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newEmoji,    setNewEmoji]    = useState('✅')
  const [addSaving,   setAddSaving]   = useState(false)

  useEffect(() => {
    fetch(`/api/client/habitudes?token=${token}`)
      .then(r => r.json())
      .then(d => { setHabits(d.habits ?? []); setLogs(d.logs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  function isDone(habitId: string, date: string) {
    return logs.some(l => l.habit_id === habitId && l.date === date && l.completed)
  }

  async function toggleHabit(habitId: string, date: string) {
    if (date > today) return
    const currently = isDone(habitId, date)
    const key = `${habitId}-${date}`
    setToggling(key)
    const res = await fetch('/api/client/habitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, habit_id: habitId, date, completed: !currently }),
    })
    const data = await res.json()
    setToggling(null)
    if (data.error) { toast.error(data.error); return }
    setLogs(prev => {
      const without = prev.filter(l => !(l.habit_id === habitId && l.date === date))
      if (!currently) return [...without, { habit_id: habitId, date, completed: true }]
      return without
    })
  }

  async function addPersonalHabit() {
    if (!newName.trim()) return
    setAddSaving(true)
    const res = await fetch('/api/client/habitudes/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: newName.trim(), emoji: newEmoji }),
    })
    const data = await res.json()
    setAddSaving(false)
    if (data.error) { toast.error(data.error); return }
    setHabits(prev => [...prev, data.habit])
    setNewName(''); setNewEmoji('✅'); setShowAdd(false)
    toast.success('Habitude ajoutée !')
  }

  async function deletePersonalHabit(id: string) {
    await fetch(`/api/client/habitudes/manage?token=${token}&id=${id}`, { method: 'DELETE' })
    setHabits(prev => prev.filter(h => h.id !== id))
    toast.success('Habitude supprimée')
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${COLOR} transparent transparent transparent` }} />
    </div>
  )

  const sorted = [...habits].sort((a, b) => a.position - b.position)

  // Per-day completion stats for donut headers
  const dayStats = weekDays.map(d => {
    const done = habits.filter(h => isDone(h.id, d.date)).length
    return { ...d, done, total: habits.length, pct: habits.length > 0 ? done / habits.length : 0 }
  })

  // Today's progress
  const todayDone = habits.filter(h => isDone(h.id, today)).length
  const todayPct  = habits.length > 0 ? Math.round(todayDone / habits.length * 100) : 0

  // Weekly total
  const weekDone  = dayStats.reduce((s, d) => s + d.done, 0)
  const weekTotal = habits.length * 7

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[20px]"
            style={{ background: COLOR_BG }}>🌱</div>
          <div>
            <h1 className="text-[20px] font-bold text-[#0D1F3C]">Habitudes</h1>
            {habits.length > 0 && (
              <p className="text-[11px] text-[#94A3B8]">
                Aujourd'hui : {todayDone}/{habits.length} · {todayPct}%
              </p>
            )}
          </div>
        </div>

        {!coachView && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-colors"
            style={showAdd
              ? { background: COLOR_BG, color: COLOR, border: `1.5px solid ${COLOR_LIGHT}` }
              : { background: COLOR, color: '#fff', boxShadow: '0 4px 16px rgba(168,85,247,0.25)' }
            }
          >
            <Plus size={14} />
            {showAdd ? 'Annuler' : 'Ajouter'}
          </button>
        )}
      </div>

      {/* Add habit form */}
      {!coachView && showAdd && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
              Nom de l'habitude
            </label>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Ex : Boire 2L d'eau…"
              className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none"
              onFocus={e => (e.target.style.borderColor = COLOR)}
              onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">Emoji</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button key={em} onClick={() => setNewEmoji(em)}
                  className="w-9 h-9 rounded-xl text-[18px] flex items-center justify-center border-2 transition-colors"
                  style={newEmoji === em
                    ? { borderColor: COLOR, background: COLOR_BG }
                    : { borderColor: '#E2E8F0', background: '#F8FAFB' }
                  }>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addPersonalHabit} disabled={addSaving || !newName.trim()}
            className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity disabled:opacity-40"
            style={{ background: COLOR }}>
            {addSaving ? 'Enregistrement…' : 'Valider'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-6 text-center">
          <span className="text-[36px] block mb-2">🌱</span>
          <p className="text-[14px] font-semibold mb-1" style={{ color: '#6B21A8' }}>
            Aucune habitude pour l'instant
          </p>
          <p className="text-[12px]" style={{ color: '#9333EA' }}>
            Ton coach définira bientôt tes habitudes. En attendant, tu peux en ajouter via le bouton +.
          </p>
        </div>
      )}

      {/* ── Tableau habitudes ─────────────────────────────────────────── */}
      {habits.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 520 }}>

              {/* Column headers — day + donut */}
              <thead>
                <tr>
                  {/* Habit label column */}
                  <th className="text-left px-4 py-3 border-b border-[#F1F5F9]" style={{ width: 180, minWidth: 140 }}>
                    <span className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-widest">
                      Habitude
                    </span>
                  </th>

                  {dayStats.map(d => {
                    const isToday = d.date === today
                    return (
                      <th key={d.date}
                        className="px-1 py-3 border-b border-[#F1F5F9] text-center"
                        style={{ width: 52, background: isToday ? COLOR_BG : undefined }}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wide"
                            style={{ color: isToday ? COLOR : '#94A3B8' }}>
                            {d.dayLabel}
                          </span>
                          <span className="text-[12px] font-bold"
                            style={{ color: isToday ? COLOR : '#0D1F3C' }}>
                            {d.dayNum}
                          </span>
                          <Donut pct={d.pct} size={28} />
                          <span className="text-[9px]" style={{ color: isToday ? COLOR : '#94A3B8' }}>
                            {d.done}/{d.total}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              {/* Rows — one per habit */}
              <tbody>
                {sorted.map((habit, idx) => (
                  <tr key={habit.id}
                    className="transition-colors"
                    style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFD' }}>

                    {/* Habit name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] flex-shrink-0">{habit.emoji}</span>
                        <span className="text-[12px] font-semibold text-[#0D1F3C] leading-tight flex-1 min-w-0 truncate">
                          {habit.name}
                        </span>
                        {habit.source === 'client' && !coachView && (
                          <button
                            onClick={() => deletePersonalHabit(habit.id)}
                            className="flex-shrink-0 text-[#E2E8F0] hover:text-red-400 transition-colors p-0.5 ml-1">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Day checkboxes */}
                    {weekDays.map(d => {
                      const done    = isDone(habit.id, d.date)
                      const key     = `${habit.id}-${d.date}`
                      const busy    = toggling === key
                      const future  = d.date > today
                      const isToday = d.date === today
                      return (
                        <td key={d.date} className="px-1 py-3 text-center"
                          style={{ background: isToday ? COLOR_BG : undefined }}>
                          <button
                            onClick={() => toggleHabit(habit.id, d.date)}
                            disabled={busy || future || coachView}
                            className="w-7 h-7 rounded-lg border-2 mx-auto flex items-center justify-center transition-all"
                            style={done
                              ? { background: COLOR, borderColor: COLOR }
                              : future
                                ? { background: '#F8FAFB', borderColor: COLOR_LIGHT, opacity: 0.35 }
                                : { background: '#fff', borderColor: '#D1D5DB' }
                            }
                          >
                            {busy ? (
                              <span className="block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : done ? (
                              <span className="text-[11px] font-bold text-white leading-none">✓</span>
                            ) : null}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer weekly score */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <p className="text-[11px] text-[#94A3B8]">Score semaine</p>
            <div className="flex items-center gap-2">
              {/* Mini progress bar */}
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: COLOR_LIGHT }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: weekTotal > 0 ? `${Math.round(weekDone / weekTotal * 100)}%` : '0%', background: COLOR }} />
              </div>
              <span className="text-[12px] font-bold" style={{ color: COLOR }}>
                {weekTotal > 0 ? Math.round(weekDone / weekTotal * 100) : 0}%
              </span>
              <span className="text-[11px] text-[#94A3B8]">({weekDone}/{weekTotal})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
