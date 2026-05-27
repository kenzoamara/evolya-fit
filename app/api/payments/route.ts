import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('client_payments')
    .select('id, client_id, amount, currency, due_date, paid_date, claimed_at, notes, created_at, clients(full_name)')
    .eq('coach_id', user.id)
    .order('due_date', { ascending: false })

  return NextResponse.json({ payments: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, amount, due_date, notes } = await req.json()
  if (!client_id || !amount || !due_date) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('client_payments')
    .insert({ coach_id: user.id, client_id, amount: Number(amount), currency: 'EUR', due_date, notes: notes ?? null })
    .select('id, client_id, amount, currency, due_date, paid_date, claimed_at, notes, created_at, clients(full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payment: data })
}
