import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/client/payments/[id]/claim
// Body: { token: string }
// Sets claimed_at = now() — does NOT set paid_date (coach must confirm)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { token } = body
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()

  // Resolve client from magic token
  const now = new Date().toISOString()
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  // Verify this payment belongs to this client
  const { data: payment } = await admin
    .from('client_payments')
    .select('id, paid_date, claimed_at')
    .eq('id', params.id)
    .eq('client_id', client.id)
    .single()

  if (!payment) return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  if (payment.paid_date) return NextResponse.json({ error: 'Ce paiement est déjà confirmé par ton coach' }, { status: 409 })
  if (payment.claimed_at) return NextResponse.json({ error: 'Déclaration déjà envoyée' }, { status: 409 })

  const { data: updated, error } = await admin
    .from('client_payments')
    .update({ claimed_at: now })
    .eq('id', params.id)
    .select('id, amount, currency, due_date, paid_date, claimed_at, notes, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payment: updated })
}
