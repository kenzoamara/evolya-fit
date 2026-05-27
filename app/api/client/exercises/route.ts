import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/client/exercises?token=xxx
// Returns global exercises + coach's exercises for autocomplete
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ exercises: [] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: client } = await supabase
    .from('clients')
    .select('id, coach_id')
    .eq('magic_token', token)
    .single()

  if (!client) return NextResponse.json({ exercises: [] })

  const { data } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_group')
    .or(`is_global.eq.true,coach_id.eq.${client.coach_id}`)
    .order('name', { ascending: true })
    .limit(500)

  return NextResponse.json({ exercises: (data ?? []).map(e => e.name) })
}
