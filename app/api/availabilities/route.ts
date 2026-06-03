import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET ?coachId= (public, pour le client)
// GET (coach, ses propres dispos)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const coachId = searchParams.get('coachId')
  const admin = createAdminClient()

  if (coachId) {
    const { data } = await admin
      .from('coach_availabilities')
      .select('*')
      .eq('coach_id', coachId)
      .order('day_of_week')
      .order('start_time')
    return NextResponse.json({ availabilities: data ?? [] })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data } = await supabase
    .from('coach_availabilities')
    .select('*')
    .eq('coach_id', user.id)
    .order('day_of_week')
    .order('start_time')

  return NextResponse.json({ availabilities: data ?? [] })
}

// POST — ajouter un créneau
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { day_of_week, start_time, end_time, slot_duration_minutes } = await req.json()
  if (day_of_week === undefined || !start_time || !end_time) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('coach_availabilities')
    .insert({
      coach_id: user.id,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes: slot_duration_minutes ?? 60,
    } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ availability: data })
}

// DELETE ?id=
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  await supabase.from('coach_availabilities').delete().eq('id', id).eq('coach_id', user.id)
  return NextResponse.json({ success: true })
}
