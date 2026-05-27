import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(req: Request) {
  try {
    const { token, objectiveId } = await req.json()
    if (!token || !objectiveId) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('magic_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 403 })

    // Vérifier que l'objectif appartient à ce client
    const { data: objective } = await admin
      .from('objectives')
      .select('id, client_id')
      .eq('id', objectiveId)
      .eq('client_id', client.id)
      .single()

    if (!objective) return NextResponse.json({ error: 'Objectif introuvable.' }, { status: 404 })

    const { error } = await admin.from('objectives').delete().eq('id', objectiveId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/objectives/client-delete]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
