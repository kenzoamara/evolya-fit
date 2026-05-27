import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { programme_id, client_id, start_date } = await req.json()

  const { data: prog } = await supabase.from('programmes').select('id').eq('id', programme_id).eq('coach_id', user.id).single()
  if (!prog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Deactivate any existing active assignment for this client+programme
  await supabase
    .from('programme_assignments')
    .update({ active: false })
    .eq('programme_id', programme_id)
    .eq('client_id', client_id)
    .eq('active', true)

  const { data: assignment, error } = await supabase
    .from('programme_assignments')
    .insert({ programme_id, client_id, coach_id: user.id, start_date, active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignment })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assignment_id } = await req.json()

  await supabase
    .from('programme_assignments')
    .update({ active: false })
    .eq('id', assignment_id)
    .eq('coach_id', user.id)

  return NextResponse.json({ ok: true })
}
