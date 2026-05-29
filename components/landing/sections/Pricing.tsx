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
      name: 'Membres & Contenu',
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
      name: 'Membres & Contenu',
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
      name: 'Membres & Contenu',
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
      name: 'Membres & Contenu',
      items: [
        { label: 'Membres illimités', included: true },
        { label: 'Exercices de bibliothèque illimités', included: true },
        { label: 'Générations IA d\'exercices illimitées', included: true },
        { label: 'Générations de programmes illimitées', included: true },
      ],
    },
    {
      name: 'Coaching & Séances',
      items: [
        { label: 'Toutes les fonctionnalités incluses', included: true },
      ],
    },
    {
      name: 'Suivi des progrès',
      items: [
        { label: 'Toutes les fonctionnalités incluses', included: true },
      ],
    },
    {
      name: 'Communication & Engagement',
      items: [
        { label: 'Toutes les fonctionnalités incluses', included: true },
      ],
    },
    {
      name: 'Paiements & Analytics',
      items: [
        { label: 'Toutes les fonctionnalités incluses', included: true },
      ],
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
      { label: 'Générations IA/mois', value: '1' },
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
      { label: 'Membres', value: '10' },
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
      { label: 'Membres', value: '25' },
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
      { label: 'Membres', value: '45' },
      { label: 'Générations IA', value: 'Illimitées' },
      { label: 'Biblio exercices', value: 'Illimitée' },
    ],
  },
]

function MetricsBand({ metrics, popular }: { metrics: { label: string; value: string }[]; popular?: boolean }) {
  return (
    <div
      className="rounded-xl grid grid-cols-3 overflow-hidden"
      style={{
        background: popular ? 'rgba(255,255,255,0.06)' : '#F7F9FB',
        border: popular ? '1px solid rgba(255,255,255,0.08)' : '1px solid #EDF0F3',
      }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="flex flex-col items-center justify-center py-3 px-1 relative text-center">
          {i > 0 && (
            <div className="absolute left-0 inset-y-2 w-px"
              style={{ background: popular ? 'rgba(255,255,255,0.08)' : '#E8ECF0' }} />
          )}
          <span className={`font-black leading-none tracking-tight ${popular ? 'text-white' : 'text-[#0D1F3C]'} ${m.value.length > 4 ? 'text-[11px]' : 'text-[15px]'}`}>
            {m.value}
          </span>
          <span className={`text-[8.5px] font-medium mt-1 text-center leading-[1.3] ${popular ? 'text-white/40' : 'text-[#94A3B8]'}`}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function FeatureList({ categories, popular }: { categories: Category[]; popular?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat, ci) => (
        <div key={ci}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-2 ${popular ? 'text-white/30' : 'text-[#94A3B8]'}`}>
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
                    style={{ background: popular ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                    <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                      <path d="M2 2l4 4M6 2L2 6" stroke={popular ? 'rgba(255,255,255,0.25)' : '#CBD5E1'} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <span className={`text-[11.5px] leading-snug ${
                  item.included
                    ? popular ? 'text-white/70' : 'text-[#374151]'
                    : popular ? 'text-white/25' : 'text-[#C4CDD6]'
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

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annualMonthly : plan.monthly
  const features = PLAN_FEATURES[plan.id]

  return (
    <div className="relative">
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-[#4E9B6F] text-white shadow-md">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.35 2.73L10.5 4.2l-2.25 2.19.53 3.09L6 7.95 3.22 9.48l.53-3.09L1.5 4.2l3.15-.47L6 1z" fill="currentColor"/>
            </svg>
            Notre recommandation
          </span>
        </div>
      )}

      <div
        className={`rounded-2xl flex flex-col gap-4 relative overflow-hidden ${plan.popular ? 'pt-10 px-6 pb-6' : 'pt-6 px-6 pb-6'}`}
        style={plan.popular ? {
          background: 'linear-gradient(145deg, #0f2318 0%, #0D1F3C 55%, #0a1a2e 100%)',
          boxShadow: '0 0 0 2px #4E9B6F, 0 20px 60px rgba(13,31,60,0.35)',
        } : {
          background: 'white',
          border: '1px solid #E8ECF0',
          boxShadow: '0 2px 12px rgba(13,31,60,0.06)',
        }}
      >
        {plan.popular && (
          <>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(78,155,111,0.8), transparent)' }} />
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(78,155,111,0.10) 0%, transparent 70%)' }} />
          </>
        )}

        {/* Nom */}
        <h3 className={`font-bold leading-tight tracking-[-0.02em] ${plan.popular ? 'text-white text-[22px]' : 'text-[#0D1F3C] text-[20px]'}`}>
          {plan.name}
        </h3>

        <div className={`border-t ${plan.popular ? 'border-white/10' : 'border-[#F1F5F9]'}`} />

        {/* Prix */}
        <div>
          {plan.free ? (
            <div>
              <p className={`text-[42px] font-black leading-none tracking-tight ${plan.popular ? 'text-white' : 'text-[#0D1F3C]'}`}>
                Gratuit
              </p>
              <p className={`text-[12px] mt-1.5 ${plan.popular ? 'text-white/40' : 'text-[#94A3B8]'}`}>
                Pour toujours · sans carte
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`font-black leading-none tracking-tight flex items-baseline ${plan.popular ? 'text-white text-[56px]' : 'text-[#0D1F3C] text-[52px]'}`}>
                  <NumberFlow value={price} />
                  <span className={`ml-1 font-bold ${plan.popular ? 'text-white/45 text-[24px]' : 'text-[#94A3B8] text-[22px]'}`}>€</span>
                </span>
                {annual && (
                  <span className={`text-[14px] font-medium line-through leading-none ${plan.popular ? 'text-white/25' : 'text-[#CBD5E1]'}`}>
                    {plan.monthly} €
                  </span>
                )}
                <span className={`text-[13px] font-medium ${plan.popular ? 'text-white/40' : 'text-[#94A3B8]'}`}>/ mois</span>
              </div>
              {annual
                ? <p className={`text-[11.5px] mt-1.5 ${plan.popular ? 'text-white/35' : 'text-[#94A3B8]'}`}>soit {plan.annualTotal} € facturés annuellement</p>
                : <div className="h-[18px]" />
              }
            </div>
          )}
        </div>

        {/* Métriques */}
        <MetricsBand metrics={plan.metrics} popular={plan.popular} />

        {/* CTA */}
        <Link
          href={`/auth/signup?plan=${plan.id}_${annual ? 'annual' : 'monthly'}`}
          className={`flex items-center justify-center gap-2 text-[13.5px] font-semibold py-3 rounded-xl transition-colors duration-150 ${
            plan.popular
              ? 'bg-[#4E9B6F] text-white hover:bg-[#3d8058]'
              : plan.free
              ? 'bg-[#0D1F3C] text-white hover:bg-[#152E55]'
              : 'bg-[#F4F6F8] text-[#0D1F3C] hover:bg-[#EBEEF2]'
          }`}
        >
          {plan.free ? 'Commencer gratuitement' : 'Commencer'}
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
            <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className={`border-t ${plan.popular ? 'border-white/10' : 'border-[#F1F5F9]'}`} />

        {/* Features */}
        <FeatureList categories={features} popular={plan.popular} />

        {/* Note bas */}
        {!plan.free && (
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

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  const freePlan = PLANS.find(p => p.free)!
  const paidPlans = PLANS.filter(p => !p.free)

  return (
    <section id="pricing" className="relative bg-[#F7F9FB] py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #4E9B6F 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-[1]">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#4E9B6F] mb-4">Tarification</p>
          <h2 className="text-[34px] md:text-[42px] font-bold text-[#0D1F3C] tracking-[-0.02em] mb-4 leading-tight">
            Simple, transparent, sans surprise
          </h2>
          <p className="text-[15px] text-[#64748B] max-w-md mx-auto leading-relaxed">
            14 jours d&apos;essai gratuit sur tous les plans.{' '}
            Résiliable à tout moment, sans engagement.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-full p-1 gap-0.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                !annual ? 'bg-[#0D1F3C] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual ? 'bg-[#4E9B6F] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'
              }`}
            >
              Annuel
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                annual ? 'bg-white/20 text-white' : 'bg-[#4E9B6F]/15 text-[#4E9B6F]'
              }`}>
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans payants */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {paidPlans.map((plan) => (
            <div
              key={plan.id}
              className="relative"
              style={plan.popular ? { transform: 'translateY(-16px)', zIndex: 10 } : { marginTop: '16px' }}
            >
              <PlanCard plan={plan} annual={annual} />
            </div>
          ))}
        </div>

        {/* Plan Découverte */}
        <div className="mt-6 mx-auto max-w-[700px]">
          <PlanCard plan={freePlan} annual={annual} />
        </div>

        <p className="text-center text-[11px] text-[#C0C8D4] mt-7">
          Aucune carte bancaire requise · Résiliable à tout moment
        </p>
      </div>
    </section>
  )
}
