'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Dumbbell, ChevronLeft, Lock } from 'lucide-react'

/* ── Types ── */
type Exercise = {
  id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  rest_seconds: number | null
  notes: string | null
  position: number
  library_instructions: string | null
  library_category: string | null
  library_muscle_group: string | null
}

type ExerciseLog = {
  id?: string
  programme_day_exercise_id: string
  set_number: number
  reps_done: number | null
  weight_kg: number | null
  notes: string | null
}

type WorkoutData = {
  assignment: { id: string; start_date: string; programme: { id: string; title: string; duration_days: number | null } }
  dayNumber: number
  effectiveDay: number
  totalDays: number
  day: { id: string; day_number: number; title: string | null; exercises: Exercise[] }
  log: { id: string; completed: boolean; exercise_logs: ExerciseLog[] } | null
  todayStr: string
}

type OverviewDay = {
  id: string
  day_number: number
  title: string | null
  exercise_count: number
  completed: boolean
  is_today: boolean
}

type OverviewData = {
  programme: { id: string; title: string }
  assignment: { id: string; start_date: string }
  days: OverviewDay[]
  stats: { completed: number; total: number }
  effectiveDay: number
  dayNumber: number
}

/* ── Workout detail view ── */
function WorkoutDetail({
  token,
  dayId,
  isToday,
  onBack,
}: {
  token: string
  dayId: string
  isToday: boolean
  onBack: () => void
}) {
  const [data, setData] = useState<WorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<Record<string, { reps: string; weight: string }[]>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [openInstructions, setOpenInstructions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/client/workout?token=${token}`)
      const json = await res.json()
      if (!json.day) { setLoading(false); return }

      // If we want a specific day (not today), fetch that day's exercises separately
      if (!isToday) {
        const exRes = await fetch(`/api/client/workout/day?token=${token}&day_id=${dayId}`)
        const exJson = await exRes.json()
        setData({ ...json, day: exJson.day ?? json.day })
        initLogs(exJson.day ?? json.day, json.log)
      } else {
        setData(json)
        setDone(json.log?.completed ?? false)
        initLogs(json.day, json.log)
      }
      setLoading(false)
    }

    function initLogs(day: WorkoutData['day'], log: WorkoutData['log']) {
      const initialLogs: Record<string, { reps: string; weight: string }[]> = {}
      for (const ex of day.exercises) {
        const sets = ex.sets ?? 3
        const existing = (log?.exercise_logs ?? []).filter((l: ExerciseLog) => l.programme_day_exercise_id === ex.id)
        initialLogs[ex.id] = Array.from({ length: sets }, (_, i) => ({
          reps: String(existing.find((l: ExerciseLog) => l.set_number === i + 1)?.reps_done ?? ex.reps ?? ''),
          weight: String(existing.find((l: ExerciseLog) => l.set_number === i + 1)?.weight_kg ?? ex.weight_kg ?? ''),
        }))
      }
      setLogs(initialLogs)
    }

    load()
  }, [token, dayId, isToday])

  function updateLog(exId: string, setIdx: number, field: 'reps' | 'weight', val: string) {
    setLogs(prev => {
      const copy = { ...prev }
      copy[exId] = [...(copy[exId] ?? [])]
      copy[exId][setIdx] = { ...copy[exId][setIdx], [field]: val }
      return copy
    })
  }

  async function handleFinish() {
    if (!data) return
    setSaving(true)
    const exercise_logs: ExerciseLog[] = []
    for (const ex of data.day.exercises) {
      const exLogs = logs[ex.id] ?? []
      exLogs.forEach((l, i) => {
        exercise_logs.push({
          programme_day_exercise_id: ex.id,
          set_number: i + 1,
          reps_done: l.reps ? parseInt(l.reps) : null,
          weight_kg: l.weight ? parseFloat(l.weight) : null,
          notes: null,
        })
      })
    }
    const res = await fetch('/api/client/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        assignment_id: data.assignment.id,
        programme_day_id: data.day.id,
        log_date: data.todayStr,
        exercise_logs,
        completed: true,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la sauvegarde'); return }
    setDone(true)
    toast.success('Séance enregistrée !')
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-5 h-5 border-2 border-[#4E9B6F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return null

  // Read-only preview for non-today days
  if (!isToday) {
    return (
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[#64748B] mb-5">
          <ChevronLeft size={15} /> Retour au programme
        </button>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{data.assignment.programme.title}</p>
          <h1 className="text-[20px] font-bold text-[#0D1F3C] mt-0.5">
            {data.day.title ?? `Jour ${data.day.day_number}`}
          </h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">{data.day.exercises.length} exercice{data.day.exercises.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="space-y-3">
          {data.day.exercises.map(ex => (
            <div key={ex.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#EEF9F3] flex items-center justify-center shrink-0">
                  <Dumbbell size={13} className="text-[#4E9B6F]" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#0D1F3C]">{ex.exercise_name}</p>
                  <p className="text-[11px] text-[#94A3B8]">
                    {ex.sets ?? 3} série{(ex.sets ?? 3) !== 1 ? 's' : ''}{ex.reps ? ` × ${ex.reps} reps` : ''}{ex.weight_kg ? ` · ${ex.weight_kg} kg` : ''}
                  </p>
                </div>
                {ex.library_instructions && (
                  <button
                    onClick={() => setOpenInstructions(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                    className="ml-auto shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#4E9B6F] bg-[#EEF9F3] px-2 py-1 rounded-lg"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4.5" stroke="#4E9B6F" strokeWidth="1"/>
                      <path d="M5 4.5V7M5 3h.01" stroke="#4E9B6F" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Tuto
                  </button>
                )}
              </div>
              {ex.library_instructions && openInstructions[ex.id] && (
                <div className="mt-3 bg-[#F8FAFB] rounded-xl p-3 border border-[#EEF2F7]">
                  <ol className="space-y-1.5">
                    {ex.library_instructions.split('\n').filter(s => s.trim() && !/^\d+$/.test(s.trim())).map((step, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-[#374151] leading-relaxed">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-[#4E9B6F] text-white text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Today's workout — full logging UI
  if (done) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[#64748B] mb-6 self-start ml-4">
        <ChevronLeft size={15} /> Retour
      </button>
      <div className="w-16 h-16 rounded-full bg-[#EEF9F3] flex items-center justify-center mb-4">
        <CheckCircle2 size={32} className="text-[#4E9B6F]" />
      </div>
      <p className="text-[18px] font-bold text-[#0D1F3C] mb-1">Séance terminée !</p>
      <p className="text-[13px] text-[#64748B]">Jour {data.dayNumber} · {data.assignment.programme.title}</p>
    </div>
  )

  return (
    <div className="flex-1 px-4 py-6 max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-[#64748B] mb-5">
        <ChevronLeft size={15} /> Retour au programme
      </button>

      <div className="mb-5">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{data.assignment.programme.title}</p>
        <h1 className="text-[20px] font-bold text-[#0D1F3C] mt-0.5">
          {data.day.title ?? `Jour ${data.day.day_number}`}
        </h1>
        <p className="text-[12px] text-[#64748B] mt-0.5">
          Jour {data.dayNumber} · {data.day.exercises.length} exercice{data.day.exercises.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 mb-6">
        <div
          className="h-1.5 rounded-full bg-[#4E9B6F] transition-all"
          style={{ width: `${Math.min(100, (data.effectiveDay / data.totalDays) * 100)}%` }}
        />
      </div>

      <div className="space-y-4">
        {data.day.exercises.map(ex => {
          const sets = ex.sets ?? 3
          const exLogs = logs[ex.id] ?? Array.from({ length: sets }, () => ({ reps: String(ex.reps ?? ''), weight: String(ex.weight_kg ?? '') }))
          return (
            <div key={ex.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#EEF9F3] flex items-center justify-center shrink-0">
                  <Dumbbell size={13} className="text-[#4E9B6F]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0D1F3C]">{ex.exercise_name}</p>
                  <p className="text-[11px] text-[#94A3B8]">
                    {sets} série{sets !== 1 ? 's' : ''}{ex.reps ? ` × ${ex.reps} reps` : ''}{ex.weight_kg ? ` · ${ex.weight_kg} kg` : ''}{ex.rest_seconds ? ` · ${ex.rest_seconds}s repos` : ''}
                  </p>
                </div>
                {ex.library_instructions && (
                  <button
                    onClick={() => setOpenInstructions(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#4E9B6F] bg-[#EEF9F3] px-2 py-1 rounded-lg"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4.5" stroke="#4E9B6F" strokeWidth="1"/>
                      <path d="M5 4.5V7M5 3h.01" stroke="#4E9B6F" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Tuto
                  </button>
                )}
              </div>
              {ex.library_instructions && openInstructions[ex.id] && (
                <div className="mb-3 bg-[#F8FAFB] rounded-xl p-3 border border-[#EEF2F7]">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide mb-2">Instructions</p>
                  <ol className="space-y-1.5">
                    {ex.library_instructions.split('\n').filter(s => s.trim() && !/^\d+$/.test(s.trim())).map((step, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-[#374151] leading-relaxed">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-[#4E9B6F] text-white text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {ex.notes && !ex.library_instructions && (
                <p className="text-[11px] text-[#64748B] bg-[#FAFBFD] rounded-lg px-3 py-2 mb-3">{ex.notes}</p>
              )}
              <div className="space-y-2">
                <div className="grid grid-cols-[40px_1fr_1fr] gap-2 px-1">
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase text-center">Série</p>
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase text-center">Reps</p>
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase text-center">Charge (kg)</p>
                </div>
                {exLogs.map((l, i) => (
                  <div key={i} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                    <span className="text-center text-[12px] font-semibold text-[#64748B]">{i + 1}</span>
                    <input type="number" min={0} value={l.reps}
                      onChange={e => updateLog(ex.id, i, 'reps', e.target.value)}
                      className="text-center text-[14px] font-semibold border border-[#E2E8F0] rounded-xl px-2 py-2.5 focus:outline-none focus:border-[#4E9B6F] bg-[#F8FAFB]"
                      placeholder="—" />
                    <input type="number" min={0} step={0.5} value={l.weight}
                      onChange={e => updateLog(ex.id, i, 'weight', e.target.value)}
                      className="text-center text-[14px] font-semibold border border-[#E2E8F0] rounded-xl px-2 py-2.5 focus:outline-none focus:border-[#4E9B6F] bg-[#F8FAFB]"
                      placeholder="—" />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={handleFinish} disabled={saving}
        className="w-full mt-6 py-4 bg-[#4E9B6F] text-white rounded-2xl text-[15px] font-bold hover:bg-[#3d8058] transition-colors disabled:opacity-60 shadow-lg shadow-[#4E9B6F]/20">
        {saving ? 'Enregistrement…' : 'Terminer la séance'}
      </button>
    </div>
  )
}

/* ── Overview view ── */
function ProgrammeOverview({
  data,
  onSelectDay,
}: {
  data: OverviewData
  onSelectDay: (day: OverviewDay) => void
}) {
  // Group days by week
  const weeks: OverviewDay[][] = []
  data.days.forEach(d => {
    const weekIdx = Math.ceil(d.day_number / 7) - 1
    if (!weeks[weekIdx]) weeks[weekIdx] = []
    weeks[weekIdx].push(d)
  })

  const progressPct = Math.round((data.stats.completed / data.stats.total) * 100)

  return (
    <div className="flex-1 px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Programme actif</p>
        <h1 className="text-[22px] font-bold text-[#0D1F3C]">{data.programme.title}</h1>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-semibold text-[#0D1F3C]">Progression</p>
          <p className="text-[13px] font-bold text-[#4E9B6F]">{data.stats.completed} / {data.stats.total} séances</p>
        </div>
        <div className="w-full bg-[#F1F5F9] rounded-full h-2">
          <div
            className="h-2 rounded-full bg-[#4E9B6F] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-1.5">{progressPct}% complété</p>
      </div>

      {/* Days by week */}
      <div className="space-y-6">
        {weeks.map((weekDays, wIdx) => (
          <div key={wIdx}>
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wide mb-2">
              Semaine {wIdx + 1}
            </p>
            <div className="space-y-2">
              {weekDays.map(day => {
                const isToday = day.is_today
                const isDone = day.completed

                return (
                  <button
                    key={day.id}
                    onClick={() => onSelectDay(day)}
                    className="w-full flex items-center gap-3 bg-white rounded-2xl border p-4 text-left transition-all active:scale-[0.99]"
                    style={{
                      borderColor: isToday ? '#4E9B6F' : '#E2E8F0',
                      boxShadow: isToday ? '0 0 0 1px #4E9B6F' : 'none',
                    }}
                  >
                    {/* Status icon */}
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: isDone ? '#EEF9F3' : isToday ? '#0D1F3C' : '#F8FAFB' }}>
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-[#4E9B6F]" />
                      ) : isToday ? (
                        <Dumbbell size={16} className="text-white" />
                      ) : (
                        <span className="text-[12px] font-bold text-[#94A3B8]">{day.day_number}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-[#0D1F3C] truncate">
                          {day.title ?? `Jour ${day.day_number}`}
                        </p>
                        {isToday && (
                          <span className="shrink-0 text-[10px] font-bold text-white bg-[#4E9B6F] px-2 py-0.5 rounded-full">
                            Aujourd'hui
                          </span>
                        )}
                        {isDone && !isToday && (
                          <span className="shrink-0 text-[10px] font-semibold text-[#4E9B6F]">Fait</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#94A3B8] mt-0.5">
                        {day.exercise_count} exercice{day.exercise_count !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#CBD5E1]">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function ClientProgrammePage() {
  const params = useParams()
  const token = params?.token as string

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noAssignment, setNoAssignment] = useState(false)
  const [selectedDay, setSelectedDay] = useState<OverviewDay | null>(null)

  useEffect(() => {
    fetch(`/api/client/workout/overview?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (!d.assignment) { setNoAssignment(true); setLoading(false); return }
        setOverview(d)
        setLoading(false)
      })
  }, [token])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 border-2 border-[#4E9B6F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (noAssignment || !overview) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-4">
        <Lock size={22} className="text-[#94A3B8]" />
      </div>
      <p className="text-[16px] font-semibold text-[#0D1F3C] mb-1">Aucun programme actif</p>
      <p className="text-[13px] text-[#94A3B8]">Ton coach n'a pas encore assigné de programme.</p>
    </div>
  )

  // Detail view for a selected day
  if (selectedDay) {
    return (
      <WorkoutDetail
        token={token}
        dayId={selectedDay.id}
        isToday={selectedDay.is_today}
        onBack={() => {
          setSelectedDay(null)
          // Refresh overview stats after potential workout completion
          fetch(`/api/client/workout/overview?token=${token}`)
            .then(r => r.json())
            .then(d => { if (d.assignment) setOverview(d) })
        }}
      />
    )
  }

  return (
    <ProgrammeOverview
      data={overview}
      onSelectDay={setSelectedDay}
    />
  )
}
