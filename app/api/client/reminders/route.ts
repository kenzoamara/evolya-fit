import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST { action: 'dismiss', reminderId, clientId, token }
export async function POST(req: Request) {
  try {
    const { action, reminderId, clientId, token } = await req.json()

    if (!reminderId || !clientId || !token) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier l'accès via magic token
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('magic_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    if (action === 'dismiss') {
      const { error } = await admin
        .from('client_reminders')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', reminderId)
        .eq('client_id', clientId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
  } catch (err) {
    console.error('[client/reminders]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
