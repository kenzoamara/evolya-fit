import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getCoachAndClient(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId') ?? (await req.clone().json().catch(() => ({}))).clientId
  if (!clientId) return null
  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('coach_id', user.id).single()
  if (!client) return null
  return { coachId: user.id, clientId }
}

// GET /api/coach/habits?clientId=xxx
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('coach_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const admin = createAdminClient()
  const { data: habits } = await admin.from('habits').select('id, name, emoji, active, position').eq('client_id', clientId).order('position')

  // Optional: include habit_logs for streak calculation (?logs=true)
  if (url.searchParams.get('logs') === 'true') {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const { data: logs } = await admin
      .from('habit_logs')
      .select('date')
      .eq('client_id', clientId)
      .eq('completed', true)
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
    return NextResponse.json({ habits: habits ?? [], logs: logs ?? [] })
  }

  return NextResponse.json({ habits: habits ?? [] })
}

// POST /api/coach/habits — create habit
export async function POST(req: Request) {
  const body = await req.json()
  const { clientId, name, emoji } = body
  if (!clientId || !name?.trim()) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('coach_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const admin = createAdminClient()
  const { data: last } = await admin.from('habits').select('position').eq('client_id', clientId).order('position', { ascending: false }).limit(1).single()
  const position = (last?.position ?? -1) + 1

  const { data: habit, error } = await admin
    .from('habits')
    .insert({ client_id: clientId, name: name.trim(), emoji: emoji?.trim() || '✅', position })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit })
}

// DELETE /api/coach/habits?clientId=xxx&id=xxx
export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId')
  const id = url.searchParams.get('id')
  if (!clientId || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('coach_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const admin = createAdminClient()
  await admin.from('habits').delete().eq('id', id).eq('client_id', clientId)
  return NextResponse.json({ ok: true })
}
