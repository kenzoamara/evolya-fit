import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET ?token=  → packs actifs du coach + crédits du client (vue espace client)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token requis.' }, { status: 400 })

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id, token_expires_at')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()
  if (!client) return NextResponse.json({ offers: [], entitlements: [], paymentsEnabled: false })

  const [{ data: coach }, { data: offers }, { data: entitlements }] = await Promise.all([
    admin.from('profiles').select('connect_charges_enabled').eq('id', client.coach_id).single(),
    admin.from('payment_offers').select('id, name, price_cents, currency, sessions_count').eq('coach_id', client.coach_id).eq('is_active', true).order('price_cents'),
    admin.from('client_entitlements').select('id, sessions_remaining, status').eq('client_id', client.id).eq('status', 'active').gt('sessions_remaining', 0),
  ])

  return NextResponse.json({
    offers: offers ?? [],
    entitlements: entitlements ?? [],
    paymentsEnabled: (coach as { connect_charges_enabled: boolean } | null)?.connect_charges_enabled ?? false,
  })
}
