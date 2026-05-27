import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function resolveClient(token: string) {
  const { data } = await supabase().from('clients').select('id').eq('magic_token', token).single()
  return data
}

// POST /api/client/habitudes/manage  → create a personal habit
export async function POST(req: NextRequest) {
  const { token, name, emoji } = await req.json()
  if (!token || !name?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const client = await resolveClient(token)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: maxPos } = await supabase()
    .from('habits')
    .select('position')
    .eq('client_id', client.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const { data: habit, error } = await supabase()
    .from('habits')
    .insert({ client_id: client.id, name: name.trim(), emoji: emoji ?? '✅', source: 'client', active: true, position: (maxPos?.position ?? -1) + 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit })
}

// DELETE /api/client/habitudes/manage?token=xxx&id=yyy  → delete a personal habit
export async function DELETE(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const id = req.nextUrl.searchParams.get('id')
  if (!token || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const client = await resolveClient(token)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase()
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('client_id', client.id)
    .eq('source', 'client')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
