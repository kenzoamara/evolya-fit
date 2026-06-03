'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const NumberFlow = dynamic(() => import('@number-flow/react'), { ssr: false })

type Feature = { label: string; included: boolean }
type Category = { name: string; items: Feature[] }

const PLAN_FEATURES: Record<string, Category[]> = {
  free: [
    {
      name: 'Elève & Contenu',
      items: [
        { label: '1 membre maximum', included: true },
        { label: '100 exercices de bibliothèque', included: true },
        { label: '10 générations IA d\'exercices', included: true },
        { label: '1 génération de programme', included: true },
      ],
    },
    {
      name: 'Coaching & Séances',
      items: [
        { label: 'Agenda intégré', included: true },
        { label: 'Chrono & validation de séance', included: true },
        { label: 'Check-in hebdomadaire', included: true },
        { label: 'Notes de séance', included: false },
        { label: 'Suivi des séances en direct', included: false },
      ],
    },
    {
      name: 'Suivi des progrès',
      items: [
        { label: 'Suivi du poids', included: true },
        { label: 'Suivi sportif', included: true },
        { label: 'Suivi nutritionnel', included: true },
        { label: 'Suivi des mensurations', included: false },
        { label: 'Statistiques de performance & PR', included: false },
        { label: 'Suivi des habitudes', included: false },
      ],
    },
    {
      name: 'Communication & Engagement',
      items: [
        { label: 'Relance des membres inactifs', included: false },
        { label: 'Messagerie intégrée', included: false },
        { label: 'Rappels automatiques de check-in', included: false },
      ],
    },
    {
      name: 'Paiements & Analytics',
      items: [
        { label: 'Gestion des impayés', included: true },
        { label: 'Rappels automatiques de paiement', included: false },
        { label: 'Rapports hebdomadaires automatiques', included: false },
        { label: 'Statistiques de croissance', included: false },
      ],
    },
    {
      name: 'Personnalisation',
      items: [
        { label: '2 thèmes disponibles', included: true },
        { label: 'Mode clair / sombre', included: true },
        { label: 'Photo de profil', included: false },
        { label: 'Blog', included: false },
        { label: 'Calculatrice intégrée', included: false },
      ],
    },
  ],
  starter: [
    {
      name: 'Elève & Contenu',
      items: [
        { label: '10 membres maximum', included: true },
        { label: '500 exercices de bibliothèque', included: true },
        { label: '150 générations IA d\'exercices', included: true },
        { label: '100 générations de programmes', included: true },
      ],
    },
    {
      name: 'Coaching & Séances',
      items: [
        { label: 'Agenda intégré', included: true },
        { label: 'Chrono, validation & notes de séance', included: true },
        { label: 'Suivi des séances en direct', included: true },
        { label: 'Check-in hebdomadaire', included: true },
      ],
    },
    {
      name: 'Suivi des progrès',
      items: [
        { label: 'Suivi du poids', included: true },
        { label: 'Statistiques de performance & PR', included: true },
        { label: 'Suivi sportif', included: true },
        { label: 'Suivi nutritionnel', included: true },
        { label: 'Suivi des mensurations', included: false },
        { label: 'Suivi des habitudes', included: false },
      ],
    },
    {
      name: 'Communication & Engagement',
      items: [
        { label: 'Messagerie intégrée', included: true },
        { label: 'Relance des membres inactifs', included: true },
        { label: 'Rappels automatiques de check-in', included: false },
      ],
    },
    {
      name: 'Paiements & Analytics',
      items: [
        { label: 'Gestion des impayés', included: true },
        { label: 'Rappels automatiques de paiement', included: true },
        { label: 'Rapports hebdomadaires automatiques', included: true },
        { label: 'Statistiques de croissance', included: false },
      ],
    },
    {
      name: 'Personnalisation',
      items: [
        { label: '5 thèmes disponibles', included: true },
        { label: 'Mode clair / sombre', included: true },
        { label: 'Photo de profil', included: false },
        { label: 'Blog', included: false },
        { label: 'Calculatrice intégrée', included: false },
      ],
    },
  ],
  growth: [
    {
      name: 'Elève & Contenu',
      items: [
        { label: '25 membres maximum', included: true },
        { label: '1 000 exercices de bibliothèque', included: true },
        { label: '300 générations IA d\'exercices', included: true },
        { label: '200 générations de programmes', included: true },
      ],
    },
    {
      name: 'Coaching & Séances',
      items: [
        { label: 'Agenda intégré', included: true },
        { label: 'Chrono, validation & notes de séance', included: true },
        { label: 'Suivi des séances en direct', included: true },
        { label: 'Check-in hebdomadaire', included: true },
        { label: 'Rappels automatiques de check-in', included: true },
      ],
    },
    {
      name: 'Suivi des progrès',
      items: [
        { label: 'Suivi du poids', included: true },
        { label: 'Suivi des mensurations', included: true },
        { label: 'Statistiques de performance & PR', included: true },
        { label: 'Suivi sportif', included: true },
        { label: 'Suivi nutritionnel', included: true },
        { label: 'Suivi des habitudes', included: true },
      ],
    },
    {
      name: 'Communication & Engagement',
      items: [
        { label: 'Messagerie intégrée', included: true },
        { label: 'Relance des membres inactifs', included: true },
      ],
    },
    {
      name: 'Paiements & Analytics',
      items: [
        { label: 'Gestion des impayés', included: true },
        { label: 'Rappels automatiques de paiement', included: true },
        { label: 'Rapports hebdomadaires automatiques', included: true },
        { label: 'Statistiques de croissance', included: true },
      ],
    },
    {
      name: 'Personnalisation',
      items: [
        { label: 'Thèmes illimités', included: true },
        { label: 'Photo de profil', included: true },
        { label: 'Mode clair / sombre', included: true },
        { label: 'Blog limité', included: true },
        { label: 'Calculatrice intégrée', included: true },
      ],
    },
  ],
  pro: [
    {
      name: 'Elève & Contenu',
      items: [
        { label: '45 membres maximum', included: true },
        { label: 'Exercices de bibliothèque illimités', included: true },
        { label: 'Générations IA d\'exercices illimitées', included: true },
        { label: 'Générations de programmes illimitées', included: true },
      ],
    },
    {
      name: 'Coaching & Séances',
      items: [{ label: 'Toutes les fonctionnalités incluses', included: true }],
    },
    {
      name: 'Suivi des progrès',
      items: [{ label: 'Toutes les fonctionnalités incluses', included: true }],
    },
    {
      name: 'Communication & Engagement',
      items: [{ label: 'Toutes les fonctionnalités incluses', included: true }],
    },
    {
      name: 'Paiements & Analytics',
      items: [{ label: 'Toutes les fonctionnalités incluses', included: true }],
    },
    {
      name: 'Personnalisation',
      items: [
        { label: 'Blog complet (articles exclusifs)', included: true },
        { label: 'Toutes les fonctionnalités incluses', included: true },
      ],
    },
  ],
}

type Plan = {
  id: string
  name: string
  clientLabel: string
  popular?: boolean
  free?: boolean
  monthly: number
  annualMonthly: number
  annualTotal: number
  metrics: { label: string; value: string }[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Découverte',
    clientLabel: '1 membre',
    free: true,
    monthly: 0,
    annualMonthly: 0,
    annualTotal: 0,
    metrics: [
      { label: 'Membre', value: '1' },
      { label: 'Générations IA/mois', value: '10' },
      { label: 'Biblio exercices', value: '100' },
    ],
  },
  {
    id: 'starter',
    name: 'Lancement',
    clientLabel: "Jusqu'à 10 membres",
    monthly: 19,
    annualMonthly: 15,
    annualTotal: 180,
    metrics: [
      { label: 'Elève', value: '10' },
      { label: 'Générations IA/mois', value: '150' },
      { label: 'Biblio exercices', value: '500' },
    ],
  },
  {
    id: 'growth',
    name: 'Croissance',
    clientLabel: "Jusqu'à 25 membres",
    popular: true,
    monthly: 29,
    annualMonthly: 23,
    annualTotal: 275,
    metrics: [
      { label: 'Elève', value: '25' },
      { label: 'Générations IA/mois', value: '300' },
      { label: 'Biblio exercices', value: '1 000' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    clientLabel: "Jusqu'à 45 membres",
    monthly: 49,
    annualMonthly: 39,
    annualTotal: 470,
    metrics: [
      { label: 'Elève', value: '45' },
      { label: 'Générations IA', value: 'Illimitées' },
      { label: 'Biblio exercices', value: 'Illimitée' },
    ],
  },
]

// ─── Tableau comparatif — données ─────────────────────────────────────────────
// Ordre colonnes : free, starter, growth, pro
const COMPARISON_CATEGORIES = [
  {
    name: 'Elève & contenu',
    features: [
      { label: 'Elève maximum', values: ['1', '10', '25', '45'] },
      { label: 'Exercices de bibliothèque', values: ['100', '500', '1 000', 'Illimités'] },
      { label: "Générations IA d'exercices", values: ['10 / mois', '150 / mois', '300 / mois', 'Illimitées'] },
      { label: 'Générations de programmes', values: ['1', '100', '200', 'Illimitées'] },
    ],
  },
  {
    name: 'Coaching & séances',
    features: [
      { label: 'Agenda intégré', values: [true, true, true, true] },
      { label: 'Notes de séance', values: [false, true, true, true] },
      { label: 'Suivi des séances en direct', values: [false, true, true, true] },
      { label: 'Rappels automatiques de check-in', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Suivi des progrès',
    features: [
      { label: 'Suivi du poids', values: [true, true, true, true] },
      { label: 'Statistiques de performance & PR', values: [false, true, true, true] },
      { label: 'Suivi des mensurations', values: [false, false, true, true] },
      { label: 'Suivi des habitudes', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Communication & paiements',
    features: [
      { label: 'Messagerie intégrée', values: [false, true, true, true] },
      { label: 'Gestion des impayés', values: [true, true, true, true] },
      { label: 'Rappels automatiques de paiement', values: [false, true, true, true] },
      { label: 'Statistiques de croissance', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Personnalisation',
    features: [
      { label: 'Thèmes disponibles', values: ['2', '5', 'Illimités', 'Illimités'] },
      { label: 'Photo de profil', values: [false, false, true, true] },
      { label: 'Blog intégré', values: [false, false, 'Limité', 'Complet'] },
    ],
  },
] as const

function MetricsBand({ metrics, popular, isCurrent }: { metrics: { label: string; value: string }[]; popular?: boolean; isCurrent?: boolean }) {
  const dark = popular || isCurrent
  return (
    <div
      className="rounded-xl grid grid-cols-3 overflow-hidden"
      style={{
        background: dark ? 'rgba(255,255,255,0.06)' : '#F7F9FB',
        border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #EDF0F3',
      }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="flex flex-col items-center justify-center py-3 px-1 relative text-center">
          {i > 0 && (
            <div className="absolute left-0 inset-y-2 w-px"
              style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#E8ECF0' }} />
          )}
          <span className={`font-black leading-none tracking-tight ${dark ? 'text-white' : 'text-[#0D1F3C]'} ${m.value.length > 4 ? 'text-[11px]' : 'text-[15px]'}`}>
            {m.value}
          </span>
          <span className={`text-[8.5px] font-medium mt-1 text-center leading-[1.3] ${dark ? 'text-white/40' : 'text-[#94A3B8]'}`}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function FeatureList({ categories, popular, isCurrent }: { categories: Category[]; popular?: boolean; isCurrent?: boolean }) {
  const dark = popular || isCurrent
  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat, ci) => (
        <div key={ci}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-2 ${dark ? 'text-white/30' : 'text-[#94A3B8]'}`}>
            {cat.name}
          </p>
          <ul className="flex flex-col gap-1.5">
            {cat.items.map((item, fi) => (
              <li key={fi} className="flex items-start gap-2">
                {item.included ? (
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center mt-[2px]"
                    style={{ background: 'rgba(78,155,111,0.18)' }}>
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2 3-3.5" stroke="#4E9B6F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center mt-[2px]"
                    style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                    <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                      <path d="M2 2l4 4M6 2L2 6" stroke={dark ? 'rgba(255,255,255,0.25)' : '#CBD5E1'} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <span className={`text-[11.5px] leading-snug ${
                  item.included
                    ? dark ? 'text-white/70' : 'text-[#374151]'
                    : dark ? 'text-white/25' : 'text-[#C4CDD6]'
                }`}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function PlanCard({
  plan, annual, isCurrent, isRecommended, isDisabled, loading, onChoose,
}: {
  plan: Plan
  annual: boolean
  isCurrent: boolean
  isRecommended: boolean
  isDisabled: boolean
  loading: boolean
  onChoose: (priceKey: string) => void
}) {
  const price = annual ? plan.annualMonthly : plan.monthly
  const priceKey = `${plan.id}_${annual ? 'annual' : 'monthly'}`
  const features = PLAN_FEATURES[plan.id]
  const dark = isCurrent || (plan.popular && !isCurrent)

  const cardStyle = isCurrent ? {
    background: 'linear-gradient(145deg, #0f2318 0%, #0D1F3C 55%, #0a1a2e 100%)',
    boxShadow: '0 0 0 2px #D97706, 0 20px 60px rgba(13,31,60,0.35)',
  } : plan.popular ? {
    background: 'linear-gradient(145deg, #0f2318 0%, #0D1F3C 55%, #0a1a2e 100%)',
    boxShadow: '0 0 0 2px #4E9B6F, 0 20px 60px rgba(13,31,60,0.35)',
  } : isDisabled ? {
    background: 'white',
    border: '1px solid #E8ECF0',
    opacity: 0.45,
    pointerEvents: 'none' as const,
  } : {
    background: 'white',
    border: '1px solid #E8ECF0',
    boxShadow: '0 2px 12px rgba(13,31,60,0.06)',
  }

  return (
    <div className="relative">
      {/* Badge au-dessus de la carte */}
      {isCurrent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <span className="inline-flex items-center gap-1.5 bg-[#D97706] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
            Plan actuel
          </span>
        </div>
      )}
      {!isCurrent && isRecommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-[#4E9B6F] text-white shadow-md">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.35 2.73L10.5 4.2l-2.25 2.19.53 3.09L6 7.95 3.22 9.48l.53-3.09L1.5 4.2l3.15-.47L6 1z" fill="currentColor"/>
            </svg>
            Notre recommandation
          </span>
        </div>
      )}

      <div
        className={`rounded-2xl flex flex-col gap-4 relative overflow-hidden ${(isCurrent || isRecommended) ? 'pt-10 px-6 pb-6' : 'pt-6 px-6 pb-6'}`}
        style={cardStyle}
      >
        {dark && (
          <>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${isCurrent ? 'rgba(217,119,6,0.8)' : 'rgba(78,155,111,0.8)'}, transparent)` }} />
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${isCurrent ? 'rgba(217,119,6,0.08)' : 'rgba(78,155,111,0.10)'} 0%, transparent 70%)` }} />
          </>
        )}

        {/* Nom + label */}
        <h3 className={`font-bold leading-tight tracking-[-0.02em] ${dark ? 'text-white text-[22px]' : 'text-[#0D1F3C] text-[20px]'}`}>
          {plan.name}
        </h3>

        <div className={`border-t ${dark ? 'border-white/10' : 'border-[#F1F5F9]'}`} />

        {/* Prix */}
        <div>
          {plan.free ? (
            <div>
              <p className={`text-[42px] font-black leading-none tracking-tight ${dark ? 'text-white' : 'text-[#0D1F3C]'}`}>
                Gratuit
              </p>
              <p className={`text-[12px] mt-1.5 ${dark ? 'text-white/40' : 'text-[#94A3B8]'}`}>
                Pour toujours · sans carte
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`font-black leading-none tracking-tight flex items-baseline ${dark ? 'text-white text-[52px]' : 'text-[#0D1F3C] text-[48px]'}`}>
                  <NumberFlow value={price} />
                  <span className={`ml-1 font-bold ${dark ? 'text-white/45 text-[22px]' : 'text-[#94A3B8] text-[20px]'}`}>€</span>
                </span>
                {annual && (
                  <span className={`text-[14px] font-medium line-through leading-none ${dark ? 'text-white/25' : 'text-[#CBD5E1]'}`}>
                    {plan.monthly} €
                  </span>
                )}
                <span className={`text-[13px] font-medium ${dark ? 'text-white/40' : 'text-[#94A3B8]'}`}>/ mois</span>
              </div>
              {annual
                ? <p className={`text-[11.5px] mt-1.5 ${dark ? 'text-white/35' : 'text-[#94A3B8]'}`}>soit {plan.annualTotal} € facturés annuellement</p>
                : <div className="h-[18px]" />
              }
            </div>
          )}
        </div>

        {/* Métriques */}
        <MetricsBand metrics={plan.metrics} popular={plan.popular && !isCurrent} isCurrent={isCurrent} />

        {/* CTA */}
        {isCurrent ? (
          <div className="flex items-center justify-center gap-2 text-[14px] font-semibold py-3 rounded-xl bg-[#D97706] text-white cursor-default">
            Plan actuel
          </div>
        ) : plan.free ? (
          <div className="flex items-center justify-center gap-2 text-[14px] font-semibold py-3 rounded-xl bg-[#0D1F3C]/10 text-[#0D1F3C]/40 cursor-not-allowed">
            Non disponible
          </div>
        ) : (
          <button
            onClick={() => onChoose(priceKey)}
            disabled={loading}
            className={`flex items-center justify-center gap-2 text-[14px] font-semibold py-3 rounded-xl transition-colors duration-150 disabled:opacity-60 active:scale-[0.99] ${
              plan.popular
                ? 'bg-[#4E9B6F] text-white hover:bg-[#3d8058]'
                : 'bg-[#F4F6F8] text-[#0D1F3C] hover:bg-[#EBEEF2]'
            }`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Choisir ce plan
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        )}

        <div className={`border-t ${dark ? 'border-white/10' : 'border-[#F1F5F9]'}`} />

        {/* Features */}
        <FeatureList categories={features} popular={plan.popular && !isCurrent} isCurrent={isCurrent} />

        {/* Note bas */}
        {!plan.free && !isCurrent && (
          <p className={`flex items-center gap-1.5 text-[11px] ${plan.popular ? 'text-white/30' : 'text-[#B0BAC6]'}`}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5l2.5 2.5L10 3" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Essai gratuit 14 jours · Sans carte bancaire
          </p>
        )}
      </div>
    </div>
  )
}

export function PlansContent({ currentPlan, onboarding = false }: { currentPlan: string; clientLimit: number; onboarding?: boolean }) {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PLAN_ORDER: Record<string, number> = { free: 0, trial: 0, starter: 1, growth: 2, pro: 3 }
  const currentLevel = PLAN_ORDER[currentPlan] ?? 0

  const paidPlans = PLANS.filter(p => !p.free)
  const freePlan = PLANS.find(p => p.free)!

  // Le plan recommandé = premier plan payant au-dessus du plan actuel
  const recommendedPlan = paidPlans.find(p => (PLAN_ORDER[p.id] ?? 0) > currentLevel) ?? null

  async function handleChoose(priceKey: string) {
    setLoading(true)
    setError(null)
    try {
      const planId = priceKey.split('_')[0]

      if (onboarding) {
        // Mode onboarding : démarre l'essai gratuit sans Stripe
        const res = await fetch('/api/auth/select-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        })
        const data = await res.json()
        if (!res.ok || data.error) { setError(data.error ?? 'Erreur.'); setLoading(false); return }
        window.location.href = '/dashboard'
      } else {
        // Mode upgrade : passe par Stripe
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceKey }),
        })
        const { url, error } = await res.json()
        if (error || !url) { setError('Erreur Stripe. Réessayez.'); setLoading(false); return }
        window.location.href = url
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 px-4 py-10 md:px-8 md:py-14 bg-[#F7F9FB] min-h-dvh">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          {onboarding && (
            <div className="inline-flex items-center gap-2 bg-[#EEF9F3] border border-[#4E9B6F]/20 text-[#3f8a60] text-[12px] font-semibold px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4E9B6F]" />
              Sans carte bancaire · Essai 14 jours gratuit
            </div>
          )}
          <h1 className="text-[30px] md:text-[38px] font-bold text-[#0D1F3C] tracking-[-0.02em] mb-3 leading-tight">
            {onboarding ? 'Choisissez votre formule' : 'Choisissez votre offre'}
          </h1>
          <p className="text-[15px] text-[#6B7280] max-w-sm mx-auto leading-relaxed">
            <strong className="text-[#374151] font-semibold">14 jours d&apos;essai gratuit</strong> sur tous les plans.{' '}
            {onboarding ? 'Aucune carte bancaire requise.' : 'Résiliable à tout moment.'}
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-full p-1 gap-0.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 ${!annual ? 'bg-[#0D1F3C] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-2 ${annual ? 'bg-[#4E9B6F] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
            >
              Annuel
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${annual ? 'bg-white/20 text-white' : 'bg-[#4E9B6F]/15 text-[#4E9B6F]'}`}>
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans payants — 3 colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {paidPlans.map(plan => {
            const isCurrent = plan.id === currentPlan || (currentPlan === 'trial' && plan.id === 'starter')
            const isRecommended = !isCurrent && recommendedPlan?.id === plan.id
            return (
              <div
                key={plan.id}
                className="relative"
                style={(isCurrent || isRecommended) ? { transform: 'translateY(-16px)', zIndex: 10 } : { marginTop: '16px' }}
              >
                <PlanCard
                  plan={plan}
                  annual={annual}
                  isCurrent={isCurrent}
                  isRecommended={isRecommended}
                  isDisabled={false}
                  loading={loading}
                  onChoose={handleChoose}
                />
              </div>
            )
          })}
        </div>

        {/* Plan Découverte — non accessible, affiché en bas */}
        <div className="mt-6 mx-auto max-w-[700px]">
          <PlanCard
            plan={freePlan}
            annual={annual}
            isCurrent={currentPlan === 'free' || currentPlan === 'trial'}
            isRecommended={false}
            isDisabled={currentPlan !== 'free' && currentPlan !== 'trial'}
            loading={false}
            onChoose={() => {}}
          />
        </div>

        {error && <p className="text-center text-sm text-red-600 mt-6">{error}</p>}

        <p className="text-center text-[12px] text-[#B0B7C3] mt-8">
          Aucune carte bancaire requise · Résiliable à tout moment ·{' '}
          {!onboarding && (
            <Link href="/dashboard" className="underline underline-offset-2 hover:text-[#64748B] transition-colors">
              Retour au dashboard
            </Link>
          )}
        </p>

        {/* ── Tableau comparatif ────────────────────────────────────────── */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <h2 className="text-[24px] md:text-[30px] font-bold text-[#0D1F3C] tracking-[-0.02em] mb-2">
              Comparez les formules en détail
            </h2>
            <p className="text-[14px] text-[#6B7280]">Toutes les fonctionnalités, catégorie par catégorie.</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-4 text-[13px] font-medium text-[#0D1F3C] border-b border-[#E2E8F0] min-w-[200px] sticky left-0 bg-white" />
                    {PLANS.map(pl => (
                      <th key={pl.id} className={`px-4 py-4 text-center border-b border-[#E2E8F0] ${pl.popular ? 'bg-[#0D1F3C]' : 'bg-white'}`}>
                        {pl.popular && <div className="text-[9px] font-bold text-[#4E9B6F] uppercase tracking-widest mb-1">Recommandé</div>}
                        <div className={`font-semibold text-[15px] ${pl.popular ? 'text-white' : 'text-[#0D1F3C]'}`}>{pl.name}</div>
                        <div className={`text-[13px] font-bold mt-0.5 ${pl.popular ? 'text-white' : 'text-[#0D1F3C]'}`}>
                          {pl.free ? '0€' : `${annual ? pl.annualMonthly : pl.monthly}€`}
                          <span className={`text-[10px] font-normal ml-1 ${pl.popular ? 'text-white/50' : 'text-[#94A3B8]'}`}>
                            {pl.free ? '/ toujours' : '/ mois'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_CATEGORIES.map(cat => (
                    <>
                      <tr key={cat.name + '-h'}>
                        <td colSpan={PLANS.length + 1} className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-[#3f8a60] bg-[#EEF9F3]">
                          {cat.name}
                        </td>
                      </tr>
                      {cat.features.map(f => (
                        <tr key={f.label} className="border-b border-[#F1F5F9] hover:bg-[#FAFCFD]">
                          <td className="px-5 py-3 text-[13px] text-[#374151] sticky left-0 bg-white font-medium border-b border-[#F1F5F9]">{f.label}</td>
                          {f.values.map((v, i) => (
                            <td key={i} className={`px-4 py-3 text-center border-b border-[#F1F5F9] ${PLANS[i].popular ? 'bg-[#FAFCFD]' : ''}`}>
                              {v === true ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EEF9F3]">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </span>
                              ) : v === false ? (
                                <span className="text-[#DDE2E8] text-[16px]">—</span>
                              ) : (
                                <span className="text-[12px] font-semibold text-[#0D1F3C]">{v}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-5 py-4 sticky left-0 bg-white border-t border-[#E2E8F0]" />
                    {PLANS.map(pl => {
                      const isCurrent = pl.id === currentPlan || (currentPlan === 'trial' && pl.id === 'starter')
                      return (
                        <td key={pl.id} className={`px-4 py-4 text-center border-t border-[#E2E8F0] ${pl.popular ? 'bg-[#FAFCFD]' : ''}`}>
                          {isCurrent ? (
                            <span className="text-[12px] font-semibold text-[#D97706]">Plan actuel</span>
                          ) : pl.free ? (
                            <span className="text-[12px] text-[#CBD5E1]">—</span>
                          ) : (
                            <button
                              onClick={() => handleChoose(`${pl.id}_${annual ? 'annual' : 'monthly'}`)}
                              disabled={loading}
                              className={`text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors ${pl.popular ? 'bg-[#4E9B6F] text-white hover:bg-[#3d8058]' : 'bg-[#EEF9F3] text-[#3f8a60] hover:bg-[#DCF3E8]'}`}
                            >
                              Choisir
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
