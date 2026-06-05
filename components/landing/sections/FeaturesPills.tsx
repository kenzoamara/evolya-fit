'use client'

import { useState } from 'react'
import { AnimatedBackground } from '../AnimatedBackground'
import { SectionTag } from '@/components/landing/section-tag'
import { FeatureIcon } from '@/components/landing/feature-icons'

const TOOLS = [
  {
    id: 'programme',
    label: 'Programme',
    title: 'Crée et assigne des programmes en quelques minutes.',
    desc: "Construis des programmes sportifs, nutritionnels ou d'habitudes et assigne-les à tes membres instantanément — l'IA génère et tu valides.",
    bullets: [
      'Programmes sportifs, nutritionnels & habitudes',
      'Génération de programmes par IA personnalisable',
      'Bibliothèque de +1 000 exercices, plans nutrition & habitudes',
      'Glisser-déposer les exercices pour composer tes séances',
      'Suivi de complétion en temps réel',
    ],
  },
  {
    id: 'seance',
    label: 'Séance',
    title: 'Tes séances planifiées, suivies et archivées sans effort.',
    desc: "Un agenda intégré, une durée configurable par séance, des notes privées par membre. Plus de séances improvisées — chaque membre a son fil rouge.",
    bullets: [
      'Agenda de planification intégré',
      'Lancement chrono minimaliste + enregistrement',
      'Notes privées enregistrées à chaque séance',
      'Disponibilités configurables — tes membres réservent eux-mêmes',
      'Prise de RDV en ligne directement depuis l\'espace membre',
      'Synchronisation Google Agenda (bidirectionnel)',
    ],
  },
  {
    id: 'suivi',
    label: 'Suivi membre',
    title: 'Ne rate plus jamais un signal faible chez tes membres.',
    desc: "Check-ins automatiques, mesures, performances, objectifs — tu vois qui avance, qui stagne, qui décroche. Plus besoin de tout mémoriser. Le système se souvient pour toi.",
    bullets: [
      'Check-ins hebdomadaires avec rappels automatiques',
      'Suivi des mesures corporelles et poids',
      'Statistiques de performance et records',
      'Objectifs avec progression visuelle',
      'Calculatrice métabolique intégrée (IMC, calories, métabolisme de base)',
    ],
  },
  {
    id: 'messagerie',
    label: 'Messagerie',
    title: 'Centralise tous tes échanges au même endroit',
    desc: "Discute avec tes membres, partage des informations et centralise toute la communication de ton coaching — en finir avec les outils éparpillés.",
    bullets: [
      'Messagerie directe coach ↔ membre',
      'Accessible depuis l\'espace membre mobile',
      'Historique de toutes les conversations',
      'Notifications de nouveaux messages',
    ],
  },
  {
    id: 'espace-membre',
    label: 'Espace membre',
    title: 'Tes membres ont leur propre espace — sur mobile et PC.',
    desc: "Chaque membre accède à son espace personnel via un lien unique — sans app à télécharger. Ils voient leur programme, suivent leur progression et restent engagés entre les séances.",
    bullets: [
      'Accès instantané via lien unique — aucune app à installer',
      'Programme, agenda & habitudes accessibles depuis mobile',
      'Suivi des objectifs, mesures et statistiques en temps réel',
      'Messagerie intégrée et historique des séances',
      'Paiements en ligne et reçus automatiques',
    ],
  },
  {
    id: 'invitation',
    label: 'Invitations',
    title: 'Onboarde tes membres avec un seul lien.',
    desc: "Partage un lien unique par WhatsApp, SMS ou ta bio Instagram. Tes membres s'inscrivent eux-mêmes, tu valides en un clic — leur accès part automatiquement par email. Plus aucune saisie manuelle.",
    bullets: [
      'Un seul lien réutilisable à partager partout',
      'Tes membres remplissent leurs infos eux-mêmes',
      'Demandes reçues : tu valides ou refuses en un clic',
      'Accès envoyé automatiquement par email à la validation',
      "Page d'inscription à ta marque (logo & couleur)",
      'Formulaire d\'intake personnalisé — collecte les infos clés avant la 1ère séance',
    ],
  },
  {
    id: 'business',
    label: 'Business',
    title: 'Pilote ton activité avec les bons indicateurs',
    desc: "Vue d'ensemble de ta croissance, suivi des inactifs, gestion des impayés — tout ce qui compte pour ton activité depuis une seule interface.",
    bullets: [
      'Alertes membres inactifs + relance en 1 clic',
      'Impayés centralisés avec rappels auto J+3 / J+7 / J+14',
      'Encaissement en ligne via Stripe — directement depuis la plateforme',
      'Rapport hebdomadaire automatique chaque lundi',
      'Statistiques de croissance et de rétention',
    ],
  },
  {
    id: 'personnalisation',
    label: 'Personnalisation',
    title: "Une plateforme à ton image, pas un outil générique.",
    desc: "Ta couleur de marque et ta police — tes membres voient TON identité, pas la nôtre. Tout l'espace membre s'habille à ta marque. La différence entre un freelance et un cabinet professionnel.",
    bullets: [
      'Ta couleur de marque appliquée à tout l\'espace membre',
      'Police d\'écriture personnalisée',
      'Page d\'invitation et espace membre à ton image',
      'Mode clair, sombre ou automatique',
    ],
  },
]

const ENGAGEMENTS = [
  {
    id: 'fiabilite',
    label: 'Fiabilité',
    title: 'Nous tenons nos engagements, sans exception',
    desc: "Ce qu'on annonce, on le livre. Chaque retour coach compte et façonne la prochaine mise à jour — tu n'es jamais ignoré.",
    bullets: [
      'Fonctionnalités annoncées livrées dans les délais communiqués',
      'Chaque suggestion coach est lue, évaluée et souvent intégrée',
      'Mises à jour construites sur vos retours terrain, pas sur des suppositions',
    ],
  },
  {
    id: 'intuitif',
    label: 'Intuitif',
    title: 'Opérationnel en moins de 10 minutes',
    desc: "Pas de formation, pas de manuel. En quelques minutes, tu es prêt à coacher et tes membres aussi — depuis n'importe quel appareil.",
    bullets: [
      'Le système de coaching le plus simple du marché',
      'Onboarding guidé étape par étape',
      'Aucune fonctionnalité superflue — seulement ce dont tu as besoin',
      'Disponible sur toutes les vues — mobile, tablette et ordinateur',
    ],
  },
  {
    id: 'automatiser',
    label: 'Automatiser',
    title: 'Les tâches répétitives disparaissent. Le lien avec tes membres, lui, reste.',
    desc: "Evolya'Fit s'occupe des check-ins, des relances, des alertes, des bilans, etc. — pour que tu aies plus de temps pour ce qui compte : être présent pour tes membres. Automatiser, ce n'est pas devenir froid. C'est l'inverse.",
    bullets: [
      'Détection automatique des membres inactifs',
      'Rapport hebdomadaire par email chaque lundi',
      'Alerte en temps réel sur les décrochages',
      'Email d\'accès envoyé automatiquement à chaque membre',
      'Relance client inactif en 1 clic dès le décrochage détecté',
      'Suivi des impayés avec alerte automatique de retard',
    ],
  },
  {
    id: 'ecoute',
    label: "À l'écoute",
    title: 'Un support disponible 7 jours sur 7',
    desc: "Une équipe accessible tous les jours de la semaine. Tu n'es jamais bloqué seul face à un problème — et chaque retour coach améliore la plateforme.",
    bullets: [
      'Support réactif 7j/7 par email',
      'Roadmap publique et vote des fonctionnalités',
      'Chaque retour utilisateur est pris en compte',
      'Mises à jour régulières sans interruption',
    ],
  },
]

const ALL = [...TOOLS, ...ENGAGEMENTS]

function NavItem({ id, label, active, onClick, accent }: {
  id: string
  label: string
  active: boolean
  onClick: () => void
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 text-[13px] transition-all duration-150 flex items-center gap-3 border-l-2"
      style={{
        borderLeftColor: active ? accent : 'transparent',
        color:           active ? '#FFFFFF' : '#94A3B8',
        background:      active ? 'rgba(255,255,255,0.05)' : 'transparent',
        fontWeight:      active ? 600 : 400,
      }}
    >
      <span
        className="flex-shrink-0 transition-colors"
        style={{ color: active ? accent : '#64748B' }}
      >
        <FeatureIcon id={id} size={17} />
      </span>
      <span>{label}</span>
    </button>
  )
}

export function FeaturesPills() {
  const [active, setActive] = useState('programme')
  const current = ALL.find(f => f.id === active)!
  const isEngagement = ENGAGEMENTS.some(e => e.id === active)
  const accent = isEngagement ? '#7C5CFC' : '#4E9B6F'

  return (
    <section id="features" className="bg-gradient-to-b from-[#0D1F3C] to-[#091528] py-24 px-6 relative overflow-hidden">
      <AnimatedBackground mode="comets" theme="dark" intensity={0.6} density={30} speed={0.7} accent={0.5} />
      <div className="max-w-5xl mx-auto relative z-[1]">

        {/* Header */}
        <div className="mb-12">
          <SectionTag>Fonctionnalités</SectionTag>
          <h2 className="text-[34px] md:text-[46px] font-bold text-white leading-tight tracking-tight mb-4">
            Un seul outil. Tout ce qu&apos;il te faut pour coacher.
          </h2>
          <p className="text-[15px] text-[#94A3B8] max-w-xl leading-relaxed">
            Des outils simples, efficaces et pensés pour te faire gagner du temps — une fonctionnalité qui ne te sert pas ? Supprime-la.
          </p>
        </div>

        {/* Mobile — onglets horizontaux scrollables */}
        <div className="md:hidden mb-6 -mx-6 px-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="flex-shrink-0 min-h-[44px] px-3.5 text-[12.5px] font-medium transition-all rounded-lg flex items-center gap-1.5"
                style={{
                  background:  active === t.id ? 'rgba(78,155,111,0.15)' : 'rgba(255,255,255,0.04)',
                  color:       active === t.id ? '#4E9B6F' : '#94A3B8',
                  border:      active === t.id ? '1px solid rgba(78,155,111,0.35)' : '1px solid transparent',
                }}
              >
                <FeatureIcon id={t.id} size={15} />
                <span>{t.label}</span>
              </button>
            ))}
            <div className="w-px bg-white/10 self-stretch mx-1 flex-shrink-0" />
            {ENGAGEMENTS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="flex-shrink-0 min-h-[44px] px-3.5 text-[12.5px] font-medium transition-all rounded-lg flex items-center gap-1.5"
                style={{
                  background:  active === t.id ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.04)',
                  color:       active === t.id ? '#7C5CFC' : '#94A3B8',
                  border:      active === t.id ? '1px solid rgba(124,92,252,0.35)' : '1px solid transparent',
                }}
              >
                <FeatureIcon id={t.id} size={15} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop — layout deux colonnes */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="md:grid md:grid-cols-[210px_1fr]">

            {/* Nav gauche — desktop uniquement */}
            <div className="hidden md:block border-r border-white/[0.08] py-4">
              <p className="px-5 pb-2 pt-1 text-[10px] font-bold text-[#4E9B6F] tracking-[0.15em] uppercase">
                Outils
              </p>
              {TOOLS.map(t => (
                <NavItem
                  key={t.id}
                  id={t.id}
                  label={t.label}
                  active={active === t.id}
                  onClick={() => setActive(t.id)}
                  accent="#4E9B6F"
                />
              ))}

              <div className="border-t border-white/[0.06] my-3" />

              <p className="px-5 pb-2 text-[10px] font-bold text-[#7C5CFC] tracking-[0.15em] uppercase">
                Engagements
              </p>
              {ENGAGEMENTS.map(t => (
                <NavItem
                  key={t.id}
                  id={t.id}
                  label={t.label}
                  active={active === t.id}
                  onClick={() => setActive(t.id)}
                  accent="#7C5CFC"
                />
              ))}
            </div>

            {/* Contenu droite */}
            <div
              key={active}
              className="p-8 md:p-10"
              style={{
                animation: 'panelIn 0.2s ease both',
              }}
            >
              <style>{`
                @keyframes panelIn {
                  from { opacity: 0; transform: translateY(8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accent}1F`, color: accent }}
                >
                  <FeatureIcon id={current.id} size={19} />
                </div>
                <p
                  className="text-[10px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: accent }}
                >
                  {current.label}
                </p>
              </div>

              <h3 className="text-[22px] md:text-[26px] font-bold text-white leading-snug mb-3 max-w-lg">
                {current.title}
              </h3>

              <p className="text-[14px] text-[#94A3B8] leading-relaxed max-w-md mb-6">
                {current.desc}
              </p>

              <ul className="space-y-2.5">
                {current.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${accent}20` }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4.5l2 2 3-4" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-[13px] text-white/70 leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
