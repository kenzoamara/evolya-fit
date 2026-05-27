'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Client, MetabolicConfig, WeightEntry, CalorieEntry, BodyMeasurement } from '@/types/database'

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_FR_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const MEASURE_FIELDS: { key: keyof BodyMeasurement; label: string; side?: 'L' | 'R' | null }[] = [
  { key: 'neck_cm',        label: 'Cou' },
  { key: 'shoulders_cm',   label: 'Épaules' },
  { key: 'chest_cm',       label: 'Poitrine' },
  { key: 'waist_cm',       label: 'Taille' },
  { key: 'hips_cm',        label: 'Hanches' },
  { key: 'l_bicep_cm',     label: 'Bicep G' },
  { key: 'r_bicep_cm',     label: 'Bicep D' },
  { key: 'l_forearm_cm',   label: 'Avant-bras G' },
  { key: 'r_forearm_cm',   label: 'Avant-bras D' },
  { key: 'l_thigh_cm',     label: 'Cuisse G' },
  { key: 'r_thigh_cm',     label: 'Cuisse D' },
]

const C = {
  green: '#4E9B6F',
  greenLight: '#EEF9F3',
  charcoal: '#0D1F3C',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFB',
  amber: '#D4A853',
  red: '#C0392B',
}

type Section = 'poids' | 'calories' | 'corpulence'

type Props = {
  client: Client
  isCoach: boolean
  token?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function todayKey() {
  return toDateKey(new Date())
}

function roundCal(v: number) {
  return Math.round(v / 100) * 100
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtDateShort(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'
      }`}
    >
      {label}
    </button>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs text-[#64748B] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? C.charcoal }}>{value}</p>
      {sub && <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── POIDS section ───────────────────────────────────────────────────────────

function PoidsSection({
  entries, config, clientId, token, isCoach,
  onSaved,
}: {
  entries: WeightEntry[]
  config: MetabolicConfig | null
  clientId: string
  token?: string
  isCoach: boolean
  onSaved: () => void
}) {
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = todayKey()
  const todayEntry = entries.find(e => e.date === today)
  const todayDow = new Date().getDay()
  const isWeighDay = config ? todayDow === config.weigh_in_day : false

  // Check si déjà pesé cette semaine
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1))
  const weekStartKey = toDateKey(weekStart)
  const weighedThisWeek = entries.some(e => e.date >= weekStartKey)

  const chartData = [...entries].reverse().slice(-16).map(e => ({
    date: fmtDateShort(e.date),
    poids: Number(e.weight_kg),
  }))

  const latest = entries[0]
  const previous = entries[1]
  const delta = latest && previous ? Number(latest.weight_kg) - Number(previous.weight_kg) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(weight)
    if (isNaN(val) || val < 20 || val > 300) { setError('Poids invalide (20–300 kg)'); return }
    setSaving(true); setError(null)
    const res = await fetch('/api/metabolic/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, date: today, weight_kg: val, token }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    setWeight('')
    onSaved()
  }

  return (
    <div className="space-y-4">
      {/* Saisie */}
      {!isCoach && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#0D1F3C] mb-3">
            Saisie du poids
            {config && (
              <span className="text-xs font-normal text-[#64748B] ml-2">
                — jour de pesée : {DAYS_FR[config.weigh_in_day]}
              </span>
            )}
          </p>

          {todayEntry ? (
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <span className="text-[#4E9B6F] font-semibold text-base">{todayEntry.weight_kg} kg</span>
              <span>enregistré aujourd&apos;hui</span>
            </div>
          ) : weighedThisWeek ? (
            <p className="text-sm text-[#64748B]">Déjà pesé cette semaine.</p>
          ) : (
            <>
              {!isWeighDay && config && (
                <p className="text-xs text-[#D4A853] mb-3">
                  Aujourd&apos;hui n&apos;est pas votre jour de pesée ({DAYS_FR[config.weigh_in_day]}), mais vous pouvez tout de même saisir.
                </p>
              )}
              {!config && (
                <p className="text-xs text-[#D4A853] mb-3">Votre coach n&apos;a pas encore configuré votre suivi.</p>
              )}
              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Poids (kg)</label>
                  <input
                    type="number" step="0.1" min="20" max="300"
                    value={weight} onChange={e => setWeight(e.target.value)}
                    placeholder="72.5" required
                    className="w-28 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]"
                  />
                </div>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </form>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </>
          )}
        </div>
      )}

      {/* Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Dernier poids" value={`${latest.weight_kg} kg`} sub={fmtDate(latest.date)} color={C.green} />
          {delta !== null && (
            <StatCard
              label="Variation"
              value={`${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`}
              sub="vs pesée précédente"
              color={delta === 0 ? C.muted : delta < 0 ? C.green : C.red}
            />
          )}
          {config?.starting_weight && (
            <StatCard
              label="Depuis le départ"
              value={`${(Number(latest.weight_kg) - config.starting_weight).toFixed(1)} kg`}
              sub={`Départ : ${config.starting_weight} kg`}
              color={C.muted}
            />
          )}
        </div>
      )}

      {/* Graphique */}
      {chartData.length >= 2 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">Évolution du poids</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(v) => [`${v} kg`, 'Poids']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="poids" stroke={C.green} strokeWidth={2} fill="url(#weightGrad)" dot={{ r: 3, fill: C.green }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-[#F8F8F6] border border-[#E2E8F0] rounded-xl p-6 text-center text-sm text-[#64748B]">
          Aucune pesée enregistrée pour l&apos;instant.
        </div>
      ) : null}
    </div>
  )
}

// ─── CALORIES section ────────────────────────────────────────────────────────

function CaloriesSection({
  entries, config, clientId, token, isCoach,
  onSaved,
}: {
  entries: CalorieEntry[]
  config: MetabolicConfig | null
  clientId: string
  token?: string
  isCoach: boolean
  onSaved: () => void
}) {
  const [cal, setCal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = todayKey()
  const todayEntry = entries.find(e => e.date === today)
  const goal = config?.calorie_goal ?? 2000

  // Calendrier du mois courant
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay() // 0=dim
  const calMap: Record<string, number> = {}
  entries.forEach(e => { calMap[e.date] = e.calories })

  // Histogramme : répartition calorique
  const bands = [
    { label: '< 1000', min: 0,    max: 999  },
    { label: '1000–1399', min: 1000, max: 1399 },
    { label: '1400–1799', min: 1400, max: 1799 },
    { label: '1800–2199', min: 1800, max: 2199 },
    { label: '2200–2599', min: 2200, max: 2599 },
    { label: '≥ 2600',   min: 2600, max: Infinity },
  ]
  const histData = bands.map(b => ({
    label: b.label,
    jours: entries.filter(e => e.calories >= b.min && e.calories <= b.max).length,
    isGoal: goal >= b.min && goal <= b.max,
  }))

  // Stats
  const vals = entries.map(e => e.calories)
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  const max = vals.length ? Math.max(...vals) : null
  const min = vals.length ? Math.min(...vals) : null
  const deviation = avg != null ? avg - goal : null

  function calColor(c: number) {
    const ratio = c / goal
    if (ratio < 0.7) return '#5B8DD9'
    if (ratio <= 1.1) return C.green
    if (ratio <= 1.3) return C.amber
    return C.red
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(cal)
    if (isNaN(val) || val < 0 || val > 10000) { setError('Valeur invalide'); return }
    setSaving(true); setError(null)
    const res = await fetch('/api/metabolic/calories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, date: today, calories: val, token }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    const data = await res.json()
    setCal('')
    onSaved()
    if (data.calories !== roundCal(val)) {
      // feedback arrondi
    }
  }

  // Grille d'offset pour le 1er jour du mois (lundi = 0)
  const offset = firstDow === 0 ? 6 : firstDow - 1

  return (
    <div className="space-y-4">
      {/* Saisie */}
      {!isCoach && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#0D1F3C] mb-1">
            Calories d&apos;aujourd&apos;hui
            {config && <span className="text-xs font-normal text-[#64748B] ml-2">— objectif : {goal} kcal</span>}
          </p>
          <p className="text-xs text-[#94A3B8] mb-3">Arrondi automatique à la centaine la plus proche</p>

          {todayEntry ? (
            <div className="flex items-center gap-3">
              <span className="text-[#4E9B6F] font-bold text-lg">{todayEntry.calories} kcal</span>
              <span className="text-sm text-[#64748B]">enregistré aujourd&apos;hui</span>
              {config && (
                <span className="text-xs" style={{ color: calColor(todayEntry.calories) }}>
                  ({todayEntry.calories >= goal * 0.9 && todayEntry.calories <= goal * 1.1 ? 'dans l\'objectif' : todayEntry.calories < goal ? `−${goal - todayEntry.calories} kcal` : `+${todayEntry.calories - goal} kcal`})
                </span>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Calories consommées</label>
                  <input
                    type="number" min="0" max="10000"
                    value={cal} onChange={e => setCal(e.target.value)}
                    placeholder="1823" required
                    className="w-32 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]"
                  />
                </div>
                {cal && !isNaN(parseFloat(cal)) && (
                  <span className="text-xs text-[#64748B] pb-2.5">→ {roundCal(parseFloat(cal))} kcal</span>
                )}
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </form>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </>
          )}
        </div>
      )}

      {/* Calendrier mensuel */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">
          {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-center text-[9px] text-[#94A3B8] font-medium pb-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(offset).fill(null).map((_, i) => <div key={`off-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const kcal = calMap[dateStr]
            const isToday = dateStr === today
            const isFuture = dateStr > today
            let bg = '#F1F5F9'
            if (kcal != null) bg = calColor(kcal)
            return (
              <div key={day} title={kcal ? `${kcal} kcal` : undefined}
                className="aspect-square rounded flex items-center justify-center text-[10px] font-medium transition-all"
                style={{
                  background: isFuture ? 'transparent' : bg,
                  color: kcal != null ? 'white' : '#94A3B8',
                  border: isToday ? `2px solid ${C.green}` : '2px solid transparent',
                  opacity: isFuture ? 0.3 : 1,
                }}>
                {day}
              </div>
            )
          })}
        </div>
        {/* Légende */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {[
            { color: '#5B8DD9', label: '< objectif' },
            { color: C.green,   label: 'dans objectif' },
            { color: C.amber,   label: 'léger excès' },
            { color: C.red,     label: 'excès' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span className="text-[10px] text-[#64748B]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {avg != null && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Moyenne" value={`${avg} kcal`} color={calColor(avg)} />
          <StatCard label="Objectif" value={`${goal} kcal`} color={C.muted} />
          <StatCard
            label="Écart moyen"
            value={deviation != null ? `${deviation > 0 ? '+' : ''}${deviation} kcal` : '—'}
            sub={deviation != null ? `${Math.round((avg / goal) * 100)}% de l'objectif` : undefined}
            color={deviation != null ? (Math.abs(deviation) < goal * 0.1 ? C.green : deviation < 0 ? '#5B8DD9' : C.red) : C.muted}
          />
          <StatCard
            label="Max / Min"
            value={`${max} / ${min}`}
            sub="kcal (30 derniers jours)"
            color={C.muted}
          />
        </div>
      )}

      {/* Histogramme */}
      {entries.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">Répartition calorique</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={histData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v} jour${Number(v) > 1 ? 's' : ''}`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="jours" radius={[4, 4, 0, 0]}>
                {histData.map((entry, i) => (
                  <Cell key={i} fill={entry.isGoal ? C.green : '#D4E6D5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-[#94A3B8] mt-1 text-center">La zone verte correspond à votre plage objectif</p>
        </div>
      )}

      {entries.length === 0 && (
        <div className="bg-[#F8F8F6] border border-[#E2E8F0] rounded-xl p-6 text-center text-sm text-[#64748B]">
          Aucune calorie enregistrée pour l&apos;instant.
        </div>
      )}
    </div>
  )
}

// ─── Body silhouette ────────────────────────────────────────────────────────

const BODY_LINE_Y: Record<string, number> = {
  neck_cm:      33,
  shoulders_cm: 44,
  chest_cm:     64,
  l_bicep_cm:   74,
  r_bicep_cm:   74,
  l_forearm_cm: 90,
  r_forearm_cm: 90,
  waist_cm:     100,
  hips_cm:      126,
  l_thigh_cm:   165,
  r_thigh_cm:   165,
}

const BODY_LINE_X: Record<string, [number, number]> = {
  neck_cm:      [38, 62],
  shoulders_cm: [6, 94],
  chest_cm:     [28, 72],
  l_bicep_cm:   [2, 24],
  r_bicep_cm:   [76, 98],
  l_forearm_cm: [2, 26],
  r_forearm_cm: [74, 98],
  waist_cm:     [28, 72],
  hips_cm:      [22, 78],
  l_thigh_cm:   [22, 40],
  r_thigh_cm:   [60, 78],
}

function BodySilhouette({ active }: { active: string | null }) {
  return (
    <svg
      viewBox="0 0 100 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block', minHeight: '180px' }}
    >
      <g fill="none" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Tête */}
        <ellipse cx="50" cy="14" rx="10" ry="12" />
        {/* Cou */}
        <line x1="45" y1="26" x2="45" y2="34" />
        <line x1="55" y1="26" x2="55" y2="34" />
        {/* Pentes épaules */}
        <line x1="45" y1="34" x2="16" y2="46" />
        <line x1="55" y1="34" x2="84" y2="46" />
        {/* Bras gauche */}
        <path d="M 16,46 Q 10,50 10,62 L 10,98 Q 10,106 16,108 L 22,108 Q 28,106 28,98 L 26,56 Q 24,48 16,46 Z" />
        {/* Bras droit */}
        <path d="M 84,46 Q 90,50 90,62 L 90,98 Q 90,106 84,108 L 78,108 Q 72,106 72,98 L 74,56 Q 76,48 84,46 Z" />
        {/* Torse gauche */}
        <path d="M 28,50 Q 27,84 28,100 Q 27,112 25,124" />
        {/* Torse droit */}
        <path d="M 72,50 Q 73,84 72,100 Q 73,112 75,124" />
        {/* Jambe gauche */}
        <path d="M 25,124 L 24,228 L 38,228 L 38,130" />
        {/* Jambe droite */}
        <path d="M 75,124 L 76,228 L 62,228 L 62,130" />
        {/* Entrejambe */}
        <path d="M 38,130 Q 50,136 62,130" />
      </g>

      {/* Lignes de mesure */}
      {Object.entries(BODY_LINE_Y).map(([key, y]) => {
        const xr = BODY_LINE_X[key]
        if (!xr) return null
        const isActive = active === key
        const [x1, x2] = xr
        return (
          <g key={key}>
            <line
              x1={x1} y1={y} x2={x2} y2={y}
              stroke={isActive ? '#4E9B6F' : '#D0D0CA'}
              strokeWidth={isActive ? 2 : 1}
              strokeLinecap="round"
              strokeDasharray={isActive ? undefined : '2 3'}
            />
            {isActive && (
              <>
                <circle cx={x1} cy={y} r="2.5" fill="#4E9B6F" />
                <circle cx={x2} cy={y} r="2.5" fill="#4E9B6F" />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── CORPULENCE section ──────────────────────────────────────────────────────

function CorpulenceSection({
  entries, clientId, token, isCoach,
  onSaved,
}: {
  entries: BodyMeasurement[]
  clientId: string
  token?: string
  isCoach: boolean
  onSaved: () => void
}) {
  const today = todayKey()
  const lastEntry = entries[0]

  // Autoriser nouvelle saisie si aucune entrée ce mois-ci
  const nowMonth = today.slice(0, 7)
  const hasEntryThisMonth = lastEntry?.date.slice(0, 7) === nowMonth

  const [form, setForm] = useState<Record<string, string>>({})
  const [side, setSide] = useState<'left' | 'right'>('left')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<string | null>(null)

  function setField(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch('/api/metabolic/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, date: today, token, ...form }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    setForm({})
    onSaved()
  }

  // Graphique : evolution des 3 mesures principales sur les 6 dernières entrées
  const chartData = [...entries].reverse().slice(-6).map(e => ({
    date: fmtDateShort(e.date),
    Taille: e.waist_cm ?? null,
    Poitrine: e.chest_cm ?? null,
    Hanches: e.hips_cm ?? null,
  }))

  const CHART_COLORS = { Taille: C.green, Poitrine: '#5B8DD9', Hanches: C.amber }

  // Colonnes mesures filtrées par side (L/R)
  const leftFields = MEASURE_FIELDS.filter(f => !f.key.startsWith('r_'))
  const rightFields = MEASURE_FIELDS.filter(f => !f.key.startsWith('l_') || f.key === 'l_bicep_cm' || f.key === 'l_forearm_cm' || f.key === 'l_thigh_cm')
    .map(f => ({ ...f, key: f.key.replace('l_', 'r_') as keyof BodyMeasurement, label: f.label.replace(' G', ' D') }))

  const displayFields = side === 'left' ? leftFields : MEASURE_FIELDS.filter(f => f.key.startsWith('r_'))

  return (
    <div className="space-y-4">
      {/* Card : saisie + bonhomme (toujours visible) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex gap-4 items-start">

          {/* Gauche : formulaire ou statut */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0D1F3C] mb-3">
              Mensurations du mois
              <span className="text-xs font-normal text-[#64748B] ml-2">— 1 fois par mois</span>
            </p>

            {isCoach ? (
              <p className="text-sm text-[#64748B]">
                {lastEntry
                  ? <>Dernière saisie : <span className="font-medium text-[#0D1F3C]">{fmtDate(lastEntry.date)}</span></>
                  : 'Aucune mensuration enregistrée.'}
              </p>
            ) : hasEntryThisMonth ? (
              <p className="text-sm text-[#64748B]">
                Mesures enregistrées ce mois-ci.
                <span className="text-xs text-[#94A3B8] ml-2">({fmtDate(lastEntry.date)})</span>
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Switcher côté */}
                <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 w-fit">
                  {(['left', 'right'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setSide(s)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        side === s ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B]'
                      }`}>
                      {s === 'left' ? 'Gauche' : 'Droite'}
                    </button>
                  ))}
                </div>

                {/* Champs */}
                <div className="space-y-1">
                  {MEASURE_FIELDS.map(f => {
                    const isRight = f.key.startsWith('r_')
                    const isLeft = f.key.startsWith('l_')
                    const isSide = isLeft || isRight
                    if (isSide && ((side === 'left' && isRight) || (side === 'right' && isLeft))) return null
                    return (
                      <div key={String(f.key)} className="flex items-center gap-2 py-0.5">
                        <label
                          htmlFor={`mf-${String(f.key)}`}
                          className="text-xs text-[#64748B] w-24 flex-shrink-0 cursor-pointer"
                        >
                          {f.label}
                        </label>
                        <div className="flex items-center border border-[#E2E8F0] rounded-lg focus-within:border-[#4E9B6F] transition-colors overflow-hidden">
                          <input
                            id={`mf-${String(f.key)}`}
                            type="number" step="0.1" min="0" max="200"
                            value={form[String(f.key)] ?? ''}
                            onChange={ev => setField(String(f.key), ev.target.value)}
                            onFocus={() => setActiveField(String(f.key))}
                            onBlur={() => setActiveField(null)}
                            placeholder="—"
                            className="w-14 px-2 py-1.5 text-sm text-right bg-transparent focus:outline-none"
                          />
                          <span className="text-xs text-[#94A3B8] pr-2">cm</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                  {saving ? 'Enregistrement...' : 'Sauvegarder les mensurations'}
                </button>
              </form>
            )}
          </div>

          {/* Droite : bonhomme — toujours affiché */}
          <div className="w-20 sm:w-28 flex-shrink-0">
            <BodySilhouette active={activeField} />
          </div>
        </div>
      </div>

      {/* Dernière mesure vs précédente */}
      {lastEntry && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 overflow-x-auto">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">
            Dernières mesures — {fmtDate(lastEntry.date)}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#94A3B8] uppercase">
                <th className="text-left pb-2 font-medium">Mesure</th>
                <th className="text-right pb-2 font-medium">{fmtDate(lastEntry.date)}</th>
                {entries[1] && <th className="text-right pb-2 font-medium">{fmtDate(entries[1].date)}</th>}
                {entries[1] && <th className="text-right pb-2 font-medium">Écart</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {MEASURE_FIELDS.map(f => {
                const curr = lastEntry[f.key] as number | null
                const prev = entries[1] ? (entries[1][f.key] as number | null) : null
                if (curr == null && prev == null) return null
                const diff = curr != null && prev != null ? curr - prev : null
                return (
                  <tr key={String(f.key)}>
                    <td className="py-1.5 text-[#64748B]">{f.label}</td>
                    <td className="py-1.5 text-right font-medium text-[#0D1F3C]">{curr != null ? `${curr} cm` : '—'}</td>
                    {entries[1] && <td className="py-1.5 text-right text-[#94A3B8]">{prev != null ? `${prev} cm` : '—'}</td>}
                    {entries[1] && (
                      <td className="py-1.5 text-right text-xs font-medium" style={{
                        color: diff == null ? '#94A3B8' : diff < 0 ? C.green : diff > 0 ? C.red : C.muted
                      }}>
                        {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Graphique taille/poitrine/hanches */}
      {chartData.length >= 2 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-4">Évolution — Taille · Poitrine · Hanches</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v, name) => [`${v} cm`, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              {(Object.keys(CHART_COLORS) as Array<keyof typeof CHART_COLORS>).map(k => (
                <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[k]} strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[k] }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {entries.length === 0 && (
        <div className="bg-[#F8F8F6] border border-[#E2E8F0] rounded-xl p-6 text-center text-sm text-[#64748B]">
          Aucune mensuration enregistrée pour l&apos;instant.
        </div>
      )}
    </div>
  )
}

// ─── Coach config panel ──────────────────────────────────────────────────────

function CoachConfigPanel({
  config, clientId, onSaved,
}: {
  config: MetabolicConfig | null
  clientId: string
  onSaved: () => void
}) {
  const [calGoal, setCalGoal] = useState(String(config?.calorie_goal ?? 2000))
  const [weighDay, setWeighDay] = useState(String(config?.weigh_in_day ?? 1))
  const [startW, setStartW] = useState(String(config?.starting_weight ?? ''))
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/metabolic/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        calorie_goal: parseInt(calGoal),
        weigh_in_day: parseInt(weighDay),
        starting_weight: startW ? parseFloat(startW) : null,
      }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="bg-[#F8F8F6] border border-[#E2E8F0] rounded-xl p-4 mb-4">
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Configuration — visible uniquement par vous</p>
      <form onSubmit={handleSave} className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-[#64748B] mb-1">Objectif calorique (kcal/j)</label>
          <input type="number" min="500" max="8000" value={calGoal} onChange={e => setCalGoal(e.target.value)}
            className="w-28 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]" />
        </div>
        <div>
          <label className="block text-xs text-[#64748B] mb-1">Jour de pesée</label>
          <select value={weighDay} onChange={e => setWeighDay(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]">
            {DAYS_FR.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#64748B] mb-1">Poids de départ (kg)</label>
          <input type="number" step="0.1" min="20" max="300" value={startW} onChange={e => setStartW(e.target.value)}
            placeholder="—"
            className="w-24 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]" />
        </div>
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
          {saving ? '...' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MetabolicShell({ client, isCoach, token }: Props) {
  const [section, setSection] = useState<Section>('poids')
  const [config, setConfig] = useState<MetabolicConfig | null>(null)
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [calories, setCalories] = useState<CalorieEntry[]>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)

  const qs = token ? `client_id=${client.id}&token=${token}` : `client_id=${client.id}`

  const loadData = useCallback(async () => {
    const [cfgRes, wRes, cRes, mRes] = await Promise.all([
      fetch(`/api/metabolic/config?${qs}`).then(r => r.json()),
      fetch(`/api/metabolic/weight?${qs}`).then(r => r.json()),
      fetch(`/api/metabolic/calories?${qs}`).then(r => r.json()),
      fetch(`/api/metabolic/measurements?${qs}`).then(r => r.json()),
    ])
    setConfig(cfgRes ?? null)
    setWeights(Array.isArray(wRes) ? wRes : [])
    setCalories(Array.isArray(cRes) ? cRes : [])
    setMeasurements(Array.isArray(mRes) ? mRes : [])
    setLoading(false)
  }, [qs])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-5 h-5 border-2 border-[#E2E8F0] border-t-[#4E9B6F] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Config coach */}
      {isCoach && (
        <CoachConfigPanel config={config} clientId={client.id} onSaved={loadData} />
      )}

      {/* Switcher section */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 w-fit">
        {([
          { key: 'poids',      label: 'Poids' },
          { key: 'calories',   label: 'Calories' },
          { key: 'corpulence', label: 'Mensuration' },
        ] as { key: Section; label: string }[]).map(({ key, label }) => (
          <SectionTab key={key} label={label} active={section === key} onClick={() => setSection(key)} />
        ))}
      </div>

      {/* Contenu */}
      {section === 'poids' && (
        <PoidsSection entries={weights} config={config} clientId={client.id} token={token} isCoach={isCoach} onSaved={loadData} />
      )}
      {section === 'calories' && (
        <CaloriesSection entries={calories} config={config} clientId={client.id} token={token} isCoach={isCoach} onSaved={loadData} />
      )}
      {section === 'corpulence' && (
        <CorpulenceSection entries={measurements} clientId={client.id} token={token} isCoach={isCoach} onSaved={loadData} />
      )}
    </div>
  )
}
