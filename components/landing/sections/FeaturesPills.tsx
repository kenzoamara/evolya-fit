'use client'

import { useState } from 'react'
import { AnimatedBackground } from '../AnimatedBackground'
import { SectionTag } from '@/components/landing/section-tag'

const TOOLS = [
  {
    id: 'programme',
    emoji: '📋',
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
    emoji: '⚡',
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
    emoji: '📊',
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
    emoji: '💬',
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
    emoji: '📱',
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
    emoji: '🔗',
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
    emoji: '📈',
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
    emoji: '🎨',
    label: 'Personnalisation',
    title: "Une plateforme à ton image, pas un outil générique.",
    desc: "Ta couleur de marque, ton logo, ta photo — tes membres voient TON identité, pas la nôtre. Tout l'espace membre s'habille à ta marque. La différence entre un freelance et un cabinet professionnel.",
    bullets: [
      'Ta couleur de marque appliquée à tout l\'espace membre',
      'Logo et photo de profil personnalisés',
      'Page d\'invitation et espace membre à ton image',
      'Mode clair, sombre ou automatique',
    ],
  },
]

const ENGAGEMENTS = [
  {
    id: 'fiabilite',
    emoji: '🛡️',
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
    emoji: '✨',
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
    emoji: '⚙️',
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
    emoji: '🎧',
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

function NavItem({ emoji, label, active, onClick, accent }: {
  emoji: string
  label: string
  active: boolean
  onClick: () => void
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-[13px] transition-all duration-150 flex items-center gap-3 border-l-2"
      style={{
        borderLeftColor: active ? accent : 'transparent',
        color:           active ? '#FFFFFF' : '#475569',
        background:      active ? 'rgba(255,255,255,0.05)' : 'transparent',
        fontWeight:      active ? 600 : 400,
      }}
    >
      <span className="text-[15px] leading-none flex-shrink-0">{emoji}</span>
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
          <p className="text-[15px] text-[#64748B] max-w-xl leading-relaxed">
            Des outils simples, efficaces et pensés pour te faire gagner du temps — une fonctionnalité qui ne te sert pas ? Supprime-la.
          </p>
        </div>

        {/* Mobile — onglets horizontaux scrollables */}
        <div className="md:hidden mb-6 -mx-6 px-6">
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="flex-shrink-0 px-3 py-2 text-[12px] font-medium transition-all rounded-md flex items-center gap-1.5"
                style={{
                  background:  active === t.id ? 'rgba(78,155,111,0.15)' : 'rgba(255,255,255,0.04)',
                  color:       active === t.id ? '#4E9B6F' : '#64748B',
                  borderBottom: active === t.id ? '2px solid #4E9B6F' : '2px solid transparent',
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
            <div className="w-px bg-white/10 self-stretch mx-1 flex-shrink-0" />
            {ENGAGEMENTS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="flex-shrink-0 px-3 py-2 text-[12px] font-medium transition-all rounded-md flex items-center gap-1.5"
                style={{
                  background:  active === t.id ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.04)',
                  color:       active === t.id ? '#7C5CFC' : '#64748B',
                  borderBottom: active === t.id ? '2px solid #7C5CFC' : '2px solid transparent',
                }}
              >
                <span>{t.emoji}</span>
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
                  emoji={t.emoji}
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
                  emoji={t.emoji}
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

              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-[22px] leading-none">{current.emoji}</span>
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

              <p className="text-[14px] text-[#64748B] leading-relaxed max-w-md mb-6">
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
                    <span className="text-[13px] text-white/65 leading-snug">{b}</span>
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
