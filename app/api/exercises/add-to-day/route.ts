import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: add a library exercise to an existing programme day
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { day_id, exercise_name, instructions } = await req.json()
  if (!day_id || !exercise_name) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  // Verify ownership: day → programme → coach_id
  const { data: day } = await supabase
    .from('programme_days')
    .select('id, programme_id')
    .eq('id', day_id)
    .single()
  if (!day) return NextResponse.json({ error: 'Jour introuvable' }, { status: 404 })

  const { data: prog } = await supabase
    .from('programmes')
    .select('id')
    .eq('id', day.programme_id)
    .eq('coach_id', user.id)
    .single()
  if (!prog) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get current max position for that day
  const { data: existing } = await supabase
    .from('programme_day_exercises')
    .select('position')
    .eq('programme_day_id', day_id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing?.length ? (existing[0].position + 1) : 0

  const { data: inserted, error } = await supabase
    .from('programme_day_exercises')
    .insert({
      programme_day_id: day_id,
      exercise_name,
      sets: 3,
      reps: 10,
      weight_kg: null,
      rest_seconds: 60,
      notes: instructions ?? null,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercise: inserted })
}
