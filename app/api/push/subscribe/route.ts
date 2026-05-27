import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/push/subscribe
// Body: { token, subscription: { endpoint, keys: { p256dh, auth } } }
export async function POST(req: Request) {
  try {
    const { token, subscription } = await req.json()

    if (!token || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Résoudre l'identité via magic token
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('magic_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

    // Upsert — si l'endpoint existe déjà on le met à jour
    await admin.from('push_subscriptions').upsert({
      client_id: client.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: 'client_id,endpoint' })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// DELETE /api/push/subscribe
// Body: { token, endpoint }
export async function DELETE(req: Request) {
  try {
    const { token, endpoint } = await req.json()
    if (!token || !endpoint) return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('magic_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

    await admin.from('push_subscriptions')
      .delete()
      .eq('client_id', client.id)
      .eq('endpoint', endpoint)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe DELETE]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
