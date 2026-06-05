import { getFirebaseAdmin } from './firebase-admin'
import { createAdminClient } from './supabase/admin'

type PushPayload = { title: string; body: string; url?: string }

/**
 * Envoie une notification push native (FCM/APNs) aux utilisateurs donnés.
 * - userIds : ids auth (coach ou élève) destinataires.
 * - Fire & forget : à appeler sans bloquer la réponse. Toujours encapsuler en try/catch.
 * - Nettoie automatiquement les tokens invalides.
 */
export async function sendNativePush(userIds: (string | null | undefined)[], payload: PushPayload): Promise<void> {
  const fb = getFirebaseAdmin()
  if (!fb) return

  const ids = Array.from(new Set(userIds.filter(Boolean) as string[]))
  if (ids.length === 0) return

  const sb = createAdminClient()
  const { data: rows } = await sb
    .from('native_push_tokens')
    .select('token')
    .in('user_id', ids)

  const tokens = Array.from(new Set((rows ?? []).map((r) => r.token).filter(Boolean)))
  if (tokens.length === 0) return

  const res = await fb.messaging().sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: payload.url ? { url: payload.url } : undefined,
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    android: { priority: 'high', notification: { sound: 'default' } },
  })

  // Purge des tokens invalides/expirés
  const dead: string[] = []
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code ?? ''
      if (
        code.includes('registration-token-not-registered') ||
        code.includes('invalid-registration-token') ||
        code.includes('invalid-argument')
      ) dead.push(tokens[i])
    }
  })
  if (dead.length) await sb.from('native_push_tokens').delete().in('token', dead)
}
