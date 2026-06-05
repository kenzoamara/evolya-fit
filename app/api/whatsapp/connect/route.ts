import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSession, getQRCode, setWebhook } from '@/lib/whatsapp'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const sessionName = `evolya-${user.id.replace(/-/g, '').slice(0, 16)}`
    const admin = createAdminClient()

    // Créer et démarrer la session — récupère l'UUID interne
    const { ok, uuid, error } = await createSession(sessionName)
    if (!ok || !uuid) return NextResponse.json({ error: `OpenWA: ${error}` }, { status: 500 })

    // Configurer le webhook pour recevoir les messages entrants
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.evolyafit.fr'
    await setWebhook(uuid, `${siteUrl}/api/whatsapp/webhook`)

    // Sauvegarder l'UUID en base (pas le nom)
    await admin.from('profiles').update({ whatsapp_session_id: uuid }).eq('id', user.id)

    // Récupérer le QR code
    const { qr, status } = await getQRCode(uuid)

    return NextResponse.json({ sessionId: uuid, qr, status })
  } catch (err) {
    console.error('[whatsapp/connect]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
