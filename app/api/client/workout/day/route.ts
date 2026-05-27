import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// GET /api/client/workout/day?token=xxx&day_id=xxx
// Returns exercises for any specific day (read-only preview)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const dayId = req.nextUrl.searchParams.get('day_id')
  if (!token || !dayId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Resolve client
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get day info
  const { data: day } = await supabase
    .from('programme_days')
    .select('id, day_number, title, programme_id')
    .eq('id', dayId)
    .single()
  if (!day) return NextResponse.json({ error: 'Day not found' }, { status: 404 })

  // Verify client has access to this programme via assignment
  const { data: assignment } = await supabase
    .from('programme_assignments')
    .select('id')
    .eq('client_id', client.id)
    .eq('programme_id', day.programme_id)
    .eq('active', true)
    .single()
  if (!assignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get exercises
  const { data: exercises } = await supabase
    .from('programme_day_exercises')
    .select('id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, position')
    .eq('programme_day_id', dayId)
    .order('position', { ascending: true })

  // Enrich with library instructions
  const names = (exercises ?? []).map(e => e.exercise_name).filter(Boolean)
  const libraryMap: Record<string, { instructions: string; category: string; muscle_group: string }> = {}
  if (names.length > 0) {
    const { data: libData } = await supabase
      .from('exercises')
      .select('name, instructions, category, muscle_group')
      .in('name', names)
    if (libData) {
      for (const e of libData) libraryMap[e.name.toLowerCase()] = e
    }
  }

  const enriched = (exercises ?? []).map(ex => ({
    ...ex,
    library_instructions: libraryMap[ex.exercise_name?.toLowerCase()]?.instructions ?? null,
    library_category: libraryMap[ex.exercise_name?.toLowerCase()]?.category ?? null,
    library_muscle_group: libraryMap[ex.exercise_name?.toLowerCase()]?.muscle_group ?? null,
  }))

  return NextResponse.json({
    day: { ...day, exercises: enriched },
  })
}
