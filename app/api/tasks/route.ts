import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data, error } = await supabase
    .from('coach_tasks')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { title, due_date } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Titre requis.' }, { status: 400 })

  const { data, error } = await supabase
    .from('coach_tasks')
    .insert({ coach_id: user.id, title: title.trim(), due_date: due_date ?? null, completed: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}
