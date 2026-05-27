'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const NumberFlow = dynamic(() => import('@number-flow/react'), { ssr: false })

type Metric = {
  label: string
  value: string
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
  emoji: string | null
  inherits?: string
  metrics: Metric[]
  additions: string[]
}

function IconTarget({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
    </svg>
  )
}

function IconRocket({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 7 7 7 13c0 2.5 2 4 5 4s5-1.5 5-4c0-6-5-11-5-11z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 17l-2 4M15 17l2 4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="11" r="2" stroke={color} strokeWidth="1.6"/>
    </svg>
  )
}

function IconCrown({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 17l2-8 4.5 4L12 5l2.5 8L19 9l2 8H3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M3 17h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

/* ─── Données ───────────────────────────────────────────────── */

const ALL_FEATURES: string[] = [
  // Programmes & IA
  '3 types de programmes : sportif · nutritionnel · habitudes',
  'Génération IA de programmes (Claude Haiku)',
  'Génération IA d\'exercices (description, muscles, instructions)',
  'Éditeur de programmes drag & drop',
  'Panneau bibliothèque intégré à l\'éditeur',
  'Filtres bibliothèque (catégorie, niveau, équipement)',
  'Duplication de programmes',
  'Assignation de programmes à un ou plusieurs membres',
  // Bibliothèque globale
  'Bibliothèque exercices sport (600+)',
  'Bibliothèque plans nutrition (300)',
  'Bibliothèque habitudes (100)',
  // Gestion des clients
  'Invitation membre via lien magique (sans compte)',
  'Profil & onboarding client complet',
  'Messagerie directe coach-membre',
  'Notes partagées coach-membre',
  'Objectifs clients (création & suivi de statut)',
  'Planification des séances + suivi des présences',
  'Check-ins hebdomadaires (Q&A + score énergie)',
  'Gestion des paiements clients (facturation manuelle)',
  // Espace membre
  'Espace membre dédié (dashboard, profil, onboarding)',
  'Workout tracking — exercices du jour et historique',
  'Suivi des habitudes + streaks',
  'Suivi nutrition & macros',
  'Suivi de progression (poids, performances, mesures)',
  'Statistiques personnelles et records',
  'Agenda séances (vue membre)',
  'Bilan de progression PDF (mensuel)',
  'Notifications push web (membre)',
  // Outils coach
  'Planning hebdomadaire coach (agenda)',
  'Dashboard métriques business (revenus, LTV, churn)',
  'Calculatrice métabolique intégrée',
  // Automatisation
  'Email check-in automatique chaque samedi',
  'Rappels membres inactifs automatiques',
  'Rappels streaks automatiques (7j, 30j…)',
  'Rapport hebdo coach automatique chaque lundi',
  'Relances paiements en retard automatiques',
  // Personnalisation & compliance
  'Identité visuelle personnalisée (couleurs, police, logo)',
  'Export des données RGPD (CSV / PDF)',
  'Votes roadmap — influencez les prochaines fonctionnalités',
  'Support prioritaire',
]

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Découverte',
    clientLabel: '1 membre',
    free: true,
    monthly: 0,
    annualMonthly: 0,
    annualTotal: 0,
    emoji: null,
    metrics: [
      { label: 'Membre', value: '1' },
      { label: 'Programmes IA/mois', value: '1' },
      { label: 'Biblio exercices', value: '165' },
    ],
    additions: ALL_FEATURES,
  },
  {
    id: 'starter',
    name: 'Lancement',
    clientLabel: "Jusqu'à 10 membres",
    emoji: 'target',
    monthly: 19,
    annualMonthly: 15,
    annualTotal: 180,
    metrics: [
      { label: 'Membres', value: '10' },
      { label: 'Générations IA/mois', value: '~80' },
      { label: 'Accès biblio plans', value: '+650' },
    ],
    additions: ALL_FEATURES,
  },
  {
    id: 'growth',
    name: 'Croissance',
    clientLabel: "Jusqu'à 25 membres",
    emoji: 'rocket',
    popular: true,
    monthly: 29,
    annualMonthly: 23,
    annualTotal: 275,
    metrics: [
      { label: 'Membres', value: '25' },
      { label: 'Générations IA/mois', value: '~150' },
      { label: 'Accès biblio plans', value: '+1K' },
    ],
    additions: ALL_FEATURES,
  },
  {
    id: 'pro',
    name: 'Pro',
    clientLabel: "Jusqu'à 45 membres",
    emoji: 'crown',
    monthly: 49,
    annualMonthly: 39,
    annualTotal: 470,
    metrics: [
      { label: 'Membres', value: '45' },
      { label: 'Générations IA', value: 'Illimitées' },
      { label: 'Accès biblio plans', value: 'Illimité' },
    ],
    additions: ALL_FEATURES,
  },
]

/* ─── Bandeau métriques ─────────────────────────────────────── */

function MetricsBand({ metrics, popular }: { metrics: Metric[]; popular?: boolean }) {
  return (
    <div
      className="rounded-xl grid grid-cols-3 overflow-hidden"
      style={{
        background: popular ? 'rgba(255,255,255,0.05)' : '#F7F9FB',
        border: popular ? '1px solid rgba(255,255,255,0.08)' : '1px solid #EDF0F3',
      }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="flex flex-col items-center justify-center py-4 px-2 relative text-center">
          {i > 0 && (
            <div
              className="absolute left-0 inset-y-3 w-px"
              style={{ background: popular ? 'rgba(255,255,255,0.08)' : '#E8ECF0' }}
            />
          )}
          <span className={`font-black leading-none tracking-tight ${
            popular ? 'text-white' : 'text-[#0D1F3C]'
          } ${m.value.length > 4 ? 'text-[13px]' : 'text-[17px]'}`}>
            {m.value}
          </span>
          <span className={`text-[9px] font-medium mt-1.5 text-center leading-[1.3] ${
            popular ? 'text-white/40' : 'text-[#94A3B8]'
          }`}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Liste des ajouts ──────────────────────────────────────── */

function AdditionsList({ items, popular }: { items: string[]; popular?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <div
            className="w-[16px] h-[16px] rounded-full flex-shrink-0 flex items-center justify-center mt-[1px]"
            style={{ background: 'rgba(78,155,111,0.18)' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4l2 2 3-3.5" stroke="#4E9B6F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={`text-[12px] leading-snug ${popular ? 'text-white/65' : 'text-[#4A5568]'}`}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ─── Carte plan payant ─────────────────────────────────────── */

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annualMonthly : plan.monthly

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
        className={`rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden ${plan.popular ? 'pt-10' : ''}`}
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

        {/* Icône + nombre d'membres */}
        <div className="flex items-center gap-2.5 relative">
          {plan.emoji && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(78,155,111,0.15)', border: '1px solid rgba(78,155,111,0.30)' }}>
              {plan.emoji === 'target' && <IconTarget color="#4E9B6F" />}
              {plan.emoji === 'rocket' && <IconRocket color="#4E9B6F" />}
              {plan.emoji === 'crown'  && <IconCrown  color="#4E9B6F" />}
            </div>
          )}
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={plan.popular ? {
              color: '#4E9B6F', background: 'rgba(78,155,111,0.15)', border: '1px solid rgba(78,155,111,0.30)',
            } : {
              color: '#4E9B6F', background: 'rgba(78,155,111,0.09)', border: '1px solid rgba(78,155,111,0.22)',
            }}>
            {plan.clientLabel}
          </span>
        </div>

        {/* Nom */}
        <div className="relative">
          <h3 className={`font-bold leading-tight tracking-[-0.02em] ${plan.popular ? 'text-white text-[22px]' : 'text-[#0D1F3C] text-[19px]'}`}>
            {plan.name}
          </h3>
        </div>

        <div className={`border-t relative ${plan.popular ? 'border-white/10' : 'border-[#F1F5F9]'}`} />

        {/* Prix */}
        <div className="relative">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className={`font-black leading-none tracking-tight flex items-baseline ${plan.popular ? 'text-white text-[64px]' : 'text-[#0D1F3C] text-[60px]'}`}>
              <NumberFlow value={price} />
              <span className={`ml-1 font-bold ${plan.popular ? 'text-white/45 text-[26px]' : 'text-[#94A3B8] text-[24px]'}`}>€</span>
            </span>
            {annual && (
              <span className={`text-[13px] font-medium line-through leading-none ${plan.popular ? 'text-white/25' : 'text-[#CBD5E1]'}`}>
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

        {/* CTA */}
        <Link
          href={`/auth/signup?plan=${plan.id}_${annual ? 'annual' : 'monthly'}`}
          className={`flex items-center justify-center gap-2 text-[13.5px] font-semibold py-3 rounded-xl transition-colors duration-150 relative ${
            plan.popular
              ? 'bg-[#4E9B6F] text-white hover:bg-[#3d8058]'
              : 'bg-[#F4F6F8] text-[#0D1F3C] hover:bg-[#EBEEF2]'
          }`}
        >
          Commencer
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
            <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className={`border-t relative ${plan.popular ? 'border-white/10' : 'border-[#F1F5F9]'}`} />

        {/* Métriques clés */}
        <MetricsBand metrics={plan.metrics} popular={plan.popular} />

        {/* Hérite + ajoute */}
        <div className="relative">
          {plan.inherits && (
            <p className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] mb-3 ${plan.popular ? 'text-white/30' : 'text-[#94A3B8]'}`}>
              {plan.inherits}
            </p>
          )}
          <AdditionsList items={plan.additions} popular={plan.popular} />
        </div>

        {/* Note */}
        <p className={`flex items-center gap-1.5 text-[11px] relative ${plan.popular ? 'text-white/35' : 'text-[#B0BAC6]'}`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Essai gratuit 14 jours · Sans carte bancaire
        </p>
      </div>
    </div>
  )
}

/* ─── Carte Découverte ──────────────────────────────────────── */

function FreeCard({ plan }: { plan: Plan }) {
  return (
    <div className="mt-6 mx-auto" style={{ maxWidth: '700px' }}>
      <div className="rounded-2xl border border-[#E8ECF0] bg-white px-6 pt-5 pb-6"
        style={{ boxShadow: '0 2px 8px rgba(13,31,60,0.05)' }}>

        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-semibold text-[#4E9B6F] tracking-widest uppercase mb-1">{plan.clientLabel}</p>
            <h3 className="text-[26px] sm:text-[30px] font-black tracking-tight text-[#0D1F3C] leading-none">{plan.name}</h3>
            <p className="text-[11.5px] text-[#B0BAC6] mt-1.5">Gratuit · Sans carte bancaire</p>
          </div>
          <Link
            href="/auth/signup?plan=free"
            className="flex items-center gap-2 bg-[#F4F6F8] hover:bg-[#EBEEF2] border border-[#E2E8F0] text-[#0D1F3C] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 flex-shrink-0"
          >
            Commencer
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        <div className="border-t border-[#F1F5F9] mb-5" />

        <div className="flex gap-3 mb-5">
          <MetricsBand metrics={plan.metrics} />
        </div>

        <AdditionsList items={plan.additions} />
      </div>
    </div>
  )
}

/* ─── Section principale ────────────────────────────────────── */

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {paidPlans.map((plan) => (
            <div
              key={plan.id}
              className="relative"
              style={plan.popular
                ? { transform: 'translateY(-16px)', zIndex: 10 }
                : { marginTop: '16px' }
              }
            >
              <PlanCard plan={plan} annual={annual} />
            </div>
          ))}
        </div>

        <FreeCard plan={freePlan} />

        <p className="text-center text-[11px] text-[#C0C8D4] mt-7">
          Aucune carte bancaire requise · Résiliable à tout moment
        </p>
      </div>
    </section>
  )
}
