'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Props = {
  coachId: string
  plan: string
}

export function NotificationProvider({ coachId, plan }: Props) {
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
