import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/clients/list
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .eq('coach_id', user.id)
    .order('first_name')

  return NextResponse.json({ clients: clients ?? [] })
}
