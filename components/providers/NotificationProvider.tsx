'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const PUSH_PROMPTED_KEY = 'push_coach_prompted'

/** Convertit la VAPID public key base64url en ArrayBuffer pour navigator.pushManager */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

async function registerCoachPush(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (!VAPID_PUBLIC_KEY) return

    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
    })

    await fetch('/api/push/coach-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
  } catch {
    // silent — ne pas bloquer si push non supporté ou refusé
  }
}

type Props = {
  coachId: string
  plan: string
}

export function NotificationProvider({ coachId, plan }: Props) {
  // Enregistrement Web Push — demande permission si pas encore accordée
  useEffect(() => {
    if (!('Notification' in window)) return

    const permission = Notification.permission
    if (permission === 'granted') {
      // Déjà accordé — s'assurer que la subscription est à jour
      registerCoachPush()
      return
    }

    if (permission === 'denied') return

    // 'default' — proposer une seule fois par session
    const alreadyPrompted = sessionStorage.getItem(PUSH_PROMPTED_KEY)
    if (alreadyPrompted) return
    sessionStorage.setItem(PUSH_PROMPTED_KEY, '1')

    // Toast avec bouton pour activer
    toast.info('Activez les notifications pour être alerté en temps réel.', {
      duration: 12000,
      action: {
        label: 'Activer',
        onClick: async () => {
          const result = await Notification.requestPermission()
          if (result === 'granted') {
            await registerCoachPush()
            toast.success('Notifications activées.')
          }
        },
      },
    })
  }, [coachId])

  useEffect(() => {
    const supabase = createClient()

    // Écouter les nouvelles notifications ciblant ce coach
    const channel = supabase
      .channel(`notifications-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notif = payload.new as {
            id: string
            target: string
            message: string
            type: 'info' | 'success' | 'warning'
            expires_at: string | null
          }

          // Filtrer côté client : all / plan:X / id coach / (admin skippé ici)
          const matches =
            notif.target === 'all' ||
            notif.target === `plan:${plan}` ||
            notif.target === coachId

          if (!matches) return

          // Afficher un toast selon le type
          const msg = notif.message
          if (notif.type === 'success') {
            toast.success(msg, { duration: 6000 })
          } else if (notif.type === 'warning') {
            toast.warning(msg, { duration: 8000 })
          } else {
            toast.info(msg, { duration: 6000 })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coachId, plan])

  // Écouter les changements de son propre profil (suspension, changement plan)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`profile-self-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${coachId}`,
        },
        (payload) => {
          const updated = payload.new as { suspended?: boolean; plan?: string; plan_status?: string }

          if (updated.suspended) {
            // Forcer redirection vers page suspension
            window.location.href = '/auth/suspended'
            return
          }

          if (updated.plan && updated.plan !== (payload.old as { plan?: string }).plan) {
            toast.success(`Votre plan a été mis à jour : ${updated.plan === 'standard' ? 'Pro' : updated.plan === 'starter' ? 'Starter' : 'Trial'}`, {
              duration: 5000,
            })
            // Recharger pour mettre à jour l'UI
            setTimeout(() => window.location.reload(), 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coachId])

  return null
}
