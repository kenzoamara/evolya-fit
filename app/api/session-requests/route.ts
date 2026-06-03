import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST — client demande un créneau (via magic token)
export async function POST(req: Request) {
  const { token, requested_date, requested_time, duration_minutes, note } = await req.json()
  if (!token || !requested_date || !requested_time) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id, full_name')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

  const { data, error } = await admin
    .from('session_requests')
    .insert({
      client_id:        client.id,
      coach_id:         client.coach_id,
      requested_date,
      requested_time,
      duration_minutes: duration_minutes ?? 60,
      note:             note?.trim() || null,
    } as never)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data })
}

// GET — coach liste ses demandes en attente
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'
  const admin = createAdminClient()

  const { data } = await admin
    .from('session_requests')
    .select('*, clients(full_name, magic_token)')
    .eq('coach_id', user.id)
    .eq('status', status)
    .order('requested_date')
    .order('requested_time')

  return NextResponse.json({ requests: data ?? [] })
}

// PATCH — coach confirme ou décline
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !['confirmed', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Récupérer la demande
  const { data: req_ } = await admin
    .from('session_requests')
    .select('*, clients(full_name)')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  if (!req_) return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })

  let sessionId: string | null = null

  // Si confirmé → créer la session dans le planning
  if (status === 'confirmed') {
    const { data: session, error: sessionError } = await admin
      .from('sessions')
      .insert({
        coach_id:      user.id,
        client_id:     req_.client_id,
        session_date:  req_.requested_date,
        session_time:  req_.requested_time,
        notes:         req_.note ?? '',
        private_notes: `duration:${req_.duration_minutes ?? 60}`,
        attendance:    'scheduled',
      } as never)
      .select('id')
      .single()
    if (sessionError) console.error('[session-requests/PATCH] session insert error:', sessionError.message)
    sessionId = session?.id ?? null
  }

  await admin
    .from('session_requests')
    .update({ status, ...(sessionId ? { session_id: sessionId } : {}) } as never)
    .eq('id', id)

  return NextResponse.json({ success: true, sessionId })
}
