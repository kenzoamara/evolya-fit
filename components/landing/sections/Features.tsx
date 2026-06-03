'use client'

import { useState } from 'react'
import { SectionTag } from '@/components/landing/section-tag'

const CATS = [
  {
    id: 'clients',
    label: 'Elève & suivi',
    desc: 'Gère tous tes membres depuis un seul endroit. Visualise leur activité, leur progression et leurs blocages en temps réel.',
    items: [
      'Gestion complète de tes membres depuis une seule plateforme',
      'Dashboard coach avec statistiques et activité des membres',
      'Historique complet des séances et performances',
      'Check-ins membres avec rappels intelligents automatiques',
    ],
  },
  {
    id: 'progression',
    label: 'Progression & données',
    items: [
      'Suivi précis de la progression, des performances et des blocages',
      'Suivi nutritionnel, sportif et hygiène de vie',
      'Outils de calcul intégrés (IMC, macros, TDEE, 1RM)',
      'Mesures corporelles et statistiques de performance',
    ],
    desc: 'Suis chaque indicateur qui compte pour tes membres. Des données concrètes pour ajuster ton coaching à la volée.',
  },
  {
    id: 'seances',
    label: 'Séances & programmes',
    desc: 'Planifie, crée et organise tes séances en quelques clics. L\'IA t\'aide à générer des exercices personnalisés.',
    items: [
      'Création rapide de programmes sportifs, nutritionnels et habitudes',
      'Planification des séances avec agenda intégré',
      'IA générative d\'exercices personnalisable',
      'Historique des séances et notes par membre',
    ],
  },
  {
    id: 'comm',
    label: 'Communication',
    desc: 'Reste connecté avec tes membres à tout moment, depuis la même plateforme — sans jongler entre les apps.',
    items: [
      'Messagerie directe avec tes membres 24h/24',
      'Notifications et rappels automatiques aux membres',
      'Interface membre simple et intuitive sur mobile et ordinateur',
    ],
  },
  {
    id: 'business',
    label: 'Business & croissance',
    desc: 'Pilote ton activité avec les indicateurs qui comptent. Moins de friction, plus de clarté sur ta croissance.',
    items: [
      'Rapport hebdomadaire automatique chaque lundi matin',
      'Suivi de ta propre croissance en tant que coach',
      'Personnalisation complète de ton espace coach',
      'Plateforme évolutive construite avec les retours des coachs',
    ],
  },
]

export function Features() {
  const [active, setActive] = useState('clients')
  const cat = CATS.find(c => c.id === active)!

  return (
    <section id="features" className="bg-white pt-0 pb-20 px-6">
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">

        {/* Connecteur visuel */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-[#E5E7EB]" />
          <SectionTag>Inclus dans chaque abonnement</SectionTag>
          <div className="flex-1 h-px bg-[#E5E7EB]" />
        </div>

        {/* Header */}
        <div className="mb-14">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#0D1F3C] tracking-tight leading-tight max-w-xl">
            Peu importe ton forfait,<br className="hidden md:block" /> tu accèdes à toutes ces fonctionnalités
          </h2>
          <p className="mt-4 text-[15px] text-[#6B7280] max-w-lg">
            Une plateforme complète pensée pour les coachs sportifs — de la première séance à la croissance de ton activité.
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-start">

          {/* Left — liste catégories */}
          <div className="w-full md:w-52 flex-shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {CATS.map(c => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 whitespace-nowrap md:whitespace-normal w-auto md:w-full flex-shrink-0 md:flex-shrink ${
                  active === c.id
                    ? 'bg-[#F0FAF4] text-[#0D1F3C]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#FAFAFA]'
                }`}
              >
                <span
                  className={`hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${
                    active === c.id ? 'h-6 bg-[#4E9B6F]' : 'h-0 bg-transparent'
                  }`}
                />
                <span className={`text-[13px] transition-all duration-200 ${
                  active === c.id ? 'font-semibold text-[#0D1F3C]' : 'font-medium'
                }`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>

          {/* Right — contenu */}
          <div
            key={active}
            className="flex-1 min-h-[300px]"
            style={{ animation: 'panelIn 0.22s ease both' }}
          >
            <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-2xl p-8 md:p-10 h-full">

              <h3 className="text-[20px] font-bold text-[#0D1F3C] mb-3">
                {cat.label}
              </h3>

              <p className="text-[15px] text-[#6B7280] leading-relaxed mb-8 max-w-md">
                {cat.desc}
              </p>

              <ul className="space-y-4">
                {cat.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3.5"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4E9B6F]/10 flex items-center justify-center mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5.5l2 2 4-4" stroke="#4E9B6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-[14px] text-[#374151] leading-snug font-medium">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {active === 'clients' && (
                <p className="mt-6 text-[12px] text-[#9CA3AF]">Et bien plus encore...</p>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
