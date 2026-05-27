import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/client/payments?token=xxx
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
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

  const { data: payments, error } = await admin
    .from('client_payments')
    .select('id, amount, currency, due_date, paid_date, claimed_at, notes, created_at')
    .eq('client_id', client.id)
    .order('due_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: payments ?? [] })
}
