import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BilanSnapshot } from '@/types/database'

export const dynamic = 'force-dynamic'

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000 // 60 jours

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  // Get all active clients
  const { data: clients, error: clientsError } = await admin
    .from('clients')
    .select('id, full_name, coach_id, main_goal, created_at')
    .eq('status', 'active')

  if (clientsError || !clients) {
    return NextResponse.json({ error: clientsError?.message ?? 'no clients' }, { status: 500 })
  }

  // Get latest bilan per client
  const clientIds = clients.map(c => c.id)
  const { data: latestBilans } = await admin
    .from('bilans')
    .select('client_id, sent_at')
    .in('client_id', clientIds)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })

  const lastBilanByClient: Record<string, string> = {}
  for (const b of latestBilans ?? []) {
    if (!lastBilanByClient[b.client_id]) {
      lastBilanByClient[b.client_id] = b.sent_at!
    }
  }

  const toProcess = clients.filter(c => {
    const last = lastBilanByClient[c.id]
    if (!last) {
      // Never received a bilan — send only if client exists for at least 2 months
      const createdMs = now.getTime() - new Date(c.created_at).getTime()
      return createdMs >= TWO_MONTHS_MS
    }
    return now.getTime() - new Date(last).getTime() >= TWO_MONTHS_MS
  })

  if (toProcess.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no clients due for bilan' })
  }

  let sent = 0
  const errors: string[] = []

  for (const client of toProcess) {
    try {
      const since = new Date(now.getTime() - 56 * 86400000).toISOString()
      const sinceDate = since.slice(0, 10)

      const [
        { data: checkins },
        { data: objectives },
        { data: weightEntries },
        { data: measurements },
      ] = await Promise.all([
        admin.from('checkins').select('id').eq('client_id', client.id).gte('submitted_at', since),
        admin.from('objectives').select('id, status').eq('client_id', client.id),
        admin.from('weight_entries').select('date, weight_kg').eq('client_id', client.id).gte('date', sinceDate).order('date', { ascending: true }),
        admin.from('body_measurements').select('*').eq('client_id', client.id).gte('date', sinceDate).order('date', { ascending: true }),
      ])

      const periodWeeks = 8
      const checkinCount = checkins?.length ?? 0
      const objectivesDone = objectives?.filter(o => o.status === 'done').length ?? 0
      const objectivesTotal = objectives?.length ?? 0

      const weightStart = weightEntries?.[0]?.weight_kg ?? null
      const weightEnd = weightEntries && weightEntries.length > 1 ? weightEntries[weightEntries.length - 1].weight_kg : null
      const weightDelta = weightStart !== null && weightEnd !== null ? +(weightEnd - weightStart).toFixed(1) : null

      let measurementsDelta: Record<string, number | null> | null = null
      if (measurements && measurements.length >= 2) {
        const first = measurements[0], last = measurements[measurements.length - 1]
        const keys = ['waist_cm', 'hips_cm', 'chest_cm', 'l_bicep_cm', 'r_bicep_cm', 'l_thigh_cm', 'r_thigh_cm'] as const
        measurementsDelta = {}
        for (const key of keys) {
          const f = first[key] as number | null, l = last[key] as number | null
          measurementsDelta[key] = f !== null && l !== null ? +(l - f).toFixed(1) : null
        }
        if (!Object.values(measurementsDelta).some(v => v !== null)) measurementsDelta = null
      }

      const clientCreatedWeeks = Math.floor((now.getTime() - new Date(client.created_at).getTime()) / (7 * 86400000))
      const periodStart = new Date(now.getTime() - periodWeeks * 7 * 86400000)
      const fmtMonth = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

      const snapshot: BilanSnapshot = {
        period_label: `${fmtMonth(periodStart)} — ${fmtMonth(now)}`,
        period_weeks: periodWeeks,
        checkin_count: checkinCount,
        checkin_rate_pct: Math.round((checkinCount / periodWeeks) * 100),
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

      const { error } = await admin.from('bilans').insert({
        coach_id: client.coach_id,
        client_id: client.id,
        content_snapshot: snapshot,
        generated_at: now.toISOString(),
        sent_at: now.toISOString(),
        is_auto: true,
      })

      if (error) errors.push(`${client.id}: ${error.message}`)
      else sent++
    } catch (e) {
      errors.push(`${client.id}: ${String(e)}`)
    }
  }

  console.log(`[cron/bilan] sent=${sent} errors=${errors.length}`)
  return NextResponse.json({ ok: true, sent, errors: errors.slice(0, 5) })
}
