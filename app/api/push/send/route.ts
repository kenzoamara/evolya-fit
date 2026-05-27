import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/push/send  (usage interne uniquement)
// Body: { clientId, title, body, url }
export async function POST(req: Request) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const { clientId, title, body, url } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'clientId manquant.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('client_id', clientId)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const payload = JSON.stringify({
      title: title || "Evolya'Fit",
      body: body || 'Nouveau message de votre coach.',
      url: url || '/',
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Nettoyer les subscriptions expirées (410 Gone)
    const expired: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number }
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expired.push(subscriptions[i].endpoint)
        }
      }
    })

    if (expired.length > 0) {
      await admin.from('push_subscriptions')
        .delete()
        .in('endpoint', expired)
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent })
  } catch (err) {
    console.error('[push/send]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
