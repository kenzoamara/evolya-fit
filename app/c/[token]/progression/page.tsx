export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ClientProgresView } from '@/components/client/progres-view'
import type { Client, Objective, Checkin, Session } from '@/types/database'

export default async function ClientProgressionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('magic_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (!client) redirect(`/c/${token}`)

  const admin = createAdminClient()

  type WeightEntry = { date: string; weight_kg: number }
  type BodyMeasurement = { date: string; neck_cm: number | null; shoulders_cm: number | null; chest_cm: number | null; l_bicep_cm: number | null; r_bicep_cm: number | null; l_forearm_cm: number | null; r_forearm_cm: number | null; waist_cm: number | null; hips_cm: number | null; l_thigh_cm: number | null; r_thigh_cm: number | null }
  type SleepEntry = { id: string; date: string; hours: number }
  type PerformanceEntry = { id: string; date: string; label: string; value: number; unit: string; notes?: string | null }

  let sessions: Session[] = []
  let objectives: Objective[] = []
  let checkins: Checkin[] = []
  let weightEntries: WeightEntry[] = []
  let bodyMeasurements: BodyMeasurement[] = []
  let sleepEntries: SleepEntry[] = []
  let performanceEntries: PerformanceEntry[] = []

  try {
    const [r0, r1, r2, r3, r4, r5, r6] = await Promise.all([
      admin.from('sessions').select('*').eq('client_id', client.id).order('session_date', { ascending: false }),
      admin.from('objectives').select('*').eq('client_id', client.id).order('created_at'),
      admin.from('checkins').select('*').eq('client_id', client.id).order('submitted_at', { ascending: false }),
      admin.from('weight_entries').select('date, weight_kg').eq('client_id', client.id).order('date', { ascending: true }),
      admin.from('body_measurements').select('date, neck_cm, shoulders_cm, chest_cm, l_bicep_cm, r_bicep_cm, l_forearm_cm, r_forearm_cm, waist_cm, hips_cm, l_thigh_cm, r_thigh_cm').eq('client_id', client.id).order('date', { ascending: true }),
      admin.from('sleep_entries').select('id, date, hours').eq('client_id', client.id).order('date', { ascending: false }).limit(60),
      admin.from('performance_entries').select('id, date, label, value, unit, notes').eq('client_id', client.id).order('date', { ascending: false }).limit(50),
    ])
    sessions = (r0.data ?? []) as Session[]
    objectives = (r1.data ?? []) as Objective[]
    checkins = (r2.data ?? []) as Checkin[]
    weightEntries = (r3.data ?? []) as WeightEntry[]
    bodyMeasurements = (r4.data ?? []) as BodyMeasurement[]
    sleepEntries = (r5.data ?? []) as SleepEntry[]
    performanceEntries = (r6.data ?? []) as PerformanceEntry[]
  } catch (err) {
    console.error('[progression] data fetch error:', err)
    throw err
  }

  return (
    <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#0D1F3C] mb-6">Mes progrès</h1>
      <ClientProgresView
        client={client as Client}
        sessions={sessions}
        objectives={objectives}
        checkins={checkins}
        weightEntries={weightEntries}
        bodyMeasurements={bodyMeasurements}
        sleepEntries={sleepEntries}
        performanceEntries={performanceEntries}
        token={token}
      />
    </main>
  )
}
