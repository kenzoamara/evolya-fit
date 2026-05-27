import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BilanSnapshot } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const client_id = searchParams.get('client_id')
  if (!client_id) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, coach_id, main_goal, created_at')
    .eq('id', client_id)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const since = new Date(Date.now() - 56 * 86400000).toISOString()
  const sinceDate = new Date(Date.now() - 56 * 86400000).toISOString().slice(0, 10)

  const [
    { data: checkins },
    { data: objectives },
    { data: weightEntries },
    { data: measurements },
  ] = await Promise.all([
    admin.from('checkins').select('id').eq('client_id', client_id).gte('submitted_at', since),
    admin.from('objectives').select('id, status').eq('client_id', client_id),
    admin.from('weight_entries').select('date, weight_kg').eq('client_id', client_id).gte('date', sinceDate).order('date', { ascending: true }),
    admin.from('body_measurements').select('*').eq('client_id', client_id).gte('date', sinceDate).order('date', { ascending: true }),
  ])

  const periodWeeks = 8
  const checkinCount = checkins?.length ?? 0
  const checkinRatePct = Math.round((checkinCount / periodWeeks) * 100)
  const objectivesTotal = objectives?.length ?? 0
  const objectivesDone = objectives?.filter(o => o.status === 'done').length ?? 0

  const weightStart = weightEntries && weightEntries.length > 0 ? weightEntries[0].weight_kg : null
  const weightEnd = weightEntries && weightEntries.length > 1 ? weightEntries[weightEntries.length - 1].weight_kg : null
  const weightDelta = weightStart !== null && weightEnd !== null ? +(weightEnd - weightStart).toFixed(1) : null

  let measurementsDelta: Record<string, number | null> | null = null
  if (measurements && measurements.length >= 2) {
    const first = measurements[0]
    const last = measurements[measurements.length - 1]
    const keys = ['waist_cm', 'hips_cm', 'chest_cm', 'l_bicep_cm', 'r_bicep_cm', 'l_thigh_cm', 'r_thigh_cm'] as const
    measurementsDelta = {}
    for (const key of keys) {
      const f = first[key] as number | null
      const l = last[key] as number | null
      measurementsDelta[key] = f !== null && l !== null ? +(l - f).toFixed(1) : null
    }
    if (!Object.values(measurementsDelta).some(v => v !== null)) measurementsDelta = null
  }

  const clientCreatedWeeks = Math.floor((Date.now() - new Date(client.created_at).getTime()) / (7 * 86400000))
  const now = new Date()
  const periodStart = new Date(now.getTime() - periodWeeks * 7 * 86400000)
  const fmtMonth = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

  const snapshot: BilanSnapshot = {
    period_label: `${fmtMonth(periodStart)} — ${fmtMonth(now)}`,
    period_weeks: periodWeeks,
    checkin_count: checkinCount,
    checkin_rate_pct: checkinRatePct,
    objectives_done: objectivesDone,
    objectives_total: objectivesTotal,
    weight_start_kg: weightStart,
    weight_end_kg: weightEnd,
    weight_delta_kg: weightDelta,
    measurements_delta: measurementsDelta,
    roi_weeks: clientCreatedWeeks,
    roi_monthly_price: null,
    roi_total: null,
    main_goal: client.main_goal,
    coach_note: null,
  }

  return NextResponse.json({ snapshot, client_name: client.full_name })
}
