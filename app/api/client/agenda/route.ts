import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// GET /api/client/agenda?token=xxx
// Returns coach sessions + completed workout logs for the client
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = getSupabase()

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: sessions }, { data: workouts }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, session_date, session_time, notes, attendance')
      .eq('client_id', client.id)
      .order('session_date', { ascending: true }),
    supabase
      .from('workout_logs')
      .select('id, log_date, notes, programme_days(title, day_number)')
      .eq('client_id', client.id)
      .eq('completed', true)
      .order('log_date', { ascending: true }),
  ])

  return NextResponse.json({
    sessions: sessions ?? [],
    workouts: workouts ?? [],
  })
}
