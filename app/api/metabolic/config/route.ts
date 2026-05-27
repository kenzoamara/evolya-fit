import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMetabolicAccess } from '../verify'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  const token = searchParams.get('token')
  if (!clientId) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  const { allowed } = await verifyMetabolicAccess(clientId, token)
  if (!allowed) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const { data } = await admin.from('metabolic_config').select('*').eq('client_id', clientId).single()
  return NextResponse.json(data ?? null)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { client_id, calorie_goal, weigh_in_day, starting_weight } = body

  if (!client_id) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  // Seul le coach peut modifier la config (pas de token accepté)
  const { allowed, isCoach } = await verifyMetabolicAccess(client_id, null)
  if (!allowed || !isCoach) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin.from('metabolic_config').upsert({
    client_id,
    calorie_goal: calorie_goal ?? 2000,
    weigh_in_day: weigh_in_day ?? 1,
    starting_weight: starting_weight ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'client_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
