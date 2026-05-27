import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SessionInsert = {
  client_id: string
  coach_id: string
  session_date: string
  session_time?: string | null
  notes: string
  private_notes: string
}

export async function POST(req: Request) {
  try {
    const { sessions } = await req.json() as { sessions: SessionInsert[] }
    if (!sessions?.length) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    // Vérifier l'authentification du coach
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Vérifier que tous les clients appartiennent à ce coach
    const clientIds = Array.from(new Set(sessions.map(s => s.client_id)))
    const { data: clients } = await admin
      .from('clients')
      .select('id')
      .in('id', clientIds)
      .eq('coach_id', user.id)

    if (!clients || clients.length !== clientIds.length) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    // Forcer coach_id = user.id sur toutes les entrées
    const inserts = sessions.map(s => ({ ...s, coach_id: user.id }))

    const { data, error } = await admin.from('sessions').insert(inserts).select()
    if (error) {
      console.error('[api/sessions/create]', error)
      return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, sessions: data })
  } catch (err) {
    console.error('[api/sessions/create]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
