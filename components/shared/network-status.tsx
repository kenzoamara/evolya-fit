'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/**
 * Indicateur global d'état réseau + message d'erreur uniforme.
 * - Affiche un bandeau "Pas de connexion" à la marque quand l'appareil est hors ligne.
 * - Toast cohérent quand une action échoue à cause du réseau (fetch).
 * Monté une fois dans le layout racine. No-op visuel quand tout va bien.
 */
export function NetworkStatus() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()

    const onOnline = () => { setOffline(false); toast.success('Connexion rétablie') }
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Message uniforme quand une action échoue (échec réseau non géré)
    let last = 0
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = String((e?.reason && (e.reason.message ?? e.reason)) ?? '')
      const isNetwork = !navigator.onLine || /fetch|network|load failed/i.test(msg)
      if (!isNetwork) return
      const now = Date.now()
      if (now - last < 4000) return // anti-spam
      last = now
      toast.error(
        !navigator.onLine
          ? 'Pas de connexion internet. Réessaie une fois reconnecté.'
          : 'Une erreur est survenue. Réessaie dans un instant.'
      )
    }
    window.addEventListener('unhandledrejection', onRejection)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 z-[9998] flex items-center justify-center gap-2 text-[12.5px] font-semibold text-white"
      style={{
        top: 0,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        paddingBottom: 8,
        background: '#0D1F3C',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
      Pas de connexion internet
    </div>
  )
}
