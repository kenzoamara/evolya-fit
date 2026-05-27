import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { programme_id } = await req.json()

  const { data: original } = await supabase
    .from('programmes')
    .select('*, programme_days(*, programme_day_exercises(*))')
    .eq('id', programme_id)
    .eq('coach_id', user.id)
    .single()

  if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: newProg, error } = await supabase
    .from('programmes')
    .insert({
      coach_id: user.id,
      title: `Copie de ${original.title}`,
      type: original.type,
      description: original.description,
      duration_days: original.duration_days,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const days = (original.programme_days ?? []).sort((a: { day_number: number }, b: { day_number: number }) => a.day_number - b.day_number)

  for (const day of days) {
    const { data: newDay } = await supabase
      .from('programme_days')
      .insert({ programme_id: newProg.id, day_number: day.day_number, title: day.title, notes: day.notes })
      .select()
      .single()

    if (newDay && day.programme_day_exercises?.length) {
      await supabase.from('programme_day_exercises').insert(
        day.programme_day_exercises.map((ex: {
          exercise_name: string; sets: number | null; reps: number | null
          weight_kg: number | null; rest_seconds: number | null; notes: string | null; position: number
        }) => ({
          programme_day_id: newDay.id,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          position: ex.position,
        }))
      )
    }
  }

  return NextResponse.json({ programme: newProg })
}
