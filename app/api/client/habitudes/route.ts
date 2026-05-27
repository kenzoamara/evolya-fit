import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveClient(token: string) {
  const { data } = await getSupabase().from('clients').select('id').eq('magic_token', token).single()
  return data?.id ?? null
}

// GET /api/client/habitudes?token=xxx
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const clientId = await resolveClient(token)
  if (!clientId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = getSupabase()
  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, emoji, position, source')
      .eq('client_id', clientId)
      .eq('active', true)
      .order('position', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]),
  ])

  return NextResponse.json({ habits: habits ?? [], logs: logs ?? [] })
}

// POST /api/client/habitudes — toggle habit completion
export async function POST(req: NextRequest) {
  const { token, habit_id, date, completed } = await req.json()
  if (!token || !habit_id || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const clientId = await resolveClient(token)
  if (!clientId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = getSupabase()

  if (!completed) {
    await supabase.from('habit_logs').delete().eq('habit_id', habit_id).eq('client_id', clientId).eq('date', date)
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('habit_logs')
    .upsert({ habit_id, client_id: clientId, date, completed: true }, { onConflict: 'habit_id,date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
