'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Play, SkipForward, Clock, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────

type Exercise = {
  id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  rest_seconds: number | null
  notes: string | null
  position: number
}

type ExerciseLog = {
  id?: string
  programme_day_exercise_id: string
  set_number: number
  reps_done: number | null
  weight_kg: number | null
  notes: null
}

type WorkoutData = {
  assignment: { id: string; start_date: string; programme: { id: string; title: string; duration_days: number | null } }
  dayNumber: number
  effectiveDay: number
  totalDays: number
  day: { id: string; day_number: number; title: string | null; exercises: Exercise[] } | null
  log: { id: string; completed: boolean; exercise_logs: ExerciseLog[] } | null
  todayStr: string
}

type SetState = { reps: string; weight: string; done: boolean; isPR?: boolean }

type HistoryLog = {
  id: string
  log_date: string
  completed: boolean
  notes: string | null
  programme_day: { title: string | null; day_number: number } | null
  exercise_logs: { exercise_name: string; set_number: number; reps_done: number | null; weight_kg: number | null }[]
}

type FreeSet = { reps: string; weight: string; done: boolean; isPR?: boolean }
type FreeExercise = { localId: string; name: string; sets: FreeSet[] }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function epley(weight: number, reps: number) {
  return weight * (1 + reps / 30)
}

function buildMemoryMap(history: HistoryLog[]) {
  const last: Record<string, { reps: number | null; weight: number | null }> = {}
  const pr: Record<string, number> = {}
  // history is newest first
  for (const log of [...history].reverse()) {
    for (const el of log.exercise_logs) {
      if (!el.exercise_name || el.exercise_name === '—') continue
      last[el.exercise_name] = { reps: el.reps_done, weight: el.weight_kg }
      if (el.weight_kg && el.reps_done) {
        const e = epley(el.weight_kg, el.reps_done)
        if (!pr[el.exercise_name] || e > pr[el.exercise_name]) pr[el.exercise_name] = e
      }
    }
  }
  return { last, pr }
}

// ─── Rest Timer ─────────────────────────────────────────────────────────────

function RestTimer({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) { onSkip(); return }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onSkip])
  const pct = remaining / seconds
  const r = 40
  const circ = 2 * Math.PI * r
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
        <p className="text-[13px] font-semibold text-[#94A3B8] mb-4 uppercase tracking-wide">Repos</p>
        <div className="relative inline-flex items-center justify-center mb-5">
          <svg width={100} height={100} className="-rotate-90">
            <circle cx={50} cy={50} r={r} fill="none" stroke="var(--brand-bg)" strokeWidth={8} />
            <circle cx={50} cy={50} r={r} fill="none" stroke="var(--brand)" strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
          </svg>
          <span className="absolute text-[28px] font-bold text-[#0D1F3C]">{remaining}</span>
        </div>
        <button onClick={onSkip} className="w-full py-3 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2" style={{ background: 'var(--brand)' }}>
          <SkipForward size={16} /> Passer
        </button>
      </div>
    </div>
  )
}

// ─── Autocomplete Input ───────────────────────────────────────────────────────

function ExerciseInput({ value, onChange, exercises }: { value: string; onChange: (v: string) => void; exercises: string[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (!value.trim() || value.length < 2) return []
    const q = value.toLowerCase()
    return exercises.filter(e => e.toLowerCase().includes(q)).slice(0, 6)
  }, [value, exercises])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Nom de l'exercice…"
        className="w-full text-[14px] font-semibold text-[#0D1F3C] bg-transparent border-none outline-none placeholder-[#CBD5E1]"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <button key={s} onMouseDown={() => { onChange(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-[13px] text-[#0D1F3C] hover:bg-[var(--brand-bg)] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ history, loading }: { history: HistoryLog[]; loading: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (loading) return <div className="text-center py-10"><div className="w-5 h-5 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto" /></div>
  if (history.length === 0) return (
    <div className="text-center py-12">
      <span className="text-4xl">💪</span>
      <p className="text-[14px] font-semibold text-[#0D1F3C] mt-3 mb-1">Aucune séance enregistrée</p>
      <p className="text-[13px] text-[#94A3B8]">Tes séances apparaîtront ici.</p>
    </div>
  )
  return (
    <div className="space-y-3">
      {history.map(log => {
        const byEx: Record<string, typeof log.exercise_logs> = {}
        for (const el of log.exercise_logs) {
          if (!byEx[el.exercise_name]) byEx[el.exercise_name] = []
          byEx[el.exercise_name].push(el)
        }
        const exNames = Object.keys(byEx)
        const isOpen = expanded === log.id
        const sessionTitle = log.programme_day?.title ?? (log.notes ?? 'Séance libre')
        return (
          <div key={log.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : log.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-bg)' }}>
                <span className="text-[18px]">💪</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0D1F3C] truncate">{sessionTitle}</p>
                <p className="text-[11px] text-[#94A3B8]">
                  {new Date(log.log_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  {exNames.length > 0 ? ` · ${exNames.length} exercice${exNames.length !== 1 ? 's' : ''}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {log.completed && <CheckCircle2 size={16} className="text-[var(--brand)]" />}
                {isOpen ? <ChevronUp size={16} className="text-[#94A3B8]" /> : <ChevronDown size={16} className="text-[#94A3B8]" />}
              </div>
            </button>
            {isOpen && exNames.length > 0 && (
              <div className="px-4 pb-4 space-y-3 border-t border-[#F8FAFC]">
                {exNames.map(name => (
                  <div key={name}>
                    <p className="text-[12px] font-semibold text-[#0D1F3C] mb-1.5 mt-2">{name}</p>
                    <div className="grid grid-cols-3 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1 px-1">
                      <span>Série</span><span className="text-center">Reps</span><span className="text-right">Charge</span>
                    </div>
                    {byEx[name].sort((a, b) => a.set_number - b.set_number).map(s => (
                      <div key={s.set_number} className="grid grid-cols-3 text-[12px] text-[#0D1F3C] py-1 px-1 rounded-lg even:bg-[#F8FAFB]">
                        <span className="font-medium text-[#94A3B8]">{s.set_number}</span>
                        <span className="text-center font-semibold">{s.reps_done ?? '—'}</span>
                        <span className="text-right font-semibold">{s.weight_kg != null ? `${s.weight_kg} kg` : '—'}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Free Session ─────────────────────────────────────────────────────────────

function FreeSession({ token, exercises: exerciseList, memory, onSaved, coachView = false }: {
  token: string
  exercises: string[]
  memory: Record<string, { reps: number | null; weight: number | null }>
  coachView?: boolean
  onSaved: () => void
}) {
  const [exercises, setExercises] = useState<FreeExercise[]>([])
  const [sessionStarted, setSessionStarted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const skipRest = useCallback(() => setRestSeconds(null), [])
  const [localPR, setLocalPR] = useState<Record<string, number>>({})

  function addExercise() {
    setExercises(prev => [...prev, {
      localId: crypto.randomUUID(),
      name: '',
      sets: [
        { reps: '', weight: '', done: false },
        { reps: '', weight: '', done: false },
        { reps: '', weight: '', done: false },
      ],
    }])
  }

  function updateExName(localId: string, name: string) {
    setExercises(prev => prev.map(e => {
      if (e.localId !== localId) return e
      const mem = memory[name]
      if (mem) {
        return {
          ...e, name,
          sets: e.sets.map(s => s.done ? s : {
            ...s,
            reps: mem.reps ? String(mem.reps) : s.reps,
            weight: mem.weight ? String(mem.weight) : s.weight,
          })
        }
      }
      return { ...e, name }
    }))
  }

  function addSet(localId: string) {
    setExercises(prev => prev.map(e => e.localId === localId
      ? { ...e, sets: [...e.sets, { reps: '', weight: '', done: false }] }
      : e))
  }

  function removeExercise(localId: string) {
    setExercises(prev => prev.filter(e => e.localId !== localId))
  }

  function updateSet(localId: string, idx: number, field: 'reps' | 'weight', val: string) {
    setExercises(prev => prev.map(e => {
      if (e.localId !== localId) return e
      const sets = [...e.sets]
      sets[idx] = { ...sets[idx], [field]: val }
      return { ...e, sets }
    }))
  }

  function completeSet(localId: string, idx: number, exName: string) {
    setExercises(prev => prev.map(e => {
      if (e.localId !== localId) return e
      const sets = [...e.sets]
      const s = sets[idx]
      const weight = parseFloat(s.weight)
      const reps = parseInt(s.reps)
      let isPR = false
      if (weight && reps) {
        const current1RM = epley(weight, reps)
        if (!localPR[exName] || current1RM > localPR[exName]) {
          isPR = true
          setLocalPR(p => ({ ...p, [exName]: current1RM }))
          toast.success(`🏆 Nouveau PR sur ${exName} !`)
        }
      }
      sets[idx] = { ...s, done: true, isPR }
      return { ...e, sets }
    }))
  }

  async function handleSave() {
    const valid = exercises.filter(e => e.name.trim())
    if (valid.length === 0) { toast.error('Ajoute au moins un exercice'); return }
    setSaving(true)
    const today = new Date()
    const log_date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    const exercise_logs: { exercise_name: string; set_number: number; reps_done: number | null; weight_kg: number | null; notes: null }[] = []
    for (const ex of valid) {
      ex.sets.forEach((s, i) => {
        exercise_logs.push({
          exercise_name: ex.name.trim(),
          set_number: i + 1,
          reps_done: s.reps ? parseInt(s.reps) : null,
          weight_kg: s.weight ? parseFloat(s.weight) : null,
          notes: null,
        })
      })
    }
    const res = await fetch('/api/client/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, assignment_id: null, log_date, exercise_logs, completed: true }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la sauvegarde'); return }
    toast.success('Séance enregistrée !')
    onSaved()
  }

  const allDoneCount = exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <>
      {restSeconds !== null && <RestTimer seconds={restSeconds} onSkip={skipRest} />}

      {!sessionStarted ? (
        !coachView && <button
          onClick={() => { setSessionStarted(true); addExercise() }}
          className="w-full mb-4 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-lg"
          style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
        >
          <Play size={18} fill="white" /> Démarrer une séance libre
        </button>
      ) : (
        <>
          <div className="space-y-4 mb-4">
            {exercises.map((ex, exIdx) => {
              const allDone = ex.sets.every(s => s.done)
              const mem = ex.name ? memory[ex.name] : null
              return (
                <div key={ex.localId} className="bg-white rounded-2xl border overflow-hidden transition-colors"
                  style={{ borderColor: allDone ? 'var(--brand-border)' : '#E2E8F0' }}>
                  <div className="flex items-center gap-2 px-4 py-3" style={allDone ? { background: 'var(--brand-bg)' } : {}}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                      style={{ background: allDone ? 'var(--brand)' : '#F1F5F9', color: allDone ? '#fff' : '#64748B' }}>
                      {allDone ? '✓' : exIdx + 1}
                    </div>
                    <ExerciseInput value={ex.name} onChange={v => updateExName(ex.localId, v)} exercises={exerciseList} />
                    <button onClick={() => removeExercise(ex.localId)} className="text-[#CBD5E1] hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {mem && (
                    <p className="text-[11px] text-[#64748B] bg-[var(--brand-bg)] px-4 py-1.5 border-b border-[var(--brand-border)]">
                      Dernière fois : {mem.reps ? `${mem.reps} reps` : ''}{mem.reps && mem.weight ? ' · ' : ''}{mem.weight ? `${mem.weight} kg` : ''}
                    </p>
                  )}

                  <div className="px-4 pb-3">
                    <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-2 pt-2.5 pb-1 px-1">
                      <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">Sér.</p>
                      <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">Reps</p>
                      <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">Charge</p>
                      <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">OK</p>
                    </div>
                    {ex.sets.map((s, i) => (
                      <div key={i} className="grid grid-cols-[32px_1fr_1fr_40px] gap-2 items-center py-1.5 rounded-lg px-1 transition-colors"
                        style={s.done ? { background: s.isPR ? '#FFFBEB' : 'var(--brand-bg)' } : {}}>
                        <span className="text-center text-[12px] font-semibold" style={{ color: s.done ? 'var(--brand)' : '#64748B' }}>{i + 1}</span>
                        <input type="number" min={0} value={s.reps}
                          onChange={e => updateSet(ex.localId, i, 'reps', e.target.value)}
                          disabled={s.done}
                          className="text-center text-[13px] font-semibold border rounded-xl px-2 py-2 focus:outline-none disabled:opacity-60"
                          style={{ borderColor: s.done ? 'var(--brand-border)' : '#E2E8F0', background: s.done ? 'var(--brand-bg)' : '#F8FAFB' }}
                          placeholder="—" />
                        <input type="number" min={0} step={0.5} value={s.weight}
                          onChange={e => updateSet(ex.localId, i, 'weight', e.target.value)}
                          disabled={s.done}
                          className="text-center text-[13px] font-semibold border rounded-xl px-2 py-2 focus:outline-none disabled:opacity-60"
                          style={{ borderColor: s.done ? 'var(--brand-border)' : '#E2E8F0', background: s.done ? 'var(--brand-bg)' : '#F8FAFB' }}
                          placeholder="—" />
                        {s.done ? (
                          <div className="flex items-center justify-center">
                            {s.isPR ? <span className="text-[16px]">🏆</span> : <CheckCircle2 size={20} color="var(--brand)" />}
                          </div>
                        ) : (
                          <button onClick={() => completeSet(ex.localId, i, ex.name)}
                            className="flex items-center justify-center w-8 h-8 rounded-xl border-2 mx-auto transition-colors"
                            style={{ borderColor: 'var(--brand)' }}>
                            <CheckCircle2 size={16} color="var(--brand)" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addSet(ex.localId)}
                      className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-semibold border border-dashed border-[#E2E8F0] text-[#94A3B8] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-1">
                      <Plus size={11} /> Série
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={addExercise}
            className="w-full mb-4 py-3 rounded-2xl text-[13px] font-bold border-2 border-dashed border-[var(--brand-border)] text-[var(--brand)] flex items-center justify-center gap-2 hover:bg-[var(--brand-bg)] transition-colors">
            <Plus size={15} /> Ajouter un exercice
          </button>

          <button onClick={handleSave}
            disabled={saving || exercises.filter(e => e.name.trim()).length === 0}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-opacity disabled:opacity-40 shadow-lg"
            style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            {saving ? 'Enregistrement…' : totalSets > 0
              ? `Terminer (${allDoneCount}/${totalSets} séries) ✓`
              : 'Terminer la séance ✓'}
          </button>
        </>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const coachView = searchParams.get('coach') === '1'
  const token = params?.token as string

  const [data, setData] = useState<WorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noAssignment, setNoAssignment] = useState(false)
  const [tab, setTab] = useState<'jour' | 'libre' | 'historique'>('jour')

  // History (shared across tabs, loaded once)
  const [history, setHistory] = useState<HistoryLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyKey, setHistoryKey] = useState(0)

  // Exercise list for autocomplete
  const [exerciseList, setExerciseList] = useState<string[]>([])

  // Derived from history
  const { last: memory } = useMemo(() => buildMemoryMap(history), [history])

  // Programme session state
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sets, setSets] = useState<Record<string, SetState[]>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [localPR, setLocalPR] = useState<Record<string, number>>({})

  // Rest timer
  const [restSeconds, setRestSeconds] = useState<number | null>(null)
  const skipRestRef = useRef<() => void>(() => setRestSeconds(null))
  skipRestRef.current = () => setRestSeconds(null)

  // Load workout data + history + exercises in parallel
  useEffect(() => {
    Promise.all([
      fetch(`/api/client/workout?token=${token}`).then(r => r.json()),
      fetch(`/api/client/workout/history?token=${token}`).then(r => r.json()),
      fetch(`/api/client/exercises?token=${token}`).then(r => r.json()),
    ]).then(([workout, hist, exs]) => {
      // History
      setHistory(hist.logs ?? [])
      setHistoryLoading(false)
      setExerciseList(exs.exercises ?? [])

      // Workout
      if (!workout.assignment) {
        setNoAssignment(true)
        setLoading(false)
        setTab('libre')
        return
      }
      if (!workout.day) {
        // Programme assigné mais aucun jour/exercice configuré par le coach
        setNoAssignment(false)
        setData(workout)
        setLoading(false)
        return
      }
      setData(workout)
      setDone(workout.log?.completed ?? false)

      const histLogs: HistoryLog[] = hist.logs ?? []
      const { last: mem, pr: prMem } = buildMemoryMap(histLogs)
      setLocalPR({ ...prMem })

      const init: Record<string, SetState[]> = {}
      for (const ex of workout.day.exercises) {
        const count = ex.sets ?? 3
        const existing: ExerciseLog[] = workout.log?.exercise_logs ?? []
        const lastMem = mem[ex.exercise_name]
        init[ex.id] = Array.from({ length: count }, (_, i) => {
          const prev = existing.find((l: ExerciseLog) => l.programme_day_exercise_id === ex.id && l.set_number === i + 1)
          return {
            reps: String(prev?.reps_done ?? ex.reps ?? lastMem?.reps ?? ''),
            weight: String(prev?.weight_kg ?? ex.weight_kg ?? lastMem?.weight ?? ''),
            done: !!prev,
          }
        })
      }
      setSets(init)
      setLoading(false)
    }).catch(() => { setLoading(false); setHistoryLoading(false) })
  }, [token, historyKey])

  function updateSet(exId: string, idx: number, field: 'reps' | 'weight', val: string) {
    setSets(prev => {
      const copy = { ...prev, [exId]: [...prev[exId]] }
      copy[exId][idx] = { ...copy[exId][idx], [field]: val }
      return copy
    })
  }

  function completeSet(exId: string, idx: number, restSecs: number | null, exName: string) {
    setSets(prev => {
      const copy = { ...prev, [exId]: [...prev[exId]] }
      const s = copy[exId][idx]
      const weight = parseFloat(s.weight)
      const reps = parseInt(s.reps)
      let isPR = false
      if (weight && reps) {
        const current1RM = epley(weight, reps)
        const best = localPR[exName]
        if (!best || current1RM > best) {
          isPR = true
          setLocalPR(p => ({ ...p, [exName]: current1RM }))
          toast.success(`🏆 Nouveau PR sur ${exName} !`)
        }
      }
      copy[exId][idx] = { ...s, done: true, isPR }
      return copy
    })
    if (restSecs && restSecs > 0) setRestSeconds(restSecs)
  }

  const handleFinish = useCallback(async () => {
    if (!data?.day) return
    setSaving(true)
    const exercise_logs: ExerciseLog[] = []
    for (const ex of data.day.exercises) {
      const exSets = sets[ex.id] ?? []
      exSets.forEach((s, i) => {
        exercise_logs.push({
          programme_day_exercise_id: ex.id,
          set_number: i + 1,
          reps_done: s.reps ? parseInt(s.reps) : null,
          weight_kg: s.weight ? parseFloat(s.weight) : null,
          notes: null,
        })
      })
    }
    const res = await fetch('/api/client/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, assignment_id: data.assignment.id, programme_day_id: data.day.id, log_date: data.todayStr, exercise_logs, completed: true }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la sauvegarde'); return }
    setDone(true)
    toast.success('Séance enregistrée !')
  }, [data, sets, token])

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-dvh">
      <div className="w-5 h-5 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tabs = noAssignment
    ? (['libre', 'historique'] as const)
    : (['jour', 'libre', 'historique'] as const)

  const tabLabels: Record<string, string> = {
    jour: 'Séance du jour',
    libre: 'Séance libre',
    historique: 'Historique',
  }

  const allSetsDone = data?.day ? data.day.exercises.every(ex => (sets[ex.id] ?? []).every(s => s.done)) : false

  return (
    <>
      {restSeconds !== null && <RestTimer seconds={restSeconds} onSkip={skipRestRef.current} />}

      <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: 'var(--brand-bg)' }}>💪</div>
          <h1 className="text-[20px] font-bold text-[#0D1F3C]">Sport</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#F8FAFB] rounded-xl mb-5">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors"
              style={tab === t ? { background: 'var(--brand)', color: '#fff' } : { color: '#64748B' }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Historique */}
        {tab === 'historique' && <HistoryPanel history={history} loading={historyLoading} />}

        {/* Séance libre */}
        {tab === 'libre' && (
          <FreeSession
            token={token}
            exercises={exerciseList}
            memory={memory}
            onSaved={() => { setHistoryKey(k => k + 1); setTab('historique') }}
            coachView={coachView}
          />
        )}

        {/* Séance du jour (programme) */}
        {tab === 'jour' && data && !data.day && (
          <div className="flex items-start gap-3 bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-2xl p-4 mb-5">
            <span className="text-[18px] mt-0.5">⏳</span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--brand-dark)' }}>{data.assignment.programme.title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--brand)' }}>Ton coach est en train de préparer ton programme. Les exercices apparaîtront ici dès qu'il sera prêt.</p>
            </div>
          </div>
        )}

        {tab === 'jour' && data && data.day && (
          <>
            {done ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: 'var(--brand-bg)' }}>
                  <CheckCircle2 size={36} color="var(--brand)" />
                </div>
                <p className="text-[22px] font-bold text-[#0D1F3C] mb-1">Séance terminée !</p>
                <p className="text-[14px] text-[#64748B]">Jour {data.dayNumber} · {data.assignment.programme.title}</p>
                <button onClick={() => setTab('historique')}
                  className="mt-6 px-6 py-2.5 rounded-xl text-[13px] font-semibold mx-auto flex items-center gap-2"
                  style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                  Voir l'historique
                </button>
              </div>
            ) : (
              <>
                {/* Programme info */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{data.assignment.programme.title}</p>
                      <p className="text-[17px] font-bold text-[#0D1F3C] mt-0.5">{data.day.title ?? `Jour ${data.day.day_number}`}</p>
                      <p className="text-[12px] text-[#64748B] mt-0.5">Jour {data.dayNumber} · {data.day.exercises.length} exercice{data.day.exercises.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#94A3B8]">Progression</p>
                      <p className="text-[15px] font-bold" style={{ color: 'var(--brand)' }}>{Math.round((data.effectiveDay / data.totalDays) * 100)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--brand-bg)] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (data.effectiveDay / data.totalDays) * 100)}%`, background: 'var(--brand)' }} />
                  </div>
                </div>

                {!sessionStarted && !coachView && (
                  <button onClick={() => setSessionStarted(true)}
                    className="w-full mb-4 py-3.5 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                    style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
                    <Play size={18} fill="white" /> Démarrer la séance
                  </button>
                )}

                <div className="space-y-4">
                  {data.day.exercises.map((ex, exIdx) => {
                    const exSets = sets[ex.id] ?? []
                    const allDone = exSets.every(s => s.done)
                    const mem = memory[ex.exercise_name]
                    return (
                      <div key={ex.id} className="bg-white rounded-2xl border transition-colors overflow-hidden"
                        style={{ borderColor: allDone ? 'var(--brand-border)' : '#E2E8F0' }}>
                        <div className="flex items-center gap-3 px-4 py-3.5" style={allDone ? { background: 'var(--brand-bg)' } : {}}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                            style={{ background: allDone ? 'var(--brand)' : '#F1F5F9', color: allDone ? '#fff' : '#64748B' }}>
                            {allDone ? '✓' : exIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#0D1F3C] truncate">{ex.exercise_name}</p>
                            <p className="text-[11px] text-[#94A3B8]">
                              {exSets.length} série{exSets.length !== 1 ? 's' : ''}
                              {ex.reps ? ` × ${ex.reps} reps` : ''}
                              {ex.weight_kg ? ` · ${ex.weight_kg} kg` : ''}
                              {ex.rest_seconds ? <> · <Clock size={9} className="inline mb-0.5" /> {ex.rest_seconds}s</> : ''}
                            </p>
                          </div>
                        </div>

                        {/* Memory hint */}
                        {mem && !allDone && (
                          <p className="text-[11px] text-[#64748B] bg-[var(--brand-bg)] px-4 py-1.5 border-b border-[var(--brand-border)]">
                            Dernière fois : {mem.reps ? `${mem.reps} reps` : ''}{mem.reps && mem.weight ? ' · ' : ''}{mem.weight ? `${mem.weight} kg` : ''}
                          </p>
                        )}

                        {ex.notes && (
                          <p className="text-[11px] text-[#64748B] bg-[#FAFBFD] px-4 py-2 border-b border-[#F1F5F9]">{ex.notes}</p>
                        )}

                        <div className="px-4 pb-3">
                          <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-2 pt-2.5 pb-1 px-1">
                            <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">Sér.</p>
                            <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">Reps</p>
                            <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">Charge</p>
                            <p className="text-[9px] font-semibold text-[#94A3B8] uppercase text-center">OK</p>
                          </div>
                          {exSets.map((s, i) => (
                            <div key={i} className="grid grid-cols-[32px_1fr_1fr_40px] gap-2 items-center py-1.5 rounded-lg px-1 transition-colors"
                              style={s.done ? { background: s.isPR ? '#FFFBEB' : 'var(--brand-bg)' } : {}}>
                              <span className="text-center text-[12px] font-semibold" style={{ color: s.done ? 'var(--brand)' : '#64748B' }}>{i + 1}</span>
                              <input type="number" min={0} value={s.reps}
                                onChange={e => updateSet(ex.id, i, 'reps', e.target.value)}
                                disabled={s.done || !sessionStarted}
                                className="text-center text-[13px] font-semibold border rounded-xl px-2 py-2 focus:outline-none disabled:opacity-60 transition-colors"
                                style={{ borderColor: s.done ? 'var(--brand-border)' : '#E2E8F0', background: s.done ? 'var(--brand-bg)' : '#F8FAFB' }}
                                placeholder="—" />
                              <input type="number" min={0} step={0.5} value={s.weight}
                                onChange={e => updateSet(ex.id, i, 'weight', e.target.value)}
                                disabled={s.done || !sessionStarted}
                                className="text-center text-[13px] font-semibold border rounded-xl px-2 py-2 focus:outline-none disabled:opacity-60 transition-colors"
                                style={{ borderColor: s.done ? 'var(--brand-border)' : '#E2E8F0', background: s.done ? 'var(--brand-bg)' : '#F8FAFB' }}
                                placeholder="—" />
                              {s.done ? (
                                <div className="flex items-center justify-center">
                                  {s.isPR ? <span className="text-[16px]">🏆</span> : <CheckCircle2 size={20} color="var(--brand)" />}
                                </div>
                              ) : (
                                <button disabled={!sessionStarted}
                                  onClick={() => completeSet(ex.id, i, ex.rest_seconds, ex.exercise_name)}
                                  className="flex items-center justify-center w-8 h-8 rounded-xl border-2 mx-auto transition-colors disabled:opacity-30"
                                  style={{ borderColor: 'var(--brand)' }}>
                                  <CheckCircle2 size={16} color="var(--brand)" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {sessionStarted && (
                  <button onClick={handleFinish} disabled={saving || !allSetsDone}
                    className="w-full mt-5 py-4 rounded-2xl text-[15px] font-bold text-white transition-opacity disabled:opacity-40 shadow-lg"
                    style={{ background: 'var(--brand)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
                    {saving ? 'Enregistrement…' : allSetsDone ? 'Terminer la séance ✓'
                      : `${data.day.exercises.reduce((n, ex) => n + (sets[ex.id] ?? []).filter(s => s.done).length, 0)} / ${data.day.exercises.reduce((n, ex) => n + (sets[ex.id]?.length ?? 0), 0)} séries complétées`}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
