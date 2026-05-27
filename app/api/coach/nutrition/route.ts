import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/coach/nutrition?clientId=xxx
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
  const { data: programme } = await admin
    .from('nutrition_programmes')
    .select('id, title, content, active')
    .eq('client_id', clientId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ programme: programme ?? null })
}

// POST /api/coach/nutrition — create or update programme
export async function POST(req: Request) {
  const { clientId, title, content } = await req.json()
  if (!clientId || !content?.trim()) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('coach_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const admin = createAdminClient()

  // Deactivate existing programmes
  await admin.from('nutrition_programmes').update({ active: false }).eq('client_id', clientId)

  const { data: programme, error } = await admin
    .from('nutrition_programmes')
    .insert({ client_id: clientId, title: title?.trim() || 'Programme nutritionnel', content: content.trim(), active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ programme })
}
