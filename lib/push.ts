import webpush from 'web-push'
import { createAdminClient } from './supabase/admin'

/**
 * Envoie une push notification Web à tous les appareils enregistrés d'un coach.
 * Fire & forget — ne lève pas d'exception.
 */
export async function sendCoachPushNotification(
  coachId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  try {
    const vapidSubject  = process.env.VAPID_SUBJECT
    const vapidPublic   = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate  = process.env.VAPID_PRIVATE_KEY

    if (!vapidSubject || !vapidPublic || !vapidPrivate) return

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

    const admin = createAdminClient()
    const { data: subs } = await admin
      .from('coach_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('coach_id', coachId)

    if (!subs || subs.length === 0) return

    const data = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      url:   payload.url ?? '/',
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        )
      )
    )

    // Nettoyer les subscriptions expirées (410 Gone / 404)
    const expired: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number }
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expired.push(subs[i].endpoint)
        }
      }
    })

    if (expired.length > 0) {
      await admin.from('coach_push_subscriptions')
        .delete()
        .in('endpoint', expired)
    }
  } catch {
    // silent — les push notifications ne doivent jamais bloquer les routes métier
  }
}
