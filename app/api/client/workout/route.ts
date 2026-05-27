import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// GET /api/client/workout?token=xxx  → today's workout for client
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

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

  // Get active sport assignment only (filter type = 'sportif' to avoid picking up habits/nutrition programmes)
  const { data: assignment } = await supabase
    .from('programme_assignments')
    .select('id, start_date, programme_id, programmes!inner(id, title, duration_days, type)')
    .eq('client_id', client.id)
    .eq('active', true)
    .eq('programmes.type', 'sportif')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!assignment) return NextResponse.json({ assignment: null })

  // Normalize programme (Supabase returns array for FK joins)
  const prog = (Array.isArray(assignment.programmes) ? assignment.programmes[0] : assignment.programmes) as { id: string; title: string; duration_days: number | null }
  const normalizedAssignment = { id: assignment.id, start_date: assignment.start_date, programme: prog }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const startDate = new Date(assignment.start_date)
  const diffMs = today.setHours(0,0,0,0) - startDate.setHours(0,0,0,0)
  const dayNumber = Math.floor(diffMs / 86400000) + 1

  if (dayNumber < 1) return NextResponse.json({ assignment: normalizedAssignment, dayNumber, day: null, todayStr })

  const { data: days } = await supabase
    .from('programme_days')
    .select('id, day_number, title')
    .eq('programme_id', prog.id)
    .order('day_number', { ascending: true })

  if (!days?.length) return NextResponse.json({ assignment: normalizedAssignment, dayNumber, day: null, todayStr })

  const totalDays = days.length
  const effectiveDay = ((dayNumber - 1) % totalDays) + 1
  const dayTemplate = days.find(d => d.day_number === effectiveDay) ?? days[days.length - 1]

  // Get exercises for that day
  const { data: exercises } = await supabase
    .from('programme_day_exercises')
    .select('id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, position')
    .eq('programme_day_id', dayTemplate.id)
    .order('position', { ascending: true })

  // Enrich exercises with library instructions (match by name, case-insensitive)
  const exerciseNames = (exercises ?? []).map(e => e.exercise_name).filter(Boolean)
  const libraryMap: Record<string, { instructions: string; category: string; muscle_group: string }> = {}
  if (exerciseNames.length > 0) {
    const { data: libData } = await supabase
      .from('exercises')
      .select('name, instructions, category, muscle_group')
      .in('name', exerciseNames)
    if (libData) {
      for (const e of libData) libraryMap[e.name.toLowerCase()] = e
    }
  }
  const enrichedExercises = (exercises ?? []).map(ex => ({
    ...ex,
    library_instructions: libraryMap[ex.exercise_name?.toLowerCase()]?.instructions ?? null,
    library_category: libraryMap[ex.exercise_name?.toLowerCase()]?.category ?? null,
    library_muscle_group: libraryMap[ex.exercise_name?.toLowerCase()]?.muscle_group ?? null,
  }))

  // Check if already logged today
  const { data: log } = await supabase
    .from('workout_logs')
    .select('id, completed, exercise_logs(id, programme_day_exercise_id, set_number, reps_done, weight_kg, notes)')
    .eq('assignment_id', assignment.id)
    .eq('log_date', todayStr)
    .single()

  return NextResponse.json({
    assignment: { id: assignment.id, start_date: assignment.start_date, programme: prog },
    dayNumber,
    effectiveDay,
    totalDays,
    day: { ...dayTemplate, exercises: enrichedExercises },
    log: log ?? null,
    todayStr,
  })
}

// POST /api/client/workout  → save/update workout log (assigned or free-form)
export async function POST(req: NextRequest) {
  const { token, assignment_id, programme_day_id, log_date, exercise_logs, completed, session_title } = await req.json()

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let log
  if (assignment_id) {
    // Assigned programme workout: upsert by (assignment_id, log_date)
    const { data, error } = await supabase
      .from('workout_logs')
      .upsert(
        { assignment_id, programme_day_id, client_id: client.id, log_date, completed: completed ?? false },
        { onConflict: 'assignment_id,log_date' }
      )
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    log = data
  } else {
    // Free-form workout: insert a new log (no unique constraint on nulls)
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ assignment_id: null, programme_day_id: null, client_id: client.id, log_date, completed: completed ?? false, notes: session_title ?? null })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    log = data
  }

  // Replace exercise logs for this workout
  if (exercise_logs?.length) {
    await supabase.from('exercise_logs').delete().eq('workout_log_id', log.id)
    const rows = exercise_logs.map((el: {
      programme_day_exercise_id?: string | null
      exercise_name?: string | null
      set_number: number
      reps_done: number | null
      weight_kg: number | null
      notes: string | null
    }) => ({
      workout_log_id: log.id,
      programme_day_exercise_id: el.programme_day_exercise_id ?? null,
      exercise_name: el.exercise_name ?? null,
      set_number: el.set_number,
      reps_done: el.reps_done ?? null,
      weight_kg: el.weight_kg ?? null,
      notes: el.notes ?? null,
    }))
    await supabase.from('exercise_logs').insert(rows)
  }

  return NextResponse.json({ ok: true, log_id: log.id })
}
