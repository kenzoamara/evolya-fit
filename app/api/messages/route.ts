import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages?token=xxx  (client via magic token)
// GET /api/messages?clientId=xxx  (coach authenticated)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const clientId = searchParams.get('clientId')
    const admin = createAdminClient()

    if (token) {
      // Client via magic token
      const { data: client } = await admin
        .from('clients')
        .select('id')
        .eq('magic_token', token)
        .gt('token_expires_at', new Date().toISOString())
        .single()

      if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

      const { data: messages } = await admin
        .from('messages')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: true })
        .limit(200)

      // Marquer messages coach comme lus
      await admin.from('messages').update({ read_by_client: true })
        .eq('client_id', client.id)
        .eq('sender_role', 'coach')
        .eq('read_by_client', false)

      return NextResponse.json({ messages: messages ?? [] })
    }

    if (clientId) {
      // Coach authentifié
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

      const { data: messages } = await admin
        .from('messages')
        .select('*')
        .eq('client_id', clientId)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: true })
        .limit(200)

      // Marquer messages client comme lus
      await admin.from('messages').update({ read_by_coach: true })
        .eq('client_id', clientId)
        .eq('coach_id', user.id)
        .eq('sender_role', 'client')
        .eq('read_by_coach', false)

      return NextResponse.json({ messages: messages ?? [] })
    }

    return NextResponse.json({ error: 'Paramètre manquant.' }, { status: 400 })
  } catch (err) {
    console.error('[messages/GET]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// POST /api/messages
// Body: { token, content }  — client
// Body: { clientId, content } — coach (authentifié)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, clientId, content } = body
    const admin = createAdminClient()

    if (!content?.trim()) return NextResponse.json({ error: 'Message vide.' }, { status: 400 })

    if (token) {
      // Client envoie un message
      const { data: client } = await admin
        .from('clients')
        .select('id, coach_id')
        .eq('magic_token', token)
        .gt('token_expires_at', new Date().toISOString())
        .single()

      if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

      const { data: message, error } = await admin.from('messages').insert({
        client_id: client.id,
        coach_id: client.coach_id,
        sender_role: 'client',
        content: content.trim(),
        reply_to_id: body.reply_to_id ?? null,
      }).select().single()

      if (error) return NextResponse.json({ error: 'Erreur envoi.' }, { status: 500 })
      return NextResponse.json({ message })
    }

    if (clientId) {
      // Coach envoie un message
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

      const { data: message, error } = await admin.from('messages').insert({
        client_id: clientId,
        coach_id: user.id,
        sender_role: 'coach',
        content: content.trim(),
        reply_to_id: body.reply_to_id ?? null,
      }).select().single()

      if (error) return NextResponse.json({ error: 'Erreur envoi.' }, { status: 500 })

      // Récupérer le token de l'membre pour construire l'URL de notif
      const { data: clientData } = await admin
        .from('clients')
        .select('magic_token, full_name')
        .eq('id', clientId)
        .single()

      // Envoyer la push notification à l'membre (fire & forget)
      if (clientData?.magic_token) {
        const notifUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.evolyafit.fr'}/c/${clientData.magic_token}/messages`
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.evolyafit.fr'}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            title: 'Nouveau message de votre coach',
            body: content.trim().length > 80 ? content.trim().slice(0, 80) + '…' : content.trim(),
            url: notifUrl,
          }),
        }).catch(() => { /* silent fail */ })
      }

      return NextResponse.json({ message })
    }

    return NextResponse.json({ error: 'Paramètre manquant.' }, { status: 400 })
  } catch (err) {
    console.error('[messages/POST]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
