'use client'

import { useEffect } from 'react'
import { isNativeApp, getAppPlatform } from '@/lib/platform'

/**
 * Pont natif — ne fait rien sur le web.
 * Dans l'app Capacitor (iOS/Android) : demande la permission de notifications,
 * enregistre l'appareil et envoie le token push au backend.
 * Tout est encapsulé dans des try/catch : si le plugin n'est pas dispo
 * (web) ou non configuré (FCM/APNs absents), on ignore silencieusement.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return

    let removeListeners = () => {}

    ;(async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')

        const perm = await PushNotifications.requestPermissions()
        if (perm.receive !== 'granted') return

        await PushNotifications.register()

        const reg = await PushNotifications.addListener('registration', (token) => {
          fetch('/api/push/native-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value, platform: getAppPlatform() }),
          }).catch(() => {})
        })

        const regErr = await PushNotifications.addListener('registrationError', () => {})

        removeListeners = () => {
          reg.remove().catch(() => {})
          regErr.remove().catch(() => {})
        }
      } catch {
        // plugin indisponible / non configuré — no-op
      }
    })()

    return () => removeListeners()
  }, [])

  return null
}
