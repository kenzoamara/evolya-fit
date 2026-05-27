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
    .from('performance_entries')
    .select('id, date, label, value, unit, notes')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_id, date, label, value, unit, notes, token } = body
  if (!client_id || !date || !label || value == null) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { allowed, isCoach } = await verifyMetabolicAccess(client_id, token)
  if (!allowed || isCoach) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const v = parseFloat(value)
  if (isNaN(v) || v < 0) return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('performance_entries').insert({
    client_id,
    date,
    label: label.trim().slice(0, 100),
    value: v,
    unit: (unit ?? 'kg').slice(0, 20),
    notes: notes?.trim().slice(0, 500) || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
