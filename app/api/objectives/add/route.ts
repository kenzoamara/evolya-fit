import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const {
      clientId, title,
      type, series_count, reps_count, distance_km, duration_seconds,
      description, targetDate,
    } = await req.json()

    if (!clientId || !title?.trim()) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })
    }

    const { data, error } = await admin.from('objectives').insert({
      client_id: clientId,
      coach_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      target_date: targetDate || null,
      status: 'todo',
      type: type || null,
      series_count: series_count || null,
      reps_count: reps_count || null,
      distance_km: distance_km || null,
      duration_seconds: duration_seconds || null,
    }).select().single()

    if (error) {
      console.error('[api/objectives/add]', error)
      return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, objective: data })
  } catch (err) {
    console.error('[api/objectives/add]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
