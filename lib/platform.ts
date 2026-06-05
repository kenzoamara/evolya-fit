// Détection du contexte d'exécution : web classique vs app native Capacitor.
// Utilisé notamment pour masquer l'achat d'abonnement dans l'app iOS
// (règle App Store 3.1.1 — les biens numériques doivent passer par l'achat
// intégré Apple ; on renvoie donc le paiement vers le web).

type CapWindow = {
  Capacitor?: {
    isNativePlatform?: () => boolean
    getPlatform?: () => string
  }
}

export function getAppPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const w = window as unknown as CapWindow
  const p = w.Capacitor?.getPlatform?.()
  if (p === 'ios' || p === 'android') return p
  // Repli sur le marqueur User-Agent injecté par capacitor.config.ts
  const ua = navigator.userAgent || ''
  if (/EvolyaApp-ios/i.test(ua)) return 'ios'
  if (/EvolyaApp-android/i.test(ua)) return 'android'
  return 'web'
}

export function isNativeApp(): boolean {
  return getAppPlatform() !== 'web'
}

export function isIOSApp(): boolean {
  return getAppPlatform() === 'ios'
}
