import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Webhook OpenWA → Evolya
 * Reçoit les messages WhatsApp entrants et les stocke dans la table messages
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, data } = body

    // On ne traite que les messages reçus
    if (event !== 'message.received') {
      return NextResponse.json({ ok: true })
    }

    const { from, body: messageText, sessionId } = data
    if (!from || !messageText || !sessionId) {
      return NextResponse.json({ ok: true })
    }

    const admin = createAdminClient()

    // Extraire le numéro de téléphone depuis le chatId "33612345678@c.us"
    const phoneRaw = from.replace('@c.us', '').replace('@s.whatsapp.net', '')

    // Trouver le coach qui possède cette session
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('whatsapp_session_id', sessionId)
      .single()

    if (!profile) {
      console.warn('[webhook] Session inconnue:', sessionId)
      return NextResponse.json({ ok: true })
    }

    // Trouver le client par son numéro WhatsApp
    const { data: client } = await admin
      .from('clients')
      .select('id, coach_id, magic_token, full_name')
      .eq('coach_id', profile.id)
      .or(`whatsapp_phone.eq.${phoneRaw},whatsapp_phone.eq.+${phoneRaw},whatsapp_phone.eq.0${phoneRaw.slice(2)}`)
      .single()

    if (!client) {
      console.warn('[webhook] Client introuvable pour le numéro:', phoneRaw)
      return NextResponse.json({ ok: true })
    }

    // Insérer le message dans la messagerie Evolya
    await admin.from('messages').insert({
      client_id: client.id,
      coach_id: client.coach_id,
      sender_role: 'client',
      content: messageText,
      via_whatsapp: true,
    })

    // Notifier le coach par push notification
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.evolyafit.fr'
    fetch(`${siteUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: client.id,
        title: `WhatsApp — ${client.full_name}`,
        body: messageText.length > 80 ? messageText.slice(0, 80) + '…' : messageText,
        url: `${siteUrl}/messages?clientId=${client.id}`,
        coachId: client.coach_id,
      }),
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp/webhook]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
