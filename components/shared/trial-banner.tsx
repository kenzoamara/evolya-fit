'use client'

import Link from 'next/link'
import { getDaysUntil } from '@/lib/utils'

type Props = {
  trialEndsAt: string | null
  planStatus: string
  plan: string
}

export function TrialBanner({ trialEndsAt, planStatus, plan }: Props) {
  if (planStatus === 'active' && plan !== 'trial') return null

  const isExpired = trialEndsAt ? new Date(trialEndsAt) < new Date() : false
  const daysLeft = trialEndsAt ? getDaysUntil(trialEndsAt) : 0

  if (isExpired) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-red-700 font-medium">
          Votre essai a expiré. Choisissez un plan pour continuer à accéder à Evolya.
        </p>
        <Link
          href="/settings"
          className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors ml-4 whitespace-nowrap"
        >
          Choisir un plan
        </Link>
      </div>
    )
  }

  if (plan === 'trial' && daysLeft <= 7) {
    return (
      <div className="bg-[#D4A853]/10 border-b border-[#D4A853]/30 px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-[#0D1F3C]">
          <span className="font-medium">Essai gratuit :</span> {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}.
        </p>
        <Link
          href="/settings"
          className="text-sm text-[#4E9B6F] font-medium hover:underline ml-4 whitespace-nowrap"
        >
          Passer à un plan →
        </Link>
      </div>
    )
  }

  return null
}
