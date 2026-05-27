import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyAccess(clientId: string, token?: string | null): Promise<{ allowed: boolean; isCoach: boolean }> {
  const admin = createAdminClient()

  if (token) {
    const { data: client } = await admin
      .from('clients')
      .select('id, magic_token, token_expires_at')
      .eq('id', clientId)
      .single()
    if (!client) return { allowed: false, isCoach: false }
    const expired = new Date(client.token_expires_at) < new Date()
    if (client.magic_token === token && !expired) return { allowed: true, isCoach: false }
    return { allowed: false, isCoach: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, isCoach: false }

  const { data: client } = await admin
    .from('clients')
    .select('coach_id')
    .eq('id', clientId)
    .single()
  if (!client) return { allowed: false, isCoach: false }

  if (client.coach_id === user.id) return { allowed: true, isCoach: true }
  return { allowed: false, isCoach: false }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  const token = searchParams.get('token')
  if (!clientId) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  const { allowed } = await verifyAccess(clientId, token)
  if (!allowed) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('workout_difficulty_ratings')
    .select('id, date, score, comment')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_id, date, score, comment, token } = body

  if (!client_id || !date || score == null) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }
  if (score < 1 || score > 10) {
    return NextResponse.json({ error: 'Score invalide' }, { status: 400 })
  }

  const { allowed, isCoach } = await verifyAccess(client_id, token)
  if (!allowed || isCoach) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('workout_difficulty_ratings')
    .upsert(
      { client_id, date, score, comment: comment ?? null },
      { onConflict: 'client_id,date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
