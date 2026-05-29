import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// GET /api/client/workout/overview?token=xxx
// Returns all programme days with completion status + exercise counts
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

  // Get active sport assignment
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

  const prog = (Array.isArray(assignment.programmes) ? assignment.programmes[0] : assignment.programmes) as {
    id: string; title: string; duration_days: number | null
  }

  // Compute today's effective day number
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(assignment.start_date)
  start.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000)
  const dayNumber = diffDays + 1 // 1-based, can be < 1 if start is in future

  // All days with exercise count
  const { data: days } = await supabase
    .from('programme_days')
    .select('id, day_number, title, phase, programme_day_exercises(id)')
    .eq('programme_id', prog.id)
    .order('day_number', { ascending: true })

  if (!days?.length) return NextResponse.json({ assignment: null })

  const totalDays = days.length
  const effectiveDay = dayNumber >= 1 ? ((dayNumber - 1) % totalDays) + 1 : 1

  // All completed logs for this assignment
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('programme_day_id, completed')
    .eq('assignment_id', assignment.id)
    .eq('completed', true)

  const completedDayIds = new Set((logs ?? []).map(l => l.programme_day_id))

  const enrichedDays = days.map(d => ({
    id: d.id,
    day_number: d.day_number,
    title: d.title,
    phase: (d as { phase?: number }).phase ?? 1,
    exercise_count: Array.isArray(d.programme_day_exercises) ? d.programme_day_exercises.length : 0,
    completed: completedDayIds.has(d.id),
    is_today: d.day_number === effectiveDay,
  }))

  const completedCount = enrichedDays.filter(d => d.completed).length

  return NextResponse.json({
    programme: { id: prog.id, title: prog.title },
    assignment: { id: assignment.id, start_date: assignment.start_date },
    days: enrichedDays,
    stats: { completed: completedCount, total: totalDays },
    effectiveDay,
    dayNumber,
  })
}
