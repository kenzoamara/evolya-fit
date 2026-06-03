'use client'

import { useState, useMemo } from 'react'
import { Users, CheckSquare, AlertTriangle, Calendar, Activity, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PageHeader } from '@/components/coach/page-header'
import Link from 'next/link'
import type { DangerAthlete, ProgrammeCompletion, AthleteStagnation, AnalyticsKPIs } from './page'

type ClientRow      = { id: string; full_name: string; status: string; last_checkin_at: string | null }
type CheckinRow     = { client_id: string; week_number: number; year: number; energy_score: number | null }
type SessionRow     = { client_id: string; attendance: string; session_date: string }
type WeightRow      = { client_id: string; date: string; weight_kg: number }
type MeasurementRow = { client_id: string; date: string; neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null; waist_cm: number | null; hips_cm: number | null; l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null; r_forearm_cm: number | null; l_thigh_cm: number | null; r_thigh_cm: number | null }
type Week           = { week: number; year: number; label: string; mondayIso: string }

type Props = {
  clients: ClientRow[]
  activeCount: number
  weekCheckinCount: number
  inactiveCount: number
  monthSessionCount: number
  checkins: CheckinRow[]
  sessions: SessionRow[]
  weightEntries: WeightRow[]
  bodyMeasurements: MeasurementRow[]
  totalCheckinCount: number
  globalAttendanceRate: number | null
  weeks: Week[]
  // analytics
  analyticsKPIs: AnalyticsKPIs
  dangerAthletes: DangerAthlete[]
  programmeCompletions: ProgrammeCompletion[]
  athleteStagnation: AthleteStagnation[]
}

const METRIC_LABELS: Record<keyof Omit<MeasurementRow, 'client_id' | 'date'>, string> = {
  neck_cm:      'Cou',
  shoulders_cm: 'Épaules',
  chest_cm:     'Poitrine',
  waist_cm:     'Tour de taille',
  hips_cm:      'Tour de hanches',
  l_bicep_cm:   'Biceps gauche',
  r_bicep_cm:   'Biceps droit',
  l_forearm_cm: 'Avant-bras gauche',
  r_forearm_cm: 'Avant-bras droit',
  l_thigh_cm:   'Cuisse gauche',
  r_thigh_cm:   'Cuisse droite',
}
const METRIC_KEYS = Object.keys(METRIC_LABELS) as (keyof Omit<MeasurementRow, 'client_id' | 'date'>)[]

function firstName(full: string) { return full.split(' ')[0] }

function daysAgo(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
}

function KpiCard({ label, value, sub, icon: Icon, accent, unit }: {
  label: string; value: number; sub: string
  icon: React.ElementType; accent: string; unit?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] p-3 sm:p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.06] -translate-y-4 translate-x-4" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}18` }}>
          <Icon size={12} style={{ color: accent }} />
        </div>
        <span className="text-[9px] sm:text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium leading-tight">{label}</span>
      </div>
      <p className="text-[22px] sm:text-[30px] font-bold leading-none tabular-nums" style={{ color: accent }}>
        {value}{unit && <span className="text-[14px] sm:text-[18px] font-semibold ml-0.5" style={{ color: accent }}>{unit}</span>}
      </p>
      <p className="text-[9px] sm:text-[11px] text-[#CBD5E1] mt-1 sm:mt-1.5">{sub}</p>
    </div>
  )
}

function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[14px] font-semibold text-[#0D1F3C]">{title}</p>
      {sub && <p className="text-[11px] text-[#94A3B8] mt-0.5">{sub}</p>}
    </div>
  )
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32">
      <p className="text-[12px] text-[#94A3B8]">{text}</p>
    </div>
  )
}

function AttendanceTooltip({ active, payload }: { active?: boolean; payload?: { payload: { fullName: string; attended: number; total: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-sm text-[12px]">
      <p className="font-semibold text-[#0D1F3C]">{d.fullName}</p>
      <p className="text-[#94A3B8]">{d.attended} / {d.total} séances présentes</p>
    </div>
  )
}

function WeightTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-sm text-[12px]">
      <p className="font-semibold text-[#0D1F3C]">{payload[0].value} kg</p>
    </div>
  )
}

// ── Analytics sub-components ─────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#94A3B8] mb-3">{children}</p>
  )
}

function AnalyticsKPIStrip({ kpis }: { kpis: AnalyticsKPIs }) {
  const weightSign = kpis.avgWeightDelta !== null
    ? (kpis.avgWeightDelta < 0 ? '' : kpis.avgWeightDelta > 0 ? '+' : '±')
    : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Actifs */}
      <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium mb-2">Elève actifs</p>
        <p className="text-[28px] font-bold text-[#0D1F3C] leading-none tabular-nums">{kpis.activeCount}</p>
        <p className="text-[11px] text-[#CBD5E1] mt-1">sur {kpis.totalCount} au total</p>
      </div>

      {/* Danger */}
      <div className={`rounded-xl border p-4 ${kpis.dangerCount > 0 ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-white border-[#F1F5F9]'}`}>
        <p className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: kpis.dangerCount > 0 ? '#DC2626' : '#94A3B8' }}>
          En danger
        </p>
        <p className="text-[28px] font-bold leading-none tabular-nums" style={{ color: kpis.dangerCount > 0 ? '#DC2626' : '#0D1F3C' }}>
          {kpis.dangerCount}
        </p>
        <p className="text-[11px] mt-1" style={{ color: kpis.dangerCount > 0 ? '#FCA5A5' : '#CBD5E1' }}>
          {kpis.warningCount > 0 ? `+ ${kpis.warningCount} à surveiller` : 'aucun signal critique'}
        </p>
      </div>

      {/* Completion */}
      <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium mb-2">Taux de complétion</p>
        <p className="text-[28px] font-bold text-[#0D1F3C] leading-none tabular-nums">
          {kpis.avgCompletionRate !== null ? `${kpis.avgCompletionRate}%` : '—'}
        </p>
        <p className="text-[11px] text-[#CBD5E1] mt-1">moyenne des programmes actifs</p>
      </div>

      {/* Weight delta */}
      <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium mb-2">Delta poids (30j)</p>
        {kpis.avgWeightDelta !== null ? (
          <>
            <p className={`text-[28px] font-bold leading-none tabular-nums ${kpis.avgWeightDelta < 0 ? 'text-[#4E9B6F]' : kpis.avgWeightDelta > 0 ? 'text-[#EF4444]' : 'text-[#0D1F3C]'}`}>
              {weightSign}{kpis.avgWeightDelta} kg
            </p>
            <p className="text-[11px] text-[#CBD5E1] mt-1">moyenne sur les membres suivis</p>
          </>
        ) : (
          <>
            <p className="text-[28px] font-bold text-[#CBD5E1] leading-none">—</p>
            <p className="text-[11px] text-[#CBD5E1] mt-1">données insuffisantes</p>
          </>
        )}
      </div>
    </div>
  )
}

function DangerList({ athletes }: { athletes: DangerAthlete[] }) {
  if (athletes.length === 0) {
    return (
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#4E9B6F]/10 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3 3 7-7" stroke="#4E9B6F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#166534]">Tous vos membres sont actifs</p>
          <p className="text-[11.5px] text-[#4E9B6F] mt-0.5">Aucun signal d'inactivité ou de décrochage détecté.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden">
      {athletes.map((athlete, i) => {
        const isRed    = athlete.score >= 3
        const lastC    = daysAgo(athlete.lastCheckin)
        const lastW    = daysAgo(athlete.lastWorkout ? athlete.lastWorkout + 'T00:00:00Z' : null)

        return (
          <div key={athlete.id} className={`flex items-center gap-4 px-4 py-3.5 ${i > 0 ? 'border-t border-[#F8FAFC]' : ''}`}>
            {/* Score indicator */}
            <div className={`w-2 h-8 rounded-full flex-shrink-0 ${isRed ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${isRed ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
              {athlete.full_name.charAt(0).toUpperCase()}
            </div>

            {/* Name + signals */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0D1F3C]">{athlete.full_name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {lastC !== null && (
                  <span className="text-[11px] text-[#94A3B8]">
                    Dernier check-in : <span className={lastC >= 14 ? 'text-[#EF4444] font-medium' : lastC >= 7 ? 'text-[#D97706] font-medium' : 'text-[#64748B]'}>
                      {lastC === 0 ? "aujourd'hui" : `il y a ${lastC}j`}
                    </span>
                  </span>
                )}
                {lastW !== null && (
                  <span className="text-[11px] text-[#94A3B8]">
                    Dernière séance : <span className={lastW >= 14 ? 'text-[#EF4444] font-medium' : lastW >= 7 ? 'text-[#D97706] font-medium' : 'text-[#64748B]'}>
                      {lastW === 0 ? "aujourd'hui" : `il y a ${lastW}j`}
                    </span>
                  </span>
                )}
                {athlete.completionRate14d !== null && (
                  <span className="text-[11px] text-[#94A3B8]">
                    Complétion 14j : <span className={athlete.completionRate14d < 50 ? 'text-[#EF4444] font-medium' : 'text-[#64748B]'}>{athlete.completionRate14d}%</span>
                  </span>
                )}
              </div>
            </div>

            {/* Badge */}
            <span className={`flex-shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${isRed ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
              {isRed ? 'En danger' : 'À surveiller'}
            </span>

            {/* Link */}
            <Link href={`/clients/${athlete.id}`} className="flex-shrink-0 text-[11.5px] font-medium text-[#4E9B6F] hover:text-[#3d8058] transition-colors whitespace-nowrap">
              Voir →
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function ProgrammeCompletionList({ programmes }: { programmes: ProgrammeCompletion[] }) {
  if (programmes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#F1F5F9] p-6 text-center">
        <p className="text-[12px] text-[#94A3B8]">Aucun programme avec assez d'activité (minimum 3 séances)</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden">
      {programmes.map((prog, i) => (
        <div key={prog.id} className={`px-5 py-4 ${i > 0 ? 'border-t border-[#F8FAFC]' : ''}`}>
          <div className="flex items-center justify-between gap-4 mb-2">
            <p className="text-[13px] font-medium text-[#0D1F3C] truncate">{prog.title}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-[#94A3B8] tabular-nums">{prog.completed}/{prog.total}</span>
              <span className={`text-[12px] font-bold tabular-nums ${prog.rate >= 75 ? 'text-[#4E9B6F]' : prog.rate >= 50 ? 'text-[#D97706]' : 'text-[#EF4444]'}`}>
                {prog.rate}%
              </span>
            </div>
          </div>
          {/* Progress bar — pure CSS, no library */}
          <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${prog.rate}%`,
                backgroundColor: prog.rate >= 75 ? '#4E9B6F' : prog.rate >= 50 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function StagnationTable({ athletes }: { athletes: AthleteStagnation[] }) {
  const withData    = athletes.filter(a => a.state !== 'insufficient_data')
  const withoutData = athletes.filter(a => a.state === 'insufficient_data')

  if (withData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#F1F5F9] p-6 text-center">
        <p className="text-[12px] text-[#94A3B8]">Données insuffisantes — il faut au moins 2 pesées sur 30 jours par membre</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#F1F5F9]">
            <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Membre</th>
            <th className="text-right px-5 py-3 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Delta poids (30j)</th>
            <th className="text-right px-5 py-3 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">État</th>
          </tr>
        </thead>
        <tbody>
          {withData.map((athlete, i) => (
            <tr key={athlete.id} className={`border-b border-[#F8FAFC] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#FAFBFC]'}`}>
              <td className="px-5 py-3">
                <span className="text-[13px] font-medium text-[#0D1F3C]">{athlete.full_name}</span>
              </td>
              <td className="px-5 py-3 text-right">
                <span className={`text-[13px] font-semibold tabular-nums ${
                  (athlete.weightDelta ?? 0) < 0 ? 'text-[#4E9B6F]'
                  : (athlete.weightDelta ?? 0) > 0 ? 'text-[#EF4444]'
                  : 'text-[#64748B]'
                }`}>
                  {(athlete.weightDelta ?? 0) > 0 ? '+' : ''}{athlete.weightDelta} kg
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  athlete.state === 'progression'
                    ? 'bg-[#EEF9F3] text-[#4E9B6F]'
                    : 'bg-[#FEF3C7] text-[#D97706]'
                }`}>
                  {athlete.state === 'progression' ? 'Progression' : 'Stagnation'}
                </span>
              </td>
            </tr>
          ))}
          {withoutData.length > 0 && (
            <tr className="border-t border-[#F1F5F9]">
              <td colSpan={3} className="px-5 py-2.5">
                <p className="text-[11px] text-[#CBD5E1]">
                  {withoutData.length} membre{withoutData.length > 1 ? 's' : ''} sans données suffisantes sur 30j
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StatsContent({
  clients, activeCount, weekCheckinCount, inactiveCount, monthSessionCount,
  checkins, sessions, weightEntries, bodyMeasurements,
  totalCheckinCount, globalAttendanceRate, weeks,
  analyticsKPIs, dangerAthletes, programmeCompletions, athleteStagnation,
}: Props) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')

  const heatmapData = useMemo(() =>
    clients.map(client => ({
      client,
      cells: weeks.map(w => ({
        label: w.label,
        ok: checkins.some(c => c.client_id === client.id && c.week_number === w.week && c.year === w.year),
      })),
    })), [clients, weeks, checkins])

  const attendanceData = useMemo(() =>
    clients
      .map(client => {
        const cs       = sessions.filter(s => s.client_id === client.id)
        const attended = cs.filter(s => s.attendance === 'attended').length
        return { name: firstName(client.full_name), fullName: client.full_name, attended, total: cs.length, rate: cs.length > 0 ? Math.round((attended / cs.length) * 100) : null }
      })
      .filter(c => c.total > 0)
      .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0)),
    [clients, sessions])

  const weightData = useMemo(() => {
    if (!selectedClientId) return []
    return weightEntries
      .filter(w => w.client_id === selectedClientId)
      .map(w => ({
        date: new Date(w.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        poids: w.weight_kg,
      }))
  }, [selectedClientId, weightEntries])

  const selectedClientHasWeight = weightData.length >= 2
  const selectedClientName      = clients.find(c => c.id === selectedClientId)?.full_name ?? ''

  const weightDelta = weightData.length >= 2
    ? +(weightData[weightData.length - 1].poids - weightData[0].poids).toFixed(1)
    : null

  const measData = useMemo(() => {
    const rows = bodyMeasurements.filter(m => m.client_id === selectedClientId)
    if (rows.length === 0) return null
    const first = rows[0]
    const last  = rows[rows.length - 1]
    return METRIC_KEYS.map(key => {
      const latest   = last[key]
      const earliest = first[key]
      const delta    = (latest != null && earliest != null) ? +(latest - earliest).toFixed(1) : null
      return { key, label: METRIC_LABELS[key], latest, delta }
    }).filter(r => r.latest != null)
  }, [selectedClientId, bodyMeasurements])

  if (clients.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Statistiques" description="Vue d'ensemble de votre activité coaching" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[14px] text-[#94A3B8]">Aucun membre pour le moment</p>
            <p className="text-[12px] text-[#CBD5E1] mt-1">Les statistiques apparaîtront dès que vous aurez des membres</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Statistiques" description="Vue d'ensemble de votre activité coaching" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ════════════════════════════════════════════════════════════════
              SECTION ANALYTICS (nouveaux blocs)
          ════════════════════════════════════════════════════════════════ */}

          {/* KPIs analytics */}
          <div>
            <SectionLabel>Vue d'ensemble</SectionLabel>
            <AnalyticsKPIStrip kpis={analyticsKPIs} />
          </div>

          {/* Danger */}
          <div>
            <SectionLabel>Elève en danger</SectionLabel>
            <DangerList athletes={dangerAthletes} />
          </div>

          {/* Complétion programmes */}
          <div>
            <SectionLabel>Complétion des programmes (90 derniers jours)</SectionLabel>
            <ProgrammeCompletionList programmes={programmeCompletions} />
          </div>

          {/* Stagnation */}
          <div>
            <SectionLabel>Stagnation / Progression poids (30 jours)</SectionLabel>
            <StagnationTable athletes={athleteStagnation} />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SECTION SUIVI (blocs existants)
          ════════════════════════════════════════════════════════════════ */}

          <div className="border-t border-[#F1F5F9] pt-6">
            <SectionLabel>Suivi détaillé</SectionLabel>
          </div>

          {/* KPIs classiques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Elève actifs"         value={activeCount}          sub={`sur ${clients.length} au total`}         icon={Users}         accent="#4E9B6F" />
            <KpiCard label="Check-ins cette semaine" value={weekCheckinCount}      sub={`sur ${activeCount} actifs`}              icon={CheckSquare}   accent="#3B82F6" />
            <KpiCard label="En alerte"               value={inactiveCount}         sub="sans check-in depuis 14j+"                icon={AlertTriangle}  accent="#EF4444" />
            <KpiCard label="Séances ce mois"         value={monthSessionCount}     sub="présences confirmées"                     icon={Calendar}      accent="#F59E0B" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Présence séances"  value={globalAttendanceRate ?? 0} sub={globalAttendanceRate !== null ? `${attendanceData.reduce((s, d) => s + d.attended, 0)} / ${attendanceData.reduce((s, d) => s + d.total, 0)} marquées` : 'Aucune séance marquée'} icon={Activity}    accent="#8B5CF6" unit="%" />
            <KpiCard label="Check-ins total"   value={totalCheckinCount}          sub="depuis le début"                  icon={TrendingUp}  accent="#06B6D4" />
          </div>

          {/* Heatmap + Présence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-[#F1F5F9] p-5">
              <CardHeader title="Assiduité des check-ins" sub="8 dernières semaines · vert = soumis" />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-20" />
                      {weeks.map((w, i) => (
                        <th key={i} className="pb-2 text-center">
                          <span className="text-[10px] text-[#CBD5E1] font-medium whitespace-nowrap">{w.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map(({ client, cells }) => (
                      <tr key={client.id}>
                        <td className="pr-2 py-1">
                          <span className="text-[12px] text-[#0D1F3C] font-medium truncate block max-w-[72px]">{firstName(client.full_name)}</span>
                        </td>
                        {cells.map((cell, i) => (
                          <td key={i} className="text-center py-1 px-0.5">
                            <div
                              title={`${client.full_name} · ${cell.label} : ${cell.ok ? 'Check-in ✓' : 'Pas de check-in'}`}
                              className="w-5 h-5 rounded-[4px] mx-auto transition-colors"
                              style={{ backgroundColor: cell.ok ? 'var(--brand)' : '#F1F5F9' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#F1F5F9] p-5">
              <CardHeader title="Présence aux séances" sub="Toutes séances enregistrées" />
              {attendanceData.length === 0 ? (
                <EmptyChart text="Aucune séance avec marquage de présence" />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(160, attendanceData.length * 34)}>
                  <BarChart data={attendanceData} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 4 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#CBD5E1' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#0D1F3C' }} width={56} axisLine={false} tickLine={false} />
                    <Tooltip content={<AttendanceTooltip />} cursor={{ fill: '#F8FAFB' }} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={12}>
                      {attendanceData.map((entry, i) => (
                        <Cell key={i} fill={(entry.rate ?? 0) >= 80 ? 'var(--brand)' : (entry.rate ?? 0) >= 50 ? '#F59E0B' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sélecteur client individuel */}
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0D1F3C]">Suivi individuel</p>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="text-[12px] text-[#0D1F3C] border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--brand)] bg-white"
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>

          {/* Poids individuel */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[14px] font-semibold text-[#0D1F3C]">Évolution du poids</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{selectedClientName}</p>
              </div>
              {weightDelta !== null && (
                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${weightDelta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : weightDelta > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                </span>
              )}
            </div>
            {selectedClientHasWeight ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#CBD5E1' }} tickFormatter={v => `${v}kg`} axisLine={false} tickLine={false} />
                  <Tooltip content={<WeightTooltip />} />
                  <Line type="monotone" dataKey="poids" stroke="var(--brand)" strokeWidth={2} dot={{ fill: 'var(--brand)', r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Il faut au minimum 2 pesées pour afficher l'évolution" />
            )}
          </div>

          {/* Mensurations */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-5">
            <CardHeader
              title="Mensurations"
              sub={selectedClientName ? `${selectedClientName} · première vs dernière mesure` : 'Première vs dernière mesure'}
            />
            {measData && measData.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    <th className="text-left pb-2 text-[11px] text-[#94A3B8] font-medium uppercase tracking-wide">Mesure</th>
                    <th className="text-right pb-2 text-[11px] text-[#94A3B8] font-medium uppercase tracking-wide">Valeur actuelle</th>
                    <th className="text-right pb-2 text-[11px] text-[#94A3B8] font-medium uppercase tracking-wide">Évolution</th>
                  </tr>
                </thead>
                <tbody>
                  {measData.map(row => (
                    <tr key={row.key} className="border-b border-[#F8FAFC] last:border-0">
                      <td className="py-3 text-[13px] font-medium text-[#0D1F3C]">{row.label}</td>
                      <td className="py-3 text-right text-[13px] text-[#0D1F3C] tabular-nums">{row.latest} cm</td>
                      <td className="py-3 text-right">
                        {row.delta !== null ? (
                          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                            row.delta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]'
                            : row.delta > 0 ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {row.delta > 0 ? '+' : ''}{row.delta} cm
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#CBD5E1]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyChart text="Aucune mensuration enregistrée pour ce client" />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
