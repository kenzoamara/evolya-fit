'use client'

import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { toast } from 'sonner'

type Props = {
  token: string
  coachView?: boolean
  weightEntries: { date: string; weight_kg: number }[]
  workoutLogs: { log_date: string; completed: boolean }[]
  checkins: { week_number: number; year: number; submitted_at: string; energy_score: number | null }[]
  habitLogs: { habit_id: string; date: string; completed: boolean }[]
  nutritionLogs: { date: string; calories: number | null }[]
}

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}

function SectionTitle({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[18px]">{emoji}</span>
      <p className="text-[14px] font-bold text-[#0D1F3C]">{label}</p>
    </div>
  )
}

export function StatistiquesView({ token, coachView = false, weightEntries, workoutLogs, checkins, habitLogs, nutritionLogs }: Props) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [weightInput, setWeightInput] = useState('')
  const [weightDate, setWeightDate] = useState(todayStr)
  const [savingWeight, setSavingWeight] = useState(false)
  const [localEntries, setLocalEntries] = useState(weightEntries)

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault()
    const kg = parseFloat(weightInput)
    if (isNaN(kg) || kg < 20 || kg > 300) { toast.error('Poids invalide (entre 20 et 300 kg).'); return }
    setSavingWeight(true)
    const res = await fetch('/api/client/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, weight_kg: kg, date: weightDate }),
    })
    const data = await res.json()
    setSavingWeight(false)
    if (data.error) { toast.error(data.error); return }
    setLocalEntries(prev => {
      const without = prev.filter(e => e.date !== weightDate)
      return [...without, { date: weightDate, weight_kg: kg }].sort((a, b) => a.date.localeCompare(b.date))
    })
    setWeightInput('')
    toast.success('Poids enregistré !')
  }

  // ─── Poids ────────────────────────────────────────────────────────────────
  const weightData = useMemo(() => {
    const last12 = localEntries.slice(-12)
    return last12.map(e => ({ label: fmt(e.date), poids: e.weight_kg }))
  }, [weightEntries])

  const weightMin = weightData.length > 0 ? Math.min(...weightData.map(d => d.poids)) : 0
  const weightMax = weightData.length > 0 ? Math.max(...weightData.map(d => d.poids)) : 100
  const weightFirst = weightData[0]?.poids
  const weightLast = weightData[weightData.length - 1]?.poids
  const weightDelta = weightFirst && weightLast ? +(weightLast - weightFirst).toFixed(1) : null

  // ─── Séances ──────────────────────────────────────────────────────────────
  const workoutWeekData = useMemo(() => {
    const weeks: { label: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const monday = new Date()
      const day = monday.getDay() || 7
      monday.setDate(monday.getDate() - (day - 1) - i * 7)
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      const ms = monday.toISOString().split('T')[0]
      const ss = sunday.toISOString().split('T')[0]
      const count = workoutLogs.filter(l => l.log_date >= ms && l.log_date <= ss && l.completed).length
      weeks.push({ label: `${monday.getDate()} ${MONTHS_FR[monday.getMonth()]}`, count })
    }
    return weeks
  }, [workoutLogs])

  const totalWorkouts = workoutLogs.filter(l => l.completed).length

  // ─── Habitudes ────────────────────────────────────────────────────────────
  const habitWeekData = useMemo(() => {
    const days: { label: string; pct: number }[] = []
    const uniqueHabits = Array.from(new Set(habitLogs.map(l => l.habit_id)))
    if (uniqueHabits.length === 0) return days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const done = uniqueHabits.filter(hid => habitLogs.some(l => l.habit_id === hid && l.date === ds && l.completed)).length
      days.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), pct: Math.round((done / uniqueHabits.length) * 100) })
    }
    return days
  }, [habitLogs])

  // ─── Calories ────────────────────────────────────────────────────────────
  const calData = useMemo(() => {
    const byDate: Record<string, number> = {}
    for (const l of nutritionLogs) {
      if (l.calories) byDate[l.date] = (byDate[l.date] ?? 0) + l.calories
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, calories]) => ({ label: fmt(date), calories }))
  }, [nutritionLogs])

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-4xl w-full mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: '#FFF1F2' }}>📊</div>
        <h1 className="text-[20px] font-bold text-[#0D1F3C]">Statistiques</h1>
      </div>

      {/* Weight entry form */}
      {!coachView && (
        <form onSubmit={handleAddWeight} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-6">
          <p className="text-[13px] font-semibold text-[#0D1F3C] mb-3">Enregistrer mon poids</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="70.5"
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#F43F5E]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Date</label>
              <input
                type="date"
                value={weightDate}
                onChange={e => setWeightDate(e.target.value)}
                max={todayStr}
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#F43F5E]"
              />
            </div>
            <button
              type="submit"
              disabled={savingWeight || !weightInput}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-opacity disabled:opacity-40 shrink-0"
              style={{ background: '#F43F5E' }}
            >
              {savingWeight ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Poids */}
        {weightData.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <SectionTitle emoji="⚖️" label="Évolution du poids" />
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-[11px] text-[#94A3B8]">Actuel</p>
                <p className="text-[20px] font-bold text-[#0D1F3C]">{weightLast} kg</p>
              </div>
              {weightDelta !== null && (
                <div className="px-2.5 py-1 rounded-lg text-[12px] font-semibold" style={{
                  background: weightDelta <= 0 ? '#F0FDF4' : '#FFF1F2',
                  color: weightDelta <= 0 ? '#22C55E' : '#F43F5E',
                }}>
                  {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[weightMin - 2, weightMax + 2]} tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}kg`} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Poids']} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
                <Line type="monotone" dataKey="poids" stroke="#F43F5E" strokeWidth={2.5} dot={{ fill: '#F43F5E', r: 3, strokeWidth: 0 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Séances */}
        {totalWorkouts > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <SectionTitle emoji="💪" label="Séances par semaine" />
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[20px] font-bold text-[#0D1F3C]">{totalWorkouts}</p>
              <p className="text-[12px] text-[#94A3B8]">séances au total</p>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={workoutWeekData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}`, 'Séances']} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Habitudes */}
        {habitWeekData.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <SectionTitle emoji="💤" label="Habitudes cette semaine" />
            <div className="grid grid-cols-7 gap-1">
              {habitWeekData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-lg transition-all"
                    style={{
                      height: 60,
                      background: '#FAF5FF',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: `${d.pct}%`,
                        background: '#A855F7',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-[#94A3B8] capitalize">{d.label}</p>
                  <p className="text-[10px] font-bold" style={{ color: d.pct === 100 ? '#A855F7' : '#64748B' }}>{d.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calories */}
        {calData.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <SectionTitle emoji="🥗" label="Calories (14 derniers jours)" />
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={calData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} kcal`, '']} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
                <Bar dataKey="calories" fill="#22C55E" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Empty state */}
        {weightData.length === 0 && totalWorkouts === 0 && habitWeekData.length === 0 && calData.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl">📊</span>
            <p className="text-[16px] font-semibold text-[#0D1F3C] mt-4 mb-1">Pas encore de données</p>
            <p className="text-[13px] text-[#94A3B8]">Commence à utiliser Sport, Nutrition et Habitudes pour voir tes progrès ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}
