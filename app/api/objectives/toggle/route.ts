import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { magic_token, objective_id, done } = await req.json()
    if (!magic_token || !objective_id) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier que le magic_token correspond à un client valide
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('magic_token', magic_token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Token invalide.' }, { status: 403 })
    }

    // Vérifier que l'objectif appartient bien à ce client
    const { data: objective } = await admin
      .from('objectives')
      .select('id, client_id')
      .eq('id', objective_id)
      .eq('client_id', client.id)
      .single()

    if (!objective) {
      return NextResponse.json({ error: 'Objectif introuvable.' }, { status: 404 })
    }

    const newStatus = done ? 'done' : 'todo'
    await admin.from('objectives').update({
      status: newStatus,
      completed_at: done ? new Date().toISOString() : null,
    }).eq('id', objective_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/objectives/toggle]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
