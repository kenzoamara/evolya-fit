export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatsContent } from './stats-content'
import { PlanGate } from '@/components/ui/plan-gate'

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return {
    week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
    year: d.getUTCFullYear(),
  }
}

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function getLast8Weeks() {
  const result = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const dow = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - (dow - 1))
    const { week, year } = getISOWeek(d)
    const label = `${monday.getDate()} ${MONTHS_FR[monday.getMonth()]}`
    const mondayIso = monday.toISOString().split('T')[0]
    result.push({ week, year, label, mondayIso })
  }
  return result
}

// ── Analytics types ──────────────────────────────────────────────────────────

export type DangerAthlete = {
  id: string
  full_name: string
  score: number
  lastWorkout: string | null
  lastCheckin: string | null
  completionRate14d: number | null
  signals: string[]
}

export type ProgrammeCompletion = {
  id: string
  title: string
  completed: number
  total: number
  rate: number
}

export type AthleteStagnation = {
  id: string
  full_name: string
  weightDelta: number | null
  state: 'progression' | 'stagnation' | 'insufficient_data'
}

export type AnalyticsKPIs = {
  activeCount: number
  totalCount: number
  dangerCount: number
  warningCount: number
  avgCompletionRate: number | null
  avgWeightDelta: number | null
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function StatistiquesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileCheck } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const userPlan = (profileCheck?.plan ?? 'free') as string
  if (!['starter', 'growth', 'pro'].includes(userPlan)) {
    return (
      <PlanGate featureKey="stats_perf" userPlan={userPlan} fullPage>
        <div />
      </PlanGate>
    )
  }

  const now = new Date()
  const { week: currentWeek, year: currentYear } = getISOWeek(now)
  const firstDayOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const fourteenDaysAgo  = new Date(now.getTime() - 14 * 86400000).toISOString()
  const sevenDaysAgo     = new Date(now.getTime() -  7 * 86400000).toISOString()
  const thirtyDaysAgo    = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
  const ninetyDaysAgo    = new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0]
  const eightWeeksAgo    = new Date(now.getTime() - 8 * 7 * 86400000).toISOString()
  const weeks            = getLast8Weeks()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, status, last_checkin_at')
    .eq('coach_id', user.id)
    .order('full_name')

  const allClients   = clients ?? []
  const clientIds    = allClients.map(c => c.id)
  const activeClients = allClients.filter(c => c.status === 'active')

  const EMPTY_ANALYTICS: AnalyticsKPIs = {
    activeCount: 0, totalCount: 0,
    dangerCount: 0, warningCount: 0,
    avgCompletionRate: null, avgWeightDelta: null,
  }

  if (clientIds.length === 0) {
    return (
      <StatsContent
        clients={[]} activeCount={0} weekCheckinCount={0}
        inactiveCount={0} monthSessionCount={0}
        checkins={[]} sessions={[]}
        weightEntries={[]} bodyMeasurements={[]}
        totalCheckinCount={0} globalAttendanceRate={null}
        weeks={weeks}
        analyticsKPIs={EMPTY_ANALYTICS}
        dangerAthletes={[]}
        programmeCompletions={[]}
        athleteStagnation={[]}
      />
    )
  }

  const admin = createAdminClient()

  const [
    { data: checkins },
    { data: sessions },
    { data: weightEntries },
    { data: bodyMeasurements },
    { count: totalCheckinCount },
    { data: workoutLogs },
  ] = await Promise.all([
    supabase
      .from('checkins')
      .select('client_id, week_number, year, energy_score')
      .in('client_id', clientIds)
      .gte('submitted_at', eightWeeksAgo),

    supabase
      .from('sessions')
      .select('client_id, attendance, session_date')
      .eq('coach_id', user.id)
      .in('client_id', clientIds),

    admin
      .from('weight_entries')
      .select('client_id, date, weight_kg')
      .in('client_id', clientIds)
      .order('date', { ascending: true }),

    admin
      .from('body_measurements')
      .select('client_id, date, neck_cm, shoulders_cm, chest_cm, waist_cm, hips_cm, l_bicep_cm, r_bicep_cm, l_forearm_cm, r_forearm_cm, l_thigh_cm, r_thigh_cm')
      .in('client_id', clientIds)
      .order('date', { ascending: true }),

    supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .in('client_id', clientIds),

    admin
      .from('workout_logs')
      .select('client_id, log_date, completed, programme_assignments(programme_id, programmes(id, title))')
      .in('client_id', clientIds)
      .gte('log_date', ninetyDaysAgo)
      .order('log_date', { ascending: false })
      .limit(1000),
  ])

  // ── Existing KPIs ────────────────────────────────────────────────────────
  const activeCount        = activeClients.length
  const weekCheckinCount   = (checkins ?? []).filter(c => c.week_number === currentWeek && c.year === currentYear).length
  const inactiveCount      = activeClients.filter(c => !c.last_checkin_at || c.last_checkin_at < fourteenDaysAgo).length
  const monthSessionCount  = (sessions ?? []).filter(s => s.attendance === 'attended' && s.session_date >= firstDayOfMonth).length

  const allSessions       = sessions ?? []
  const markedSessions    = allSessions.filter(s => s.attendance !== null)
  const attendedSessions  = allSessions.filter(s => s.attendance === 'attended')
  const globalAttendanceRate = markedSessions.length > 0
    ? Math.round((attendedSessions.length / markedSessions.length) * 100)
    : null

  // ── Danger athletes ──────────────────────────────────────────────────────
  const logs = workoutLogs ?? []

  const dangerAthletes: DangerAthlete[] = activeClients.map(client => {
    let score = 0
    const signals: string[] = []

    // Signal 1 — check-in
    // Règle : on ne pénalise QUE si l'membre a déjà soumis au moins 1 check-in (usage établi)
    const lastCheckin = client.last_checkin_at ?? null
    if (lastCheckin) {
      // L'membre utilise le check-in — on vérifie la régularité
      if (lastCheckin < fourteenDaysAgo) {
        score += 2
        signals.push('Aucun check-in depuis 14j+')
      } else if (lastCheckin < sevenDaysAgo) {
        score += 1
        signals.push('Pas de check-in depuis 7j')
      }
    }

    // Signal 2 — workout
    // Règle : on ne pénalise QUE si l'membre a au moins 1 log dans les 90j (usage établi)
    const allClientLogs  = logs.filter(l => l.client_id === client.id)
    const completedLogs  = allClientLogs.filter(l => l.completed)
    const lastWorkout    = completedLogs[0]?.log_date ?? null
    const lastWorkoutISO = lastWorkout ? lastWorkout + 'T00:00:00.000Z' : null
    if (allClientLogs.length > 0 && lastWorkoutISO) {
      // L'membre utilise le suivi workout — on vérifie l'activité récente
      if (lastWorkoutISO < fourteenDaysAgo) {
        score += 2
        signals.push('Aucune séance complétée depuis 14j+')
      } else if (lastWorkoutISO < sevenDaysAgo) {
        score += 1
        signals.push('Pas de séance complétée depuis 7j')
      }
    }

    // Signal 3 — taux de complétion faible sur 14j (seulement si l'membre a ≥ 3 logs)
    const fourteenDaysAgoDate = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0]
    const logs14d = allClientLogs.filter(l => l.log_date >= fourteenDaysAgoDate)
    const completionRate14d = logs14d.length >= 3
      ? Math.round(logs14d.filter(l => l.completed).length / logs14d.length * 100)
      : null
    if (completionRate14d !== null && completionRate14d < 50) {
      score += 1
      signals.push(`Complétion 14j : ${completionRate14d}%`)
    }

    return { id: client.id, full_name: client.full_name, score, lastWorkout, lastCheckin, completionRate14d, signals }
  }).filter(a => a.score > 0).sort((a, b) => b.score - a.score)

  // ── Programme completion ─────────────────────────────────────────────────
  type ProgEntry = { title: string; completed: number; total: number }
  const progMap = new Map<string, ProgEntry>()

  for (const log of logs) {
    const pa = (log.programme_assignments as unknown) as { programme_id: string; programmes: { id: string; title: string } | null } | null
    const prog = pa?.programmes
    if (!prog) continue
    const key = prog.id
    if (!progMap.has(key)) progMap.set(key, { title: prog.title, completed: 0, total: 0 })
    const entry = progMap.get(key)!
    entry.total++
    if (log.completed) entry.completed++
  }

  const programmeCompletions: ProgrammeCompletion[] = Array.from(progMap.entries())
    .map(([id, d]) => ({ id, title: d.title, completed: d.completed, total: d.total, rate: Math.round(d.completed / d.total * 100) }))
    .filter(p => p.total >= 3)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // ── Stagnation ───────────────────────────────────────────────────────────
  const athleteStagnation: AthleteStagnation[] = activeClients.map(client => {
    const entries = (weightEntries ?? [])
      .filter(w => w.client_id === client.id && w.date >= thirtyDaysAgo)
    if (entries.length < 2) {
      return { id: client.id, full_name: client.full_name, weightDelta: null, state: 'insufficient_data' as const }
    }
    const delta = +(entries[entries.length - 1].weight_kg - entries[0].weight_kg).toFixed(1)
    const state: AthleteStagnation['state'] = Math.abs(delta) < 0.5 ? 'stagnation' : 'progression'
    return { id: client.id, full_name: client.full_name, weightDelta: delta, state }
  }).sort((a, b) => {
    const order: Record<AthleteStagnation['state'], number> = { stagnation: 0, progression: 1, insufficient_data: 2 }
    return order[a.state] - order[b.state]
  })

  // ── Global analytics KPIs ────────────────────────────────────────────────
  const dangerCount  = dangerAthletes.filter(a => a.score >= 3).length
  const warningCount = dangerAthletes.filter(a => a.score > 0 && a.score < 3).length

  const avgCompletionRate = programmeCompletions.length > 0
    ? Math.round(programmeCompletions.reduce((s, p) => s + p.rate, 0) / programmeCompletions.length)
    : null

  const weightDeltas = athleteStagnation.filter(a => a.weightDelta !== null).map(a => a.weightDelta!)
  const avgWeightDelta = weightDeltas.length > 0
    ? +( weightDeltas.reduce((s, d) => s + d, 0) / weightDeltas.length).toFixed(1)
    : null

  const analyticsKPIs: AnalyticsKPIs = {
    activeCount,
    totalCount: allClients.length,
    dangerCount,
    warningCount,
    avgCompletionRate,
    avgWeightDelta,
  }

  return (
    <StatsContent
      clients={allClients}
      activeCount={activeCount}
      weekCheckinCount={weekCheckinCount}
      inactiveCount={inactiveCount}
      monthSessionCount={monthSessionCount}
      checkins={checkins ?? []}
      sessions={sessions ?? []}
      weightEntries={(weightEntries ?? []) as { client_id: string; date: string; weight_kg: number }[]}
      bodyMeasurements={(bodyMeasurements ?? []) as { client_id: string; date: string; neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null; waist_cm: number | null; hips_cm: number | null; l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null; r_forearm_cm: number | null; l_thigh_cm: number | null; r_thigh_cm: number | null }[]}
      totalCheckinCount={totalCheckinCount ?? 0}
      globalAttendanceRate={globalAttendanceRate}
      weeks={weeks}
      analyticsKPIs={analyticsKPIs}
      dangerAthletes={dangerAthletes}
      programmeCompletions={programmeCompletions}
      athleteStagnation={athleteStagnation}
    />
  )
}
