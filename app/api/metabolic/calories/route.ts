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
    .from('calorie_entries')
    .select('id, date, calories')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(90)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_id, date, calories, token } = body
  if (!client_id || !date || calories == null) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { allowed, isCoach } = await verifyMetabolicAccess(client_id, token)
  if (!allowed || isCoach) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Arrondir au centaine le plus proche
  const rounded = Math.round(Number(calories) / 100) * 100

  const admin = createAdminClient()
  const { error } = await admin.from('calorie_entries').upsert(
    { client_id, date, calories: rounded },
    { onConflict: 'client_id,date' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, calories: rounded })
}
