'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, getWeekNumber } from '@/lib/utils'
import type { Client, Objective, Checkin, Session } from '@/types/database'

type WeightEntry = { date: string; weight_kg: number }
type BodyMeasurement = { date: string; neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null; l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null; r_forearm_cm: number | null; waist_cm: number | null; hips_cm: number | null; l_thigh_cm: number | null; r_thigh_cm: number | null }
type SleepEntry = { id: string; date: string; hours: number }
type PerformanceEntry = { id: string; date: string; label: string; value: number; unit: string; notes?: string | null }
type Section = 'sport' | 'nutrition' | 'habitudes'

type Props = {
  client: Client
  sessions: Session[]
  objectives: Objective[]
  checkins: Checkin[]
  weightEntries: WeightEntry[]
  bodyMeasurements: BodyMeasurement[]
  sleepEntries: SleepEntry[]
  performanceEntries: PerformanceEntry[]
  token: string
}

const GOAL_LABELS: Record<string, string> = {
  perte_de_poids: 'Perte de poids', prise_de_masse: 'Prise de masse',
  performance: 'Performance sportive', remise_en_forme: 'Remise en forme',
  endurance: 'Endurance', mobilite: 'Mobilité & souplesse', autre: 'Autre',
}
const ACTIVITY_LABELS: Record<string, string> = {
  sedentaire: 'Sédentaire', leger: 'Légèrement actif',
  moderement_actif: 'Modérément actif', tres_actif: 'Très actif',
}
const UNIT_OPTIONS = ['kg', 'min', 'reps', 'km', 'sec', 'm', 'lbs']
const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return { week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7), year: d.getUTCFullYear() }
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcBmi(h: number | null, w: number | null) {
  if (!h || !w) return null
  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10
  if (bmi < 18.5) return { value: bmi, label: 'Insuffisance pondérale', color: '#3B82F6' }
  if (bmi < 25) return { value: bmi, label: 'Poids normal', color: '#4E9B6F' }
  if (bmi < 30) return { value: bmi, label: 'Surpoids', color: '#D97706' }
  return { value: bmi, label: 'Obésité', color: '#EF4444' }
}

const inputCls = 'w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] placeholder:text-[#94A3B8] focus:outline-none focus:border-[var(--brand)] transition-colors'

function KpiCard({ emoji, label, value, sub, color }: { emoji?: string; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      {emoji && <span className="text-lg leading-none block mb-1">{emoji}</span>}
      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[22px] font-bold leading-tight" style={{ color: color ?? '#0D1F3C' }}>{value}</p>
      {sub && <p className="text-[11px] text-[#94A3B8] mt-0.5">{sub}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-[#F8FAFB] last:border-0">
      <span className="text-xs text-[#94A3B8]">{label}</span>
      <span className="text-xs font-medium text-[#0D1F3C] text-right">{value}</span>
    </div>
  )
}

function SectionCard({ title, emoji, children }: { title: string; emoji?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3 flex items-center gap-1.5">
        {emoji && <span>{emoji}</span>}{title}
      </p>
      {children}
    </div>
  )
}

// ─── Performance grouped view ────────────────────────────────────────────────

function PerfGrouped({ entries }: { entries: PerformanceEntry[] }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, PerformanceEntry[]>()
    for (const e of entries) {
      const list = map.get(e.label) ?? []
      list.push(e)
      map.set(e.label, list)
    }
    return Array.from(map.entries()).map(([label, items]) => {
      const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
      const best = sorted.reduce((max, e) => e.value > max.value ? e : max, sorted[0])
      const latest = sorted[sorted.length - 1]
      const delta = sorted.length >= 2 ? +(latest.value - sorted[0].value).toFixed(2) : null
      return { label, sorted, best, latest, delta }
    })
  }, [entries])

  return (
    <div className="divide-y divide-[#F8FAFB]">
      {groups.map(({ label, sorted, best, latest, delta }) => {
        const isOpen = openLabel === label
        return (
          <div key={label}>
            <button
              onClick={() => setOpenLabel(isOpen ? null : label)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFBFC] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-[#0D1F3C]">{label}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#94A3B8]">{sorted.length} entrée{sorted.length > 1 ? 's' : ''}</span>
                  {delta !== null && delta !== 0 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${delta > 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                      {delta > 0 ? '+' : ''}{delta} {latest.unit}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] text-[#94A3B8] font-medium">PR</p>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--brand)' }}>{best.value} {best.unit}</p>
                </div>
                <span className="text-[#CBD5E1] text-[12px]">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="bg-[#FAFBFC] border-t border-[#F1F5F9] px-4 py-2 space-y-0">
                {[...sorted].reverse().map((e, i) => (
                  <div key={e.id ?? i} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-[11px] text-[#64748B]">
                      {new Date(e.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      {e.notes && <span className="text-[10px] text-[#94A3B8] hidden sm:inline">{e.notes}</span>}
                      <span className={`text-[13px] font-bold ${e.value === best.value ? '' : 'text-[#0D1F3C]'}`}
                        style={e.value === best.value ? { color: 'var(--brand)' } : {}}>
                        {e.value} {e.unit}
                      </span>
                      {e.value === best.value && (
                        <span className="text-[9px] font-bold bg-[var(--brand-bg)] text-[var(--brand)] px-1.5 py-0.5 rounded-full">PR</span>
                      )}
                    </div>
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

// ─── Sport ───────────────────────────────────────────────────────────────────

function SportView({
  client, sessions, objectives, performanceEntries, clientId, token,
}: {
  client: Client; sessions: Session[]; objectives: Objective[]
  performanceEntries: PerformanceEntry[]; clientId: string; token: string
}) {
  const router = useRouter()
  const today = todayStr()
  const past = sessions.filter(s => s.session_date <= today)
  const next = sessions.filter(s => s.session_date > today).sort((a, b) => a.session_date.localeCompare(b.session_date))[0]
  const attended = past.filter(s => s.attendance === 'attended').length
  const marked = past.filter(s => s.attendance !== null)
  const rate = marked.length > 0 ? Math.round((attended / marked.length) * 100) : null
  const recent = [...past].sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 5)
  const activeObj = objectives.filter(o => o.status !== 'done').length
  const doneObj = objectives.filter(o => o.status === 'done').length

  // Performance form
  const [showPerfForm, setShowPerfForm] = useState(false)
  const [perfLabel, setPerfLabel] = useState('')
  const [perfValue, setPerfValue] = useState('')
  const [perfUnit, setPerfUnit] = useState('kg')
  const [perfNotes, setPerfNotes] = useState('')
  const [perfSaving, setPerfSaving] = useState(false)
  const [localPerfs, setLocalPerfs] = useState<PerformanceEntry[]>(performanceEntries)

  async function savePerfEntry() {
    if (!perfLabel.trim() || !perfValue) return
    setPerfSaving(true)
    const res = await fetch('/api/metabolic/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, token, date: today, label: perfLabel.trim(), value: perfValue, unit: perfUnit, notes: perfNotes || undefined }),
    })
    const data = await res.json()
    setPerfSaving(false)
    if (data.error) { toast.error(data.error); return }
    toast.success('Performance enregistrée !')
    setLocalPerfs(prev => [{ id: Date.now().toString(), date: today, label: perfLabel.trim(), value: parseFloat(perfValue), unit: perfUnit, notes: perfNotes || null }, ...prev])
    setPerfLabel(''); setPerfValue(''); setPerfUnit('kg'); setPerfNotes('')
    setShowPerfForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard emoji="⚡" label="Séances totales" value={String(sessions.length)} sub={`${past.length} passées`} />
        <KpiCard emoji="✅" label="Taux de présence" value={rate !== null ? `${rate}%` : '—'} sub={marked.length > 0 ? `${attended} présences` : 'Non marquée'} />
        <KpiCard emoji="📅" label="Prochaine séance" value={next ? formatDate(next.session_date) : '—'} sub={next?.session_time?.replace(':', 'h')} />
        <KpiCard emoji="🎯" label="Objectifs actifs" value={String(activeObj)} sub={`${doneObj} accompli${doneObj > 1 ? 's' : ''}`} />
      </div>

      {(client.main_goal || client.activity_level) && (
        <SectionCard title="Mon profil sportif" emoji="🏅">
          <div className="divide-y divide-[#F8FAFB]">
            {client.main_goal && <Row label="Objectif" value={GOAL_LABELS[client.main_goal] ?? client.main_goal} />}
            {client.activity_level && <Row label="Niveau d'activité" value={ACTIVITY_LABELS[client.activity_level] ?? client.activity_level} />}
          </div>
        </SectionCard>
      )}

      {/* Performances */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-1.5">
            <span>🏆</span> Mes performances
          </p>
          {!showPerfForm && (
            <button onClick={() => setShowPerfForm(true)}
              className="text-[12px] font-semibold px-3 py-1 rounded-lg btn-brand transition-colors">
              + Ajouter
            </button>
          )}
        </div>

        {showPerfForm && (
          <div className="px-4 pb-4 space-y-3 border-t border-[#F1F5F9] pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">Exercice</label>
                <input type="text" value={perfLabel} onChange={e => setPerfLabel(e.target.value)}
                  placeholder="Ex : Squat, Course 5 km…" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">Valeur</label>
                <div className="flex gap-1">
                  <input type="number" value={perfValue} onChange={e => setPerfValue(e.target.value)}
                    placeholder="80" min={0} step={0.1} className={inputCls} />
                  <select value={perfUnit} onChange={e => setPerfUnit(e.target.value)}
                    className="px-2 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] focus:outline-none focus:border-[var(--brand)]">
                    {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#64748B] mb-1">Note <span className="font-normal text-[#94A3B8]">(optionnel)</span></label>
              <input type="text" value={perfNotes} onChange={e => setPerfNotes(e.target.value)}
                placeholder="Contexte, conditions…" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={savePerfEntry} disabled={perfSaving || !perfLabel.trim() || !perfValue}
                className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
                {perfSaving ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
              <button onClick={() => { setShowPerfForm(false); setPerfLabel(''); setPerfValue(''); setPerfUnit('kg'); setPerfNotes('') }}
                className="px-4 py-2 text-[13px] text-[#64748B] hover:text-[#0D1F3C] transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        {localPerfs.length > 0 ? (
          <PerfGrouped entries={localPerfs} />
        ) : !showPerfForm ? (
          <p className="text-[12px] text-[#94A3B8] text-center py-6 px-4">Aucune performance enregistrée.<br />Commence par ajouter ton premier record !</p>
        ) : null}
      </div>

      {recent.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2 flex items-center gap-1.5">
            <span>📋</span> Dernières séances
          </p>
          <div className="divide-y divide-[#F8FAFB]">
            {recent.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[12px] font-medium text-[#0D1F3C] shrink-0">{formatDate(s.session_date)}</span>
                  {s.session_time && <span className="text-[11px] text-[#94A3B8]">{s.session_time.replace(':', 'h')}</span>}
                  {s.notes && <span className="text-[11px] text-[#94A3B8] truncate hidden sm:block">{s.notes.slice(0, 50)}{s.notes.length > 50 ? '…' : ''}</span>}
                </div>
                {s.attendance === 'attended' && <span className="text-[10px] font-semibold bg-[#EEF9F3] text-[#4E9B6F] px-2 py-0.5 rounded-full shrink-0">✓ Présent</span>}
                {s.attendance === 'missed' && <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full shrink-0">✗ Absent</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

// Module-level so it's stable (no useMemo dep issue)
const MEAS_FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
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

// Returns the latest non-null value for a given measurement field across all entries
function latestMeasVal(entries: BodyMeasurement[], key: keyof BodyMeasurement): string {
  for (let i = entries.length - 1; i >= 0; i--) {
    const v = entries[i][key]
    if (v != null) return String(v)
  }
  return ''
}

function NutritionView({
  client, weightEntries, bodyMeasurements, clientId, token,
}: {
  client: Client; weightEntries: WeightEntry[]; bodyMeasurements: BodyMeasurement[]
  clientId: string; token: string
}) {
  const router = useRouter()
  const bmi = calcBmi(client.height_cm, client.weight_kg)
  const today = todayStr()

  const weightData = useMemo(() =>
    weightEntries.map(w => ({
      date: new Date(w.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      poids: w.weight_kg,
    })), [weightEntries])

  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].poids : client.weight_kg
  const weightDelta = weightData.length >= 2 ? +(weightData[weightData.length - 1].poids - weightData[0].poids).toFixed(1) : null

  // Check if weight already logged this week
  const now = new Date()
  const currentISOWeek = getISOWeek(now)
  const weightThisWeek = weightEntries.find(w => {
    const isoW = getISOWeek(new Date(w.date + 'T00:00'))
    return isoW.week === currentISOWeek.week && isoW.year === currentISOWeek.year
  })

  // Date of last measurement entry
  const lastMeasDate = bodyMeasurements.length > 0 ? bodyMeasurements[bodyMeasurements.length - 1].date : null

  // Per-field: latest non-null value + first non-null value across ALL entries
  // (fixes the issue where a new entry with only some fields would hide older field values)
  const latestByField = useMemo(() => {
    const latest: Record<string, { value: number; date: string } | null> = {}
    const first: Record<string, number | null> = {}
    for (const f of MEAS_FIELDS) {
      const k = f.key as string
      latest[k] = null
      first[k] = null
      // Find first non-null (ascending order)
      for (let i = 0; i < bodyMeasurements.length; i++) {
        const v = bodyMeasurements[i][f.key] as number | null
        if (v != null) { first[k] = v; break }
      }
      // Find latest non-null (from end)
      for (let i = bodyMeasurements.length - 1; i >= 0; i--) {
        const v = bodyMeasurements[i][f.key] as number | null
        if (v != null) { latest[k] = { value: v, date: bodyMeasurements[i].date }; break }
      }
    }
    return { latest, first }
  }, [bodyMeasurements])

  const hasMeasData = MEAS_FIELDS.some(f => latestByField.latest[f.key as string] !== null)

  // Weight form — pre-fill with latest actual entry, NOT the static profile weight
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightVal, setWeightVal] = useState(
    weightThisWeek
      ? String(weightThisWeek.weight_kg)
      : weightEntries.length > 0
        ? String(weightEntries[weightEntries.length - 1].weight_kg)
        : client.weight_kg ? String(client.weight_kg) : ''
  )
  const [weightSaving, setWeightSaving] = useState(false)

  // Measurements form — pre-filled with latest known value per field
  const [showMeasForm, setShowMeasForm] = useState(false)
  const [neck,     setNeck]     = useState(() => latestMeasVal(bodyMeasurements, 'neck_cm'))
  const [shoulders,setShoulders]= useState(() => latestMeasVal(bodyMeasurements, 'shoulders_cm'))
  const [chest,    setChest]    = useState(() => latestMeasVal(bodyMeasurements, 'chest_cm'))
  const [waist,    setWaist]    = useState(() => latestMeasVal(bodyMeasurements, 'waist_cm'))
  const [hips,     setHips]     = useState(() => latestMeasVal(bodyMeasurements, 'hips_cm'))
  const [lBicep,   setLBicep]   = useState(() => latestMeasVal(bodyMeasurements, 'l_bicep_cm'))
  const [rBicep,   setRBicep]   = useState(() => latestMeasVal(bodyMeasurements, 'r_bicep_cm'))
  const [lForearm, setLForearm] = useState(() => latestMeasVal(bodyMeasurements, 'l_forearm_cm'))
  const [rForearm, setRForearm] = useState(() => latestMeasVal(bodyMeasurements, 'r_forearm_cm'))
  const [lThigh,   setLThigh]   = useState(() => latestMeasVal(bodyMeasurements, 'l_thigh_cm'))
  const [rThigh,   setRThigh]   = useState(() => latestMeasVal(bodyMeasurements, 'r_thigh_cm'))
  const [measSaving, setMeasSaving] = useState(false)

  async function saveWeight() {
    if (!weightVal) return
    setWeightSaving(true)
    const res = await fetch('/api/metabolic/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, token, date: today, weight_kg: weightVal }),
    })
    const data = await res.json()
    setWeightSaving(false)
    if (data.error) { toast.error(data.error); return }
    toast.success('Pesée enregistrée !')
    setShowWeightForm(false)
    router.refresh()
  }

  async function saveMeasurements() {
    setMeasSaving(true)
    const body: Record<string, unknown> = { client_id: clientId, token, date: today }
    if (neck)      body.neck_cm      = neck
    if (shoulders) body.shoulders_cm = shoulders
    if (chest)     body.chest_cm     = chest
    if (waist)     body.waist_cm     = waist
    if (hips)      body.hips_cm      = hips
    if (lBicep)    body.l_bicep_cm   = lBicep
    if (rBicep)    body.r_bicep_cm   = rBicep
    if (lForearm)  body.l_forearm_cm = lForearm
    if (rForearm)  body.r_forearm_cm = rForearm
    if (lThigh)    body.l_thigh_cm   = lThigh
    if (rThigh)    body.r_thigh_cm   = rThigh
    const res = await fetch('/api/metabolic/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setMeasSaving(false)
    if (data.error) { toast.error(data.error); return }
    toast.success('Mensurations enregistrées !')
    setShowMeasForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard emoji="⚖️" label="Poids" value={currentWeight ? `${currentWeight} kg` : '—'} sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg depuis le début` : ''} />
        <KpiCard emoji="📏" label="Taille" value={client.height_cm ? `${client.height_cm} cm` : '—'} sub={client.gender === 'homme' ? 'Homme' : client.gender === 'femme' ? 'Femme' : ''} />
        {bmi && <KpiCard emoji="📊" label="IMC" value={String(bmi.value)} sub={bmi.label} color={bmi.color} />}
        {client.daily_calories_estimated && <KpiCard emoji="🔥" label="Calories / jour" value={`${client.daily_calories_estimated}`} sub="kcal estimées" />}
      </div>

      {/* Weight chart + weekly form */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C] flex items-center gap-1.5">📈 Évolution du poids</p>
            {weightDelta !== null && (
              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${weightDelta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : weightDelta > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {weightDelta > 0 ? '+' : ''}{weightDelta} kg
              </span>
            )}
          </div>
          {weightThisWeek ? (
            <div className="text-right">
              <p className="text-[11px] text-[#4E9B6F] font-semibold">✓ {weightThisWeek.weight_kg} kg cette semaine</p>
              <button onClick={() => setShowWeightForm(v => !v)} className="text-[11px] text-[#94A3B8] hover:text-brand underline">Corriger</button>
            </div>
          ) : (
            <button onClick={() => setShowWeightForm(v => !v)}
              className="text-[12px] font-semibold px-3 py-1 rounded-lg btn-brand transition-colors shrink-0">
              ⚖️ Peser
            </button>
          )}
        </div>

        {showWeightForm && (
          <div className="mb-4 p-3 bg-[#F8FAFB] rounded-lg space-y-2 border border-[#E2E8F0]">
            <label className="block text-[11px] font-medium text-[#64748B]">Mon poids aujourd'hui (kg)</label>
            <div className="flex gap-2">
              <input type="number" value={weightVal} onChange={e => setWeightVal(e.target.value)}
                placeholder="70" min={30} max={300} step={0.1}
                className="flex-1 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[var(--brand)]" />
              <button onClick={saveWeight} disabled={weightSaving || !weightVal}
                className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
                {weightSaving ? '…' : 'OK'}
              </button>
              <button onClick={() => setShowWeightForm(false)} className="px-3 py-2 text-[12px] text-[#64748B] hover:text-[#0D1F3C]">✕</button>
            </div>
          </div>
        )}

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
            {weightData.length === 0 ? 'Aucune pesée — enregistre ton poids chaque semaine pour voir ta courbe' : 'Il faut au minimum 2 pesées pour afficher la courbe'}
          </p>
        )}
      </div>

      {/* Mensurations */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C] flex items-center gap-1.5">📐 Mensurations</p>
            {lastMeasDate && (
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Dernière mesure : {new Date(lastMeasDate + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowMeasForm(v => !v)}
            className="text-[12px] font-semibold px-3 py-1 rounded-lg btn-brand transition-colors shrink-0"
          >
            {showMeasForm ? 'Annuler' : hasMeasData ? '+ Nouvelle mesure' : '+ Saisir'}
          </button>
        </div>

        {showMeasForm && (
          <div className="px-5 pb-4 pt-2 space-y-3 border-t border-[#F1F5F9]">
            <p className="text-[11px] text-[#94A3B8]">
              Les valeurs pré-remplies sont tes dernières mesures. Modifie uniquement celles qui ont changé — une nouvelle entrée datée d'aujourd'hui sera créée sans effacer les précédentes.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: 'Cou',              val: neck,      set: setNeck },
                { label: 'Épaules',          val: shoulders, set: setShoulders },
                { label: 'Poitrine',         val: chest,     set: setChest },
                { label: 'Tour de taille',   val: waist,     set: setWaist },
                { label: 'Tour de hanches',  val: hips,      set: setHips },
                { label: 'Biceps gauche',    val: lBicep,    set: setLBicep },
                { label: 'Biceps droit',     val: rBicep,    set: setRBicep },
                { label: 'Avant-bras G',     val: lForearm,  set: setLForearm },
                { label: 'Avant-bras D',     val: rForearm,  set: setRForearm },
                { label: 'Cuisse gauche',    val: lThigh,    set: setLThigh },
                { label: 'Cuisse droite',    val: rThigh,    set: setRThigh },
              ] as { label: string; val: string; set: (v: string) => void }[]).map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-[11px] font-medium text-[#64748B] mb-1">{label} <span className="font-normal text-[#94A3B8]">(cm)</span></label>
                  <input type="number" value={val} onChange={e => set(e.target.value)}
                    placeholder="—" min={0} max={300} step={0.1}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[var(--brand)]" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveMeasurements}
                disabled={measSaving || (!neck && !shoulders && !chest && !waist && !hips && !lBicep && !rBicep && !lForearm && !rForearm && !lThigh && !rThigh)}
                className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
                {measSaving ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
              <button onClick={() => setShowMeasForm(false)} className="px-4 py-2 text-[13px] text-[#64748B] hover:text-[#0D1F3C]">Annuler</button>
            </div>
          </div>
        )}

        {/* Display: per-field latest non-null value — even if different entries */}
        {hasMeasData ? (
          <div className="divide-y divide-[#F8FAFB] px-5 pb-4">
            {MEAS_FIELDS.map(({ key, label }) => {
              const latest = latestByField.latest[key as string]
              const firstVal = latestByField.first[key as string]
              if (!latest) return null
              const delta = (firstVal !== null && firstVal !== latest.value) ? +(latest.value - firstVal).toFixed(1) : null
              return (
                <div key={key as string} className="flex items-center gap-3 py-2.5 last:pb-0">
                  <span className="text-[12px] text-[#64748B] flex-1">{label}</span>
                  <span className="text-[13px] font-semibold text-[#0D1F3C] tabular-nums">{latest.value} cm</span>
                  {delta !== null && delta !== 0 && (
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${delta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                      {delta > 0 ? '+' : ''}{delta} cm
                    </span>
                  )}
                  {delta === 0 && <span className="text-[11px] text-[#CBD5E1]">stable</span>}
                </div>
              )
            })}
          </div>
        ) : !showMeasForm ? (
          <p className="text-[12px] text-[#94A3B8] text-center py-6 px-4">Aucune mensuration — saisis-les chaque mois pour suivre l'évolution</p>
        ) : null}
      </div>

      {client.dietary_habits && (
        <SectionCard title="Mon alimentation" emoji="🥗">
          <div className="divide-y divide-[#F8FAFB]">
            <div className="py-2.5 last:pb-0">
              <p className="text-xs text-[#94A3B8] mb-1">Habitudes</p>
              <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.dietary_habits}</p>
            </div>
            {client.daily_calories_estimated && <Row label="Calories / jour" value={`${client.daily_calories_estimated} kcal`} />}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Habitudes ────────────────────────────────────────────────────────────────

function HabiudesView({
  client, checkins, sleepEntries, clientId, token,
}: {
  client: Client; checkins: Checkin[]
  sleepEntries: SleepEntry[]; clientId: string; token: string
}) {
  const router = useRouter()
  const now = new Date()
  const today = todayStr()
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()
  const hasCheckinThisWeek = checkins.some(c => c.week_number === currentWeek && c.year === currentYear)

  // Sleep stats
  const sleepToday = sleepEntries.find(s => s.date === today)
  const sleep7d = sleepEntries.filter(s => {
    const d = new Date(s.date + 'T00:00')
    return (now.getTime() - d.getTime()) / 86400000 <= 7
  })
  const avgSleep7d = sleep7d.length > 0
    ? +(sleep7d.reduce((acc, s) => acc + s.hours, 0) / sleep7d.length).toFixed(1) : null

  // Sleep form
  const [showSleepForm, setShowSleepForm] = useState(false)
  const [sleepHours, setSleepHours] = useState(sleepToday ? String(sleepToday.hours) : '')
  const [sleepSaving, setSleepSaving] = useState(false)

  async function saveSleep() {
    if (!sleepHours) return
    setSleepSaving(true)
    const res = await fetch('/api/metabolic/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, token, date: today, hours: sleepHours }),
    })
    const data = await res.json()
    setSleepSaving(false)
    if (data.error) { toast.error(data.error); return }
    toast.success('Sommeil enregistré !')
    setShowSleepForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard emoji="✅" label="Check-ins" value={String(checkins.length)}
          sub={hasCheckinThisWeek ? 'Cette semaine ✓' : 'En attente'}
          color={hasCheckinThisWeek ? '#4E9B6F' : undefined} />
        <KpiCard emoji="🌙" label="Sommeil moy." value={avgSleep7d !== null ? `${avgSleep7d}h` : client.avg_sleep_hours ? `${client.avg_sleep_hours}h` : '—'} sub="7 derniers jours" />
      </div>

      {/* Sleep chart + daily form */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C] flex items-center gap-1.5">🌙 Mon sommeil</p>
            <p className="text-[11px] text-[#94A3B8]">14 derniers jours</p>
          </div>
          {sleepToday ? (
            <div className="text-right">
              <p className="text-[11px] text-[#4E9B6F] font-semibold">✓ {sleepToday.hours}h cette nuit</p>
              <button onClick={() => setShowSleepForm(v => !v)} className="text-[11px] text-[#94A3B8] hover:text-brand underline">Modifier</button>
            </div>
          ) : (
            <button onClick={() => setShowSleepForm(v => !v)}
              className="text-[12px] font-semibold px-3 py-1 rounded-lg btn-brand transition-colors shrink-0">
              🌙 Cette nuit
            </button>
          )}
        </div>

        {showSleepForm && (
          <div className="mb-4 p-3 bg-[#F8FAFB] rounded-lg space-y-2 border border-[#E2E8F0]">
            <label className="block text-[11px] font-medium text-[#64748B]">Heures de sommeil cette nuit</label>
            <div className="flex gap-2">
              <input type="number" value={sleepHours} onChange={e => setSleepHours(e.target.value)}
                placeholder="7.5" min={0.5} max={24} step={0.5}
                className="flex-1 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[var(--brand)]" />
              <button onClick={saveSleep} disabled={sleepSaving || !sleepHours}
                className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
                {sleepSaving ? '…' : 'OK'}
              </button>
              <button onClick={() => setShowSleepForm(false)} className="px-3 py-2 text-[12px] text-[#64748B] hover:text-[#0D1F3C]">✕</button>
            </div>
          </div>
        )}

      </div>

      {checkins.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2 flex items-center gap-1.5">
            <span>✅</span> Mes derniers check-ins
          </p>
          <div className="divide-y divide-[#F8FAFB]">
            {checkins.slice(0, 5).map(c => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-brand bg-brand-bg px-2 py-0.5 rounded-full">S{c.week_number}</span>
                  <span className="text-[11px] text-[#94A3B8]">{new Date(c.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
                {c.q1_answer ? (
                  <p className="text-[12px] text-[#0D1F3C] leading-relaxed line-clamp-2">{c.q1_answer}</p>
                ) : (
                  <p className="text-[12px] text-[#94A3B8] italic">Aucune réponse.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {client.injuries && (
        <SectionCard title="Ma santé" emoji="💚">
          <div className="py-2.5">
            <p className="text-xs text-[#94A3B8] mb-1">Blessures / contraintes</p>
            <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.injuries}</p>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ClientProgresView({
  client, sessions, objectives, checkins,
  weightEntries, bodyMeasurements, sleepEntries, performanceEntries, token,
}: Props) {
  const [section, setSection] = useState<Section>('sport')

  const TABS: { key: Section; label: string }[] = [
    { key: 'sport',      label: '⚡ Sport' },
    { key: 'nutrition',  label: '⚖️ Corps' },
    { key: 'habitudes',  label: '🌱 Habitudes' },
  ]

  return (
    <div>
      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${section === key ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
            {label}
          </button>
        ))}
      </div>

      {section === 'sport' && (
        <SportView client={client} sessions={sessions} objectives={objectives}
          performanceEntries={performanceEntries} clientId={client.id} token={token} />
      )}
      {section === 'nutrition' && (
        <NutritionView client={client} weightEntries={weightEntries} bodyMeasurements={bodyMeasurements}
          clientId={client.id} token={token} />
      )}
      {section === 'habitudes' && (
        <HabiudesView client={client} checkins={checkins} sleepEntries={sleepEntries}
          clientId={client.id} token={token} />
      )}
    </div>
  )
}
