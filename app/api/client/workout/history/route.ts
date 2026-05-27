import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: rawLogs } = await supabase
    .from('workout_logs')
    .select(`
      id, log_date, completed, notes,
      programme_day:programme_day_id (day_number, title),
      exercise_logs (
        set_number, reps_done, weight_kg, exercise_name,
        programme_day_exercise:programme_day_exercise_id (exercise_name)
      )
    `)
    .eq('client_id', client.id)
    .order('log_date', { ascending: false })
    .limit(30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs = (rawLogs ?? []).map((log: any) => ({
    ...log,
    exercise_logs: (log.exercise_logs ?? []).map((el: {
      set_number: number
      reps_done: number | null
      weight_kg: number | null
      exercise_name: string | null
      programme_day_exercise: { exercise_name: string } | { exercise_name: string }[] | null
    }) => {
      const pde = Array.isArray(el.programme_day_exercise) ? el.programme_day_exercise[0] : el.programme_day_exercise
      return {
        exercise_name: pde?.exercise_name ?? el.exercise_name ?? '—',
        set_number: el.set_number,
        reps_done: el.reps_done,
        weight_kg: el.weight_kg,
      }
    }),
  }))

  return NextResponse.json({ logs })
}
