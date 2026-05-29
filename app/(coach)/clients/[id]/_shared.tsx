// Shared types, utilities and micro-components used across client detail tabs

import type { Client, Session, Checkin, BilanSnapshot } from '@/types/database'
import { formatDate, getWeekNumber } from '@/lib/utils'

export { formatDate, getWeekNumber }
export type { Client, Session, Checkin, BilanSnapshot }

export type ClientNote = {
  id: string
  content: string
  is_private: boolean
  author_role?: string
  created_at: string
}

export type WeightEntry = { date: string; weight_kg: number }
export type BodyMeasurement = {
  date: string
  neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null
  l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null
  r_forearm_cm: number | null; waist_cm: number | null; hips_cm: number | null
  l_thigh_cm: number | null; r_thigh_cm: number | null
}
export type SleepEntry = { date: string; hours: number }
export type PerformanceEntry = { date: string; label: string; value: number; unit: string; notes?: string | null }
export type WorkoutLog = {
  id: string
  log_date: string
  completed: boolean
  programme_days: { day_number: number; title: string | null } | null
  programme_assignments: { programmes: { title: string } | null } | null
  exercise_logs: { set_number: number; reps_done: number | null; weight_kg: number | null; programme_day_exercises: { exercise_name: string } | null }[]
}

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const AVATAR_COLORS = [
  { bg: '#EEF9F3', text: '#4E9B6F' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#F5F3FF', text: '#7C3AED' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#F0FDFA', text: '#0D9488' },
  { bg: '#FEF2F2', text: '#DC2626' },
]
export function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export const GOAL_LABELS: Record<string, string> = {
  perte_de_poids:  'Perte de poids',
  prise_de_masse:  'Prise de masse',
  performance:     'Performance sportive',
  remise_en_forme: 'Remise en forme',
  autre:           'Autre',
}
export const ACTIVITY_LABELS: Record<string, string> = {
  sedentaire:       'Sédentaire',
  leger:            'Légèrement actif',
  moderement_actif: 'Modérément actif',
  tres_actif:       'Très actif',
}

export function calcBmiCoach(h: number | null, w: number | null) {
  if (!h || !w) return null
  const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10
  if (bmi < 18.5) return { value: bmi, color: '#3B82F6' }
  if (bmi < 25)   return { value: bmi, color: '#4E9B6F' }
  if (bmi < 30)   return { value: bmi, color: '#D97706' }
  return { value: bmi, color: '#EF4444' }
}

export function calcAgeCoach(birth: string | null): number | null {
  if (!birth) return null
  const d = new Date(birth)
  const t = new Date()
  let age = t.getFullYear() - d.getFullYear()
  const m = t.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--
  return age
}

// ─── Micro-components ─────────────────────────────────────────────────────────

export function StatChip({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 sm:p-3.5 ${highlight ? 'bg-brand-bg border-brand/20' : 'bg-white border-[#E2E8F0]'}`}>
      <p className={`text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide mb-1 leading-tight ${highlight ? 'text-brand' : 'text-[#94A3B8]'}`}>{label}</p>
      <p className={`text-[20px] sm:text-[26px] font-bold leading-none ${highlight ? 'text-brand' : 'text-[#0D1F3C]'}`}>{value}</p>
      {sub && <p className="text-[9px] sm:text-[11px] text-[#94A3B8] mt-0.5 sm:mt-1">{sub}</p>}
    </div>
  )
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-[#F8FAFB] last:border-0">
      <span className="text-xs text-[#94A3B8]">{label}</span>
      <span className="text-xs font-medium text-[#0D1F3C] text-right">{value}</span>
    </div>
  )
}

export function ProfileChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: color ?? '#0D1F3C' }}>{value}</span>
    </div>
  )
}
