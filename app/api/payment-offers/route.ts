import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data } = await supabase
    .from('payment_offers')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ offers: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { name, priceEuros, sessionsCount } = await req.json()
  const price_cents = Math.round(Number(priceEuros) * 100)
  const sessions = Number(sessionsCount)

  if (!name?.trim() || !price_cents || price_cents <= 0 || !sessions || sessions <= 0) {
    return NextResponse.json({ error: 'Nom, prix et nombre de séances requis.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('payment_offers')
    .insert({
      coach_id: user.id,
      type: 'pack',
      name: name.trim(),
      price_cents,
      currency: 'eur',
      sessions_count: sessions,
    } as never)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ offer: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  // On désactive plutôt que supprimer (historique transactions conservé)
  const { error } = await supabase
    .from('payment_offers')
    .update({ is_active: false } as never)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
