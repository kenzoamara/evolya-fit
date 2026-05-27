'use client'

import { useState } from 'react'

type Plan = {
  id: string
  name: string
  clientLabel: string
  desc: string
  popular?: boolean
  free?: boolean
  noTrial?: boolean
  monthly: number
  annualMonthly: number
  annualTotal: number
  clientLimit: number
}

type PlanStatus = 'active' | 'current' | 'disabled'

const PLANS: Plan[] = [
  { id: 'free',      name: 'Découverte', clientLabel: '1 membre',            desc: 'Parfait pour débuter et tester la plateforme.',      free: true,    clientLimit: 1,    monthly: 0,   annualMonthly: 0,   annualTotal: 0    },
  { id: 'starter',   name: 'Lancement',  clientLabel: "Jusqu'à 10 membres", desc: 'Idéal pour démarrer ton activité de coaching.',                       clientLimit: 10,   monthly: 19,  annualMonthly: 15,  annualTotal: 180  },
  { id: 'growth',    name: 'Growth',     clientLabel: "Jusqu'à 25 membres", desc: 'Pour les coachs qui développent leur clientèle.',    popular: true,  clientLimit: 25,   monthly: 29,  annualMonthly: 23,  annualTotal: 275  },
  { id: 'pro',       name: 'Pro',        clientLabel: "Jusqu'à 45 membres", desc: 'Pour les coachs avec une activité bien établie.',                     clientLimit: 45,   monthly: 49,  annualMonthly: 39,  annualTotal: 470  },
]

function PlanCard({
  plan, annual, loading, status, isRecommended, onChoose,
}: {
  plan: Plan
  annual: boolean
  loading: boolean
  status: PlanStatus
  isRecommended: boolean
  onChoose: (priceKey: string) => void
}) {
  const price    = annual ? plan.annualMonthly : plan.monthly
  const priceKey = plan.free ? 'free' : `${plan.id}_${annual ? 'annual' : 'monthly'}`
  const disabled = status === 'disabled' || status === 'current'
  const hasBadge = status === 'current' || (status === 'active' && isRecommended)

  return (
    <div className={`relative bg-white rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 ${
      status === 'current'
        ? 'border-2 border-[#D97706]'
        : status === 'disabled'
        ? 'border border-[#E5E7EB] opacity-40 pointer-events-none select-none'
        : isRecommended
        ? 'border-2 border-[#4E9B6F] shadow-[0_8px_32px_rgba(78,155,111,0.13)]'
        : 'border border-[#E5E7EB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)]'
    }`}>

      {status === 'current' && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 bg-[#D97706] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
            Plan actuel
          </span>
        </div>
      )}
      {status === 'active' && isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 bg-[#4E9B6F] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M5 .5L6.3 3.8H9.8L7 5.8l1 3.2L5 7.2 2 9l1-3.2L.2 3.8H3.7z"/>
            </svg>
            Notre recommandation
          </span>
        </div>
      )}

      <div className={hasBadge ? 'pt-2' : ''}>
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          status === 'disabled' ? 'bg-[#F3F4F6] text-[#9CA3AF]' : 'bg-[#F0FAF4] text-[#4E9B6F]'
        }`}>
          <span className="font-bold">+</span> {plan.clientLabel}
        </span>
      </div>

      <div>
        <h3 className="text-[20px] font-bold text-[#0D1F3C] leading-tight">{plan.name}</h3>
        <p className="text-[13px] text-[#9CA3AF] leading-snug mt-1">{plan.desc}</p>
      </div>

      <div className="border-t border-[#F3F4F6] pt-3 mt-1">
        {plan.free ? (
          <div>
            <p className="text-[36px] font-bold text-[#0D1F3C] leading-none tracking-tight">Offert</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1.5">Pour toujours</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[34px] font-bold text-[#0D1F3C] leading-none tracking-tight">{price} €</span>
              {annual && (
                <span className="text-[17px] font-medium text-[#C4C9D4] line-through leading-none">{plan.monthly} €</span>
              )}
              <span className="text-[13px] text-[#9CA3AF] font-medium">/ mois</span>
            </div>
            {annual
              ? <p className="text-[12px] text-[#9CA3AF] mt-1.5">soit {plan.annualTotal}€ / an</p>
              : <div className="h-[19px]" />
            }
          </div>
        )}
      </div>

      <button
        onClick={() => !disabled && onChoose(priceKey)}
        disabled={loading || disabled}
        className={`flex items-center justify-center gap-2 text-[14px] font-semibold py-3 rounded-xl transition-all duration-200 mt-auto disabled:opacity-60 active:scale-[0.99] ${
          status === 'current'
            ? 'bg-[#FEF3C7] text-[#D97706] cursor-default'
            : plan.free
            ? 'bg-[#0D1F3C] text-white hover:bg-[#152E55]'
            : isRecommended && status === 'active'
            ? 'bg-[#4E9B6F] text-white hover:bg-[#3D7A5F]'
            : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
        }`}
      >
        {status === 'current' ? 'Plan actuel' : plan.free ? 'Continuer gratuitement' : 'Commencer'}
        {status !== 'current' && (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="flex items-center gap-1.5">
        {plan.free ? (
          <>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L7 3.5h3L7.5 5.5l1 3-3-1.8-3 1.8 1-3L1 3.5h3z" fill="#4E9B6F"/></svg>
            <span className="text-[11.5px] text-[#9CA3AF]">Sans carte bancaire</span>
          </>
        ) : plan.noTrial ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L10 3v3.5c0 2.5-2 4-4 4s-4-1.5-4-4V3L6 1z" stroke="#9CA3AF" strokeWidth="1.2"/></svg>
            <span className="text-[11.5px] text-[#9CA3AF]">Sans carte bancaire</span>
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5l2.5 2.5L10 3" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[11.5px] text-[#9CA3AF]">Essai gratuit 14 jours · Sans carte bancaire</span>
          </>
        )}
      </div>
    </div>
  )
}

export function PlansContent({ currentPlan, clientLimit }: { currentPlan: string; clientLimit: number }) {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentPlanDef = PLANS.find(p => p.clientLimit === clientLimit)
    ?? PLANS.find(p => p.id === currentPlan)
    ?? null

  // Plan recommandé = le premier plan au-dessus du plan actuel
  const recommendedPlan = currentPlanDef
    ? PLANS.find(p => p.clientLimit > currentPlanDef.clientLimit) ?? null
    : PLANS.find(p => p.popular) ?? null

  function getStatus(plan: Plan): PlanStatus {
    if (currentPlanDef && plan.id === currentPlanDef.id) return 'current'
    if (plan.free && currentPlanDef && !currentPlanDef.free) return 'disabled'
    return 'active'
  }

  async function handleChoose(priceKey: string) {
    if (priceKey === 'free') {
      window.location.href = '/dashboard'
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      })
      const { url, error } = await res.json()
      if (error || !url) { setError('Erreur Stripe. Réessayez.'); setLoading(false); return }
      window.location.href = url
    } catch {
      setError('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[32px] md:text-[40px] font-bold text-[#0D1F3C] tracking-[-0.02em] mb-3 leading-tight">
            Choisissez votre offre
          </h1>
          <p className="text-[15px] text-[#6B7280] max-w-md mx-auto leading-relaxed">
            <strong className="text-[#374151] font-semibold">14 jours d&apos;essai gratuit</strong>,
            résiliable à tout moment &amp; sans engagement.
          </p>
        </div>

        {/* Toggle Mensuel / Annuel */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAnnual(false)}
              className={`text-[14px] font-semibold transition-colors duration-200 ${!annual ? 'text-[#0D1F3C]' : 'text-[#9CA3AF]'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${annual ? 'bg-[#4E9B6F]' : 'bg-[#D1D5DB]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-[14px] font-semibold transition-colors duration-200 flex items-center gap-2 ${annual ? 'text-[#0D1F3C]' : 'text-[#9CA3AF]'}`}
            >
              Annuel
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#3D7A5F] transition-all duration-200 ${annual ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              loading={loading}
              status={getStatus(plan)}
              isRecommended={recommendedPlan?.id === plan.id}
              onChoose={handleChoose}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-600 mt-6">{error}</p>
        )}

        <p className="text-center text-[12px] text-[#B0B7C3] mt-8">
          Aucune carte bancaire requise · Résiliable à tout moment
        </p>
      </div>
    </div>
  )
}
