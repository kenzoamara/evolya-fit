'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Dumbbell, ClipboardCheck, TrendingUp, MessageCircle, Utensils, Activity } from 'lucide-react'

type Props = {
  token: string
  clientId: string
  onboardingCompletedAt: string | null
  coachName: string
  hasCheckinThisWeek: boolean
}

type DripDay = {
  icon: React.ReactNode
  title: string
  body: string
  ctaLabel: string
  ctaPath: string
  color: string
  bg: string
}

function getDripContent(daysSince: number, token: string, coachName: string, hasCheckinThisWeek: boolean): DripDay | null {
  if (daysSince > 7) return null

  if (daysSince <= 1) return {
    icon: <Dumbbell size={18} />,
    title: `${coachName} prépare votre programme`,
    body: 'Votre profil a été transmis. Revenez demain pour découvrir votre première séance.',
    ctaLabel: 'Explorer mon espace',
    ctaPath: `/c/${token}/programme`,
    color: 'var(--brand)',
    bg: 'var(--brand-bg)',
  }

  if (daysSince <= 3 && !hasCheckinThisWeek) return {
    icon: <ClipboardCheck size={18} />,
    title: 'Faites votre premier check-in',
    body: 'Chaque semaine, 2 minutes pour tenir votre coach informé de votre état et ajuster le programme.',
    ctaLabel: 'Commencer le check-in',
    ctaPath: `/c/${token}/checkins`,
    color: '#7C3AED',
    bg: '#F5F3FF',
  }

  if (daysSince <= 5) return {
    icon: <Utensils size={18} />,
    title: 'Suivez votre nutrition',
    body: 'Loggez vos repas dans la section Nutrition pour que votre coach puisse affiner vos recommandations.',
    ctaLabel: 'Voir la nutrition',
    ctaPath: `/c/${token}/nutrition`,
    color: '#059669',
    bg: '#ECFDF5',
  }

  return {
    icon: <Activity size={18} />,
    title: 'Vos statistiques vous attendent',
    body: 'Consultez l\'évolution de votre poids, de vos séances et de vos habitudes dans la section Statistiques.',
    ctaLabel: 'Voir mes stats',
    ctaPath: `/c/${token}/statistiques`,
    color: '#0284C7',
    bg: '#F0F9FF',
  }
}

const GUIDE_SECTIONS = [
  {
    icon: <Dumbbell size={16} />,
    label: 'Programme',
    desc: 'Vos séances du jour',
    path: 'programme',
    color: 'var(--brand)',
    bg: 'var(--brand-bg)',
  },
  {
    icon: <ClipboardCheck size={16} />,
    label: 'Check-in',
    desc: 'Rapport hebdo en 2 min',
    path: 'checkins',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    icon: <TrendingUp size={16} />,
    label: 'Progrès',
    desc: 'Courbes et mesures',
    path: 'progression',
    color: '#0284C7',
    bg: '#F0F9FF',
  },
  {
    icon: <MessageCircle size={16} />,
    label: 'Messages',
    desc: 'Contacter votre coach',
    path: 'messages',
    color: '#D97706',
    bg: '#FFFBEB',
  },
]

export function WelcomeGuide({ token, clientId, onboardingCompletedAt, coachName, hasCheckinThisWeek }: Props) {
  const [guideVisible, setGuideVisible] = useState(false)
  const [dripDismissed, setDripDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const daysSince = onboardingCompletedAt
    ? Math.floor((Date.now() - new Date(onboardingCompletedAt).getTime()) / 86_400_000)
    : 999

  useEffect(() => {
    setMounted(true)
    const guideDismissed = localStorage.getItem(`guide_dismissed_${clientId}`)
    if (!guideDismissed && daysSince <= 1) setGuideVisible(true)

    const dripKey = `drip_dismissed_${clientId}_d${daysSince}`
    setDripDismissed(!!localStorage.getItem(dripKey))
  }, [clientId, daysSince])

  function dismissGuide() {
    localStorage.setItem(`guide_dismissed_${clientId}`, '1')
    setGuideVisible(false)
  }

  function dismissDrip() {
    localStorage.setItem(`drip_dismissed_${clientId}_d${daysSince}`, '1')
    setDripDismissed(true)
  }

  if (!mounted) return null

  const drip = getDripContent(daysSince, token, coachName, hasCheckinThisWeek)
  const showDrip = drip && !dripDismissed && daysSince <= 7

  return (
    <>
      {/* ── Guide d'utilisation — Jour 0/1 seulement ─────────────────── */}
      {guideVisible && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[14px] font-bold text-[#0D1F3C]">Bienvenue dans votre espace</p>
              <p className="text-[12px] text-[#64748B] mt-0.5">Voici les 4 sections à connaître pour bien démarrer.</p>
            </div>
            <button
              onClick={dismissGuide}
              className="text-[#94A3B8] hover:text-[#64748B] transition-colors flex-shrink-0 p-0.5"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {GUIDE_SECTIONS.map(s => (
              <Link
                key={s.path}
                href={`/c/${token}/${s.path}`}
                onClick={dismissGuide}
                className="flex flex-col items-start gap-2 rounded-xl p-3 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFB] hover:bg-white transition-all group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: s.bg, color: s.color }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#0D1F3C] group-hover:underline">{s.label}</p>
                  <p className="text-[11px] text-[#94A3B8]">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Contenu drippé J1–J7 ──────────────────────────────────────── */}
      {showDrip && (
        <div
          className="flex items-start justify-between gap-3 rounded-xl px-4 py-3.5 mb-6 border"
          style={{ backgroundColor: drip.bg, borderColor: `color-mix(in srgb, ${drip.color} 25%, transparent)` }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `color-mix(in srgb, ${drip.color} 15%, white)`, color: drip.color }}
            >
              {drip.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#0D1F3C]">{drip.title}</p>
              <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">{drip.body}</p>
              <Link
                href={drip.ctaPath}
                className="inline-block mt-1.5 text-[12px] font-semibold hover:underline"
                style={{ color: drip.color }}
              >
                {drip.ctaLabel} →
              </Link>
            </div>
          </div>
          <button
            onClick={dismissDrip}
            className="text-[#94A3B8] hover:text-[#64748B] transition-colors flex-shrink-0 mt-0.5"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  )
}
