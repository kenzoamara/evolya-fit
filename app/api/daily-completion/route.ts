import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// ─── Helper : vérifie l'accès et retourne le client_id validé ───────────────
async function verifyAccess(clientId: string, token?: string | null): Promise<boolean> {
  const admin = createAdminClient()

  if (token) {
    // Auth via magic token (espace client public)
    const { data } = await admin
      .from('clients')
      .select('id')
      .eq('magic_token', token)
      .eq('id', clientId)
      .single()
    return !!data
  }

  // Auth via Supabase session (espace coach)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  return !!data
}

// ─── GET : liste les completions d'une semaine ────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const token = searchParams.get('token')

  if (!clientId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const allowed = await verifyAccess(clientId, token)
  if (!allowed) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('daily_completions')
    .select('objective_id, completed_date')
    .eq('client_id', clientId)
    .gte('completed_date', startDate)
    .lte('completed_date', endDate)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ─── POST : toggle une completion (insert ou delete) ─────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_id, objective_id, completed_date, token } = body

  if (!client_id || !objective_id || !completed_date) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const allowed = await verifyAccess(client_id, token)
  if (!allowed) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createAdminClient()

  // Vérifie si déjà coché
  const { data: existing } = await admin
    .from('daily_completions')
    .select('id')
    .eq('client_id', client_id)
    .eq('objective_id', objective_id)
    .eq('completed_date', completed_date)
    .single()

  if (existing) {
    // Décocher → supprimer
    const { error } = await admin
      .from('daily_completions')
      .delete()
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'deleted' })
  } else {
    // Cocher → insérer
    const { error } = await admin
      .from('daily_completions')
      .insert({ client_id, objective_id, completed_date })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'inserted' })
  }
}
