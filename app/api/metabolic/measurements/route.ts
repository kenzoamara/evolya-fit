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
  const { data, error } = await admin
    .from('body_measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(12)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_id, date, token, ...measurements } = body
  if (!client_id || !date) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { allowed, isCoach } = await verifyMetabolicAccess(client_id, token)
  if (!allowed || isCoach) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const allowed_fields = [
    'neck_cm', 'shoulders_cm', 'chest_cm',
    'l_bicep_cm', 'r_bicep_cm',
    'l_forearm_cm', 'r_forearm_cm',
    'waist_cm', 'hips_cm',
    'l_thigh_cm', 'r_thigh_cm',
  ]
  const payload: Record<string, unknown> = { client_id, date }
  for (const field of allowed_fields) {
    if (measurements[field] != null && measurements[field] !== '') {
      payload[field] = parseFloat(measurements[field])
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('body_measurements').upsert(payload, { onConflict: 'client_id,date' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
