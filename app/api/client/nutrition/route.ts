import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveClient(token: string) {
  const supabase = getSupabase()
  const { data } = await supabase.from('clients').select('id').eq('magic_token', token).single()
  return data?.id ?? null
}

// GET /api/client/nutrition?token=xxx
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const clientId = await resolveClient(token)
  if (!clientId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = getSupabase()

  const [{ data: programme }, { data: logs }] = await Promise.all([
    supabase
      .from('nutrition_programmes')
      .select('id, title, content')
      .eq('client_id', clientId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('nutrition_logs')
      .select('id, date, meal_type, item_name, calories, notes')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({ programme: programme ?? null, logs: logs ?? [] })
}

// POST /api/client/nutrition — add log entry
export async function POST(req: NextRequest) {
  const { token, date, meal_type, item_name, calories, notes } = await req.json()
  if (!token || !date || !meal_type || !item_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const clientId = await resolveClient(token)
  if (!clientId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = getSupabase()
  const { data: log, error } = await supabase
    .from('nutrition_logs')
    .insert({ client_id: clientId, date, meal_type, item_name, calories: calories ?? null, notes: notes ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log })
}

// DELETE /api/client/nutrition?token=xxx&id=xxx
export async function DELETE(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const id = req.nextUrl.searchParams.get('id')
  if (!token || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const clientId = await resolveClient(token)
  if (!clientId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = getSupabase()
  await supabase.from('nutrition_logs').delete().eq('id', id).eq('client_id', clientId)
  return NextResponse.json({ ok: true })
}
