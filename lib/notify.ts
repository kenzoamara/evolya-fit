import { toast } from 'sonner'

// Messages d'erreur/succès uniformes (même formulation partout, à la marque).
const DEFAULT_ERROR = 'Une erreur est survenue. Réessaie dans un instant.'
const OFFLINE_ERROR = 'Pas de connexion internet. Réessaie une fois reconnecté.'

export function notifyError(message?: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    toast.error(OFFLINE_ERROR)
    return
  }
  toast.error(message || DEFAULT_ERROR)
}

export function notifySuccess(message: string) {
  toast.success(message)
}
