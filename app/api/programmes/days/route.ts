import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: add a day; DELETE: remove a day; PATCH: update exercises
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { programme_id, day_number, title, exercises } = await req.json()

  // Verify ownership
  const { data: prog } = await supabase.from('programmes').select('id').eq('id', programme_id).eq('coach_id', user.id).single()
  if (!prog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: day, error } = await supabase
    .from('programme_days')
    .insert({ programme_id, day_number, title: title || `Jour ${day_number}` })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert exercises if provided
  if (exercises?.length) {
    const rows = exercises.map((ex: { exercise_name: string; sets?: number; reps?: number; weight_kg?: number; notes?: string }, i: number) => ({
      programme_day_id: day.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      weight_kg: ex.weight_kg ?? null,
      notes: ex.notes ?? null,
      position: i,
    }))
    await supabase.from('programme_day_exercises').insert(rows)
  }

  return NextResponse.json({ day })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { day_id, title, exercises } = await req.json()

  // Verify ownership via join
  const { data: day } = await supabase
    .from('programme_days')
    .select('id, programme_id')
    .eq('id', day_id)
    .single()
  if (!day) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: prog } = await supabase.from('programmes').select('id').eq('id', day.programme_id).eq('coach_id', user.id).single()
  if (!prog) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (title !== undefined) {
    await supabase.from('programme_days').update({ title }).eq('id', day_id)
  }

  if (exercises !== undefined) {
    // Replace all exercises for this day
    await supabase.from('programme_day_exercises').delete().eq('programme_day_id', day_id)
    if (exercises.length) {
      const rows = exercises.map((ex: { exercise_name: string; sets?: number; reps?: number; weight_kg?: number; rest_seconds?: number; notes?: string }, i: number) => ({
        programme_day_id: day_id,
        exercise_name: ex.exercise_name,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        weight_kg: ex.weight_kg ?? null,
        rest_seconds: ex.rest_seconds ?? null,
        notes: ex.notes ?? null,
        position: i,
      }))
      await supabase.from('programme_day_exercises').insert(rows)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { day_id } = await req.json()

  const { data: day } = await supabase.from('programme_days').select('id, programme_id').eq('id', day_id).single()
  if (!day) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: prog } = await supabase.from('programmes').select('id').eq('id', day.programme_id).eq('coach_id', user.id).single()
  if (!prog) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('programme_days').delete().eq('id', day_id)
  return NextResponse.json({ ok: true })
}
