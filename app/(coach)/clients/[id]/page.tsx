import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientDetailContent } from './client-detail-content'
import type { Client, Session, Checkin } from '@/types/database'

type WorkoutLog = {
  id: string
  log_date: string
  completed: boolean
  programme_days: { day_number: number; title: string | null } | null
  programme_assignments: { programmes: { title: string } | null } | null
  exercise_logs: { set_number: number; reps_done: number | null; weight_kg: number | null; programme_day_exercises: { exercise_name: string } | null }[]
}

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  if (!client) notFound()

  const adminClient = createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  type WeightEntry = { date: string; weight_kg: number }
  type BodyMeasurement = { date: string; neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null; l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null; r_forearm_cm: number | null; waist_cm: number | null; hips_cm: number | null; l_thigh_cm: number | null; r_thigh_cm: number | null }
  type SleepEntry = { date: string; hours: number }
  type PerformanceEntry = { date: string; label: string; value: number; unit: string; notes?: string | null }
  type ClientNote = { id: string; content: string; is_private: boolean; created_at: string }

  let sessions: Session[] = []
  let checkins: Checkin[] = []
  let clientNotes: ClientNote[] = []
  let coachNotes: ClientNote[] = []
  let weightEntries: WeightEntry[] = []
  let bodyMeasurements: BodyMeasurement[] = []
  let sleepEntries: SleepEntry[] = []
  let performanceEntries: PerformanceEntry[] = []
  let workoutLogs: WorkoutLog[] = []
  let latePaymentsCount = 0

  try {
    const [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
      supabase.from('sessions').select('*').eq('client_id', id).order('session_date', { ascending: false }),
      supabase.from('checkins').select('*').eq('client_id', id).order('submitted_at', { ascending: false }),
      adminClient.from('client_notes').select('*').eq('client_id', id).eq('is_private', false).eq('author_role', 'client').order('created_at', { ascending: false }),
      adminClient.from('client_notes').select('*').eq('client_id', id).eq('author_role', 'coach').order('created_at', { ascending: false }),
      adminClient.from('weight_entries').select('date, weight_kg').eq('client_id', id).order('date', { ascending: true }),
      adminClient.from('body_measurements').select('date, neck_cm, shoulders_cm, chest_cm, l_bicep_cm, r_bicep_cm, l_forearm_cm, r_forearm_cm, waist_cm, hips_cm, l_thigh_cm, r_thigh_cm').eq('client_id', id).order('date', { ascending: true }),
      adminClient.from('sleep_entries').select('date, hours').eq('client_id', id).order('date', { ascending: false }).limit(30),
      adminClient.from('performance_entries').select('date, label, value, unit, notes').eq('client_id', id).order('date', { ascending: false }).limit(20),
      adminClient.from('workout_logs').select(`
        id, log_date, completed,
        programme_days(day_number, title),
        programme_assignments(programmes(title)),
        exercise_logs(set_number, reps_done, weight_kg, programme_day_exercises(exercise_name))
      `).eq('client_id', id).order('log_date', { ascending: false }).limit(30),
      supabase.from('client_payments').select('id').eq('client_id', id).eq('coach_id', user.id).is('paid_date', null).is('claimed_at', null).lt('due_date', today),
    ])
    sessions = (r0.data ?? []) as Session[]
    checkins = (r1.data ?? []) as Checkin[]
    clientNotes = (r2.data ?? []) as ClientNote[]
    coachNotes = (r3.data ?? []) as ClientNote[]
    weightEntries = (r4.data ?? []) as WeightEntry[]
    bodyMeasurements = (r5.data ?? []) as BodyMeasurement[]
    sleepEntries = (r6.data ?? []) as SleepEntry[]
    performanceEntries = (r7.data ?? []) as PerformanceEntry[]
    workoutLogs = (r8.data ?? []) as unknown as WorkoutLog[]
    latePaymentsCount = r9.data?.length ?? 0
  } catch (err) {
    console.error('[client-detail] data fetch error:', err)
    throw err
  }

  return (
    <ClientDetailContent
      client={client as Client}
      sessions={sessions}
      checkins={checkins}
      clientNotes={clientNotes}
      coachNotes={coachNotes}
      weightEntries={weightEntries}
      bodyMeasurements={bodyMeasurements}
      sleepEntries={sleepEntries}
      performanceEntries={performanceEntries}
      workoutLogs={workoutLogs}
      latePaymentsCount={latePaymentsCount}
      isCoach
    />
  )
}
