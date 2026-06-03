'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PointsChart } from '@/components/ui/points-chart'
import { StatsCard } from '@/components/ui/stats-card-1'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/radar-chart'
import type { BodyMeasurement } from './page'

// ─── Mapping mensurations ──────────────────────────────────────────────────────
const MEASUREMENT_KEYS = [
  'neck_cm', 'shoulders_cm', 'chest_cm', 'waist_cm', 'hips_cm',
  'l_bicep_cm', 'r_bicep_cm', 'l_forearm_cm', 'r_forearm_cm',
  'l_thigh_cm', 'r_thigh_cm',
] as const

const MEASUREMENT_LABELS: Record<typeof MEASUREMENT_KEYS[number], string> = {
  neck_cm:       'Cou',
  shoulders_cm:  'Épaules',
  chest_cm:      'Poitrine',
  waist_cm:      'Taille',
  hips_cm:       'Hanches',
  l_bicep_cm:    'Biceps G',
  r_bicep_cm:    'Biceps D',
  l_forearm_cm:  'Avant-bras G',
  r_forearm_cm:  'Avant-bras D',
  l_thigh_cm:    'Cuisse G',
  r_thigh_cm:    'Cuisse D',
}

type Props = {
  token: string
  coachView?: boolean
  weightEntries: { date: string; weight_kg: number }[]
  workoutLogs: { log_date: string; completed: boolean }[]
  checkins: { week_number: number; year: number; submitted_at: string; energy_score: number | null }[]
  habitLogs: { habit_id: string; date: string; completed: boolean }[]
  nutritionLogs: { date: string; calories: number | null }[]
  bodyMeasurements?: BodyMeasurement[]
}

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function fmt(iso: string) {
  const d = new Date(iso + 'T00:00:00')
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

// ─── Radar mensurations ────────────────────────────────────────────────────────
function MensurationsRadar({ measurements }: { measurements: BodyMeasurement[] }) {
  // current = la plus récente (index 0 car ORDER DESC), previous = index 1
  const current  = measurements[0]
  const previous = measurements[1] ?? null

  // Garder uniquement les axes où current a une valeur
  const axes = MEASUREMENT_KEYS.filter(k => current[k] != null)
  if (axes.length < 3) return null

  const radarData = axes.map(k => ({
    axis: MEASUREMENT_LABELS[k],
    actuel:    current[k] ?? 0,
    précédent: previous?.[k] ?? undefined,
  }))

  const chartConfig: ChartConfig = {
    actuel:    { label: 'Actuel',    color: '#4E9B6F' },
    précédent: { label: 'Précédent', color: '#94A3B8' },
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 md:col-span-2">
      <div className="flex items-center justify-between mb-1">
        <SectionTitle emoji="📐" label="Mensurations — toile d'araignée" />
        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-[#4E9B6F] inline-block" />
            {fmt(current.date)}
          </span>
          {previous && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-[#CBD5E1] inline-block border-dashed border" style={{ borderStyle: 'dashed' }} />
              {fmt(previous.date)}
            </span>
          )}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="mx-auto max-h-[300px]">
        <RadarChart data={radarData}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="axis" />}
          />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
          />
          <PolarGrid strokeDasharray="3 3" stroke="#E2E8F0" />

          {/* Couche précédente — pointillée grise */}
          {previous && (
            <Radar
              name="précédent"
              dataKey="précédent"
              stroke="#CBD5E1"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              fill="rgba(148,163,184,0.08)"
            />
          )}

          {/* Couche actuelle — verte avec glow */}
          <Radar
            name="actuel"
            dataKey="actuel"
            stroke="#4E9B6F"
            strokeWidth={2}
            fill="rgba(78,155,111,0.12)"
            filter="url(#glow-green)"
          />

          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </RadarChart>
      </ChartContainer>

      {/* Tableau récapitulatif discret */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-[#F1F5F9]">
        {axes.map(k => {
          const curr = current[k]!
          const prev = previous?.[k]
          const delta = prev != null ? +(curr - prev).toFixed(1) : null
          return (
            <div key={k} className="flex items-center justify-between">
              <span className="text-[11px] text-[#94A3B8]">{MEASUREMENT_LABELS[k]}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-[#0D1F3C]">{curr} cm</span>
                {delta !== null && delta !== 0 && (
                  <span className="text-[10px] font-medium" style={{ color: delta < 0 ? '#4E9B6F' : '#EF4444' }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
export function StatistiquesView({
  token, coachView = false,
  weightEntries, workoutLogs, checkins, habitLogs, nutritionLogs,
  bodyMeasurements = [],
}: Props) {
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
  }, [localEntries])

  const weightFirst = weightData[0]?.poids
  const weightLast  = weightData[weightData.length - 1]?.poids
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

  const hasData = weightData.length > 0 || totalWorkouts > 0 || habitWeekData.length > 0 || calData.length > 0 || bodyMeasurements.length > 0

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-4xl w-full mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: 'var(--brand-bg)' }}>📊</div>
        <h1 className="text-[20px] font-bold text-[#0D1F3C]">Statistiques</h1>
      </div>

      {/* Formulaire saisie poids */}
      {!coachView && (
        <form onSubmit={handleAddWeight} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-6">
          <p className="text-[13px] font-semibold text-[#0D1F3C] mb-3">Enregistrer mon poids</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Poids (kg)</label>
              <input type="number" step="0.1" min="20" max="300" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="70.5"
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[var(--brand)]" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={weightDate} onChange={e => setWeightDate(e.target.value)} max={todayStr}
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[var(--brand)]" />
            </div>
            <button type="submit" disabled={savingWeight || !weightInput}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-opacity disabled:opacity-40 shrink-0"
              style={{ background: 'var(--brand)' }}>
              {savingWeight ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Poids */}
        {weightData.length > 0 && (
          <PointsChart
            title="⚖️ Évolution du poids"
            data={weightData.map((d, i, arr) => ({
              date: d.label,
              total: d.poids,
              change: i === 0 ? 0 : +(d.poids - arr[i - 1].poids).toFixed(1),
            }))}
            formatValue={(v) => `${v} kg`}
            height={160}
            headerRight={
              weightLast != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#0D1F3C]">{weightLast} kg</span>
                  {weightDelta !== null && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{
                      background: weightDelta <= 0 ? '#F0FDF4' : '#FEF2F2',
                      color: weightDelta <= 0 ? '#16A34A' : '#DC2626',
                    }}>
                      {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                    </span>
                  )}
                </div>
              ) : undefined
            }
          />
        )}

        {/* Séances */}
        {totalWorkouts > 0 && (
          <StatsCard
            title="💪 Séances par semaine"
            currentValue={totalWorkouts}
            description="séances complétées au total"
            chartData={(() => {
              const max = Math.max(...workoutWeekData.map(w => w.count), 1)
              return workoutWeekData.map((w) => ({
                name: w.label,
                value: Math.round((w.count / max) * 100),
              }))
            })()}
            highlightedBarColor="bg-[#4E9B6F]"
          />
        )}

        {/* Habitudes */}
        {habitWeekData.length > 0 && (
          <StatsCard
            title="💤 Habitudes cette semaine"
            currentValue={Math.round(habitWeekData.reduce((s, d) => s + d.pct, 0) / habitWeekData.length)}
            valuePostfix="%"
            description="taux de complétion moyen (7 jours)"
            chartData={habitWeekData.map((d) => ({
              name: d.label,
              value: d.pct,
              color: d.pct === 100 ? 'bg-[#4E9B6F]' : d.pct >= 50 ? 'bg-[#86C6A1]' : 'bg-[#eef6f1]',
            }))}
            highlightedBarColor="bg-[#4E9B6F]"
          />
        )}

        {/* Calories */}
        {calData.length > 0 && (
          <PointsChart
            title="🥗 Calories — 14 derniers jours"
            data={calData.map((d, i, arr) => ({
              date: d.label,
              total: d.calories,
              change: i === 0 ? 0 : d.calories - arr[i - 1].calories,
            }))}
            formatValue={(v) => `${Math.round(v)} kcal`}
            height={150}
          />
        )}

        {/* Radar mensurations — pleine largeur */}
        {bodyMeasurements.length > 0 && (
          <MensurationsRadar measurements={bodyMeasurements} />
        )}

        {/* Empty state */}
        {!hasData && (
          <div className="col-span-2 text-center py-12">
            <span className="text-5xl">📊</span>
            <p className="text-[16px] font-semibold text-[#0D1F3C] mt-4 mb-1">Pas encore de données</p>
            <p className="text-[13px] text-[#94A3B8]">Commence à utiliser Sport, Nutrition et Habitudes pour voir tes progrès ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}
