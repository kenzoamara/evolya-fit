'use client'

import { useSearchParams } from 'next/navigation'

/**
 * Retourne true quand le coach consulte l'espace client en mode spectateur (?coach=1).
 * En mode spectateur : données privées masquées, actions désactivées.
 */
export function useIsCoachView(): boolean {
  const searchParams = useSearchParams()
  return searchParams.get('coach') === '1'
}
