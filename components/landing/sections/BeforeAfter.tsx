'use client'

import { useState } from 'react'

const BEFORE = [
  "Tu jongles entre WhatsApp, Sheets et plusieurs apps pour suivre tes membres.",
  "Tu oublies des check-ins. Des relances. Des détails importants.",
  "Plus tu prends d'membres, plus la qualité de ton coaching baisse. Tu le sens.",
  "Tu passes plus de temps à gérer qu'à coacher.",
  "À 20 membres, tu es déjà sous pression. À 30, tu n'y crois même plus.",
]

const AFTER = [
  "Un seul système. Tous tes membres. Tout est structuré.",
  "Les check-ins partent automatiquement. Les relances aussi. Tu récupères plusieurs heures par semaine.",
  "Tu peux gérer plus d'membres sans te disperser ni perdre en qualité.",
  "Chaque suivi reste clair, précis et maîtrisé — ta charge mentale diminue.",
  "Tu passes d'un coaching dispersé à un système organisé et fluide, sans changer ta façon de coacher.",
]

function BeforeItem({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-default transition-all duration-300"
      style={{
        background: hovered ? 'rgba(239,68,68,0.07)' : 'transparent',
        boxShadow: hovered ? '0 0 24px rgba(239,68,68,0.12), inset 0 0 0 1px rgba(239,68,68,0.12)' : 'none',
      }}
    >
      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300"
        style={{ borderColor: hovered ? 'rgba(239,68,68,0.4)' : undefined }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2L2 8" stroke={hovered ? '#EF4444' : '#EF444480'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-[13px] leading-relaxed transition-colors duration-300"
        style={{ color: hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)' }}
      >
        {text}
      </p>
    </li>
  )
}

function AfterItem({ text, index }: { text: string; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-default transition-all duration-300"
      style={{
        background: hovered ? 'rgba(78,155,111,0.1)' : 'transparent',
        boxShadow: hovered ? '0 0 28px rgba(78,155,111,0.2), inset 0 0 0 1px rgba(78,155,111,0.2)' : 'none',
        transitionDelay: `${index * 20}ms`,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300"
        style={{
          background: hovered ? 'rgba(78,155,111,0.25)' : 'rgba(78,155,111,0.1)',
          border: `1px solid ${hovered ? 'rgba(78,155,111,0.7)' : 'rgba(78,155,111,0.3)'}`,
          boxShadow: hovered ? '0 0 10px rgba(78,155,111,0.4)' : 'none',
        }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="#4E9B6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p
        className="text-[13px] leading-relaxed font-medium transition-colors duration-300"
        style={{ color: hovered ? '#ffffff' : 'rgba(255,255,255,0.8)' }}
      >
        {text}
      </p>
    </li>
  )
}

export function BeforeAfter() {
  return (
    <section className="bg-[#F8FAFB] py-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-[#4E9B6F] tracking-[0.15em] uppercase mb-4">
            La transformation
          </p>
          <h2 className="text-[26px] sm:text-[32px] md:text-[38px] font-bold text-[#0D1F3C] tracking-tight leading-tight max-w-3xl mx-auto">
            Le système inspiré des meilleurs outils du marché.{' '}
            <span className="text-[#4E9B6F]">Conçu pour les coachs sportifs indépendants.</span>{' '}
            Fait en France.
          </h2>
        </div>

        {/* Layout 3 colonnes desktop, empilé mobile */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_72px_1fr] gap-4 md:gap-0 items-center">

          {/* AVANT */}
          <div className="rounded-2xl bg-[#0D1F3C] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <p className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Avant</p>
            </div>
            <ul className="space-y-1">
              {BEFORE.map((item, i) => <BeforeItem key={i} text={item} />)}
            </ul>
          </div>

          {/* Flèche centrale */}
          <div className="flex flex-col items-center justify-center py-4 md:py-0 gap-2">
            {/* Ligne verticale du haut (desktop seulement) */}
            <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent to-[#EF4444]/40" />

            {/* Cercle flèche */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(78,155,111,0.15))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 20px rgba(78,155,111,0.15), 0 0 20px rgba(239,68,68,0.1)',
              }}
            >
              {/* Flèche horizontale desktop */}
              <svg className="hidden md:block" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#4E9B6F" />
                  </linearGradient>
                </defs>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="url(#arrowGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Flèche verticale mobile */}
              <svg className="md:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="arrowGradV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#4E9B6F" />
                  </linearGradient>
                </defs>
                <path d="M12 5v14M6 13l6 6 6-6" stroke="url(#arrowGradV)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Ligne verticale du bas (desktop seulement) */}
            <div className="hidden md:block w-px h-12 bg-gradient-to-b from-[#4E9B6F]/40 to-transparent" />
          </div>

          {/* APRES — version prestigieuse */}
          <div
            className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0f2318 0%, #0D1F3C 60%, #0a1f12 100%)',
              boxShadow: '0 0 0 1px rgba(78,155,111,0.25), 0 24px 60px rgba(78,155,111,0.12)',
            }}
          >
            {/* Shimmer gradient en haut */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(78,155,111,0.8), transparent)' }}
            />
            {/* Glow de fond */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(78,155,111,0.12) 0%, transparent 70%)' }}
            />

            <div className="flex items-center gap-2 mb-5 relative">
              <div className="w-2 h-2 rounded-full bg-[#4E9B6F]"
                style={{ boxShadow: '0 0 8px rgba(78,155,111,0.8)' }}
              />
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: '#4E9B6F' }}
              >
                Avec Evolya&apos;Fit
              </p>
              <div
                className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
                style={{
                  background: 'rgba(78,155,111,0.15)',
                  border: '1px solid rgba(78,155,111,0.3)',
                  color: '#4E9B6F',
                }}
              >
                Inclus
              </div>
            </div>

            <ul className="space-y-1 relative">
              {AFTER.map((item, i) => <AfterItem key={i} text={item} index={i} />)}
            </ul>

            {/* Shimmer gradient en bas */}
            <div
              className="absolute inset-x-0 bottom-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(78,155,111,0.4), transparent)' }}
            />
          </div>

        </div>
      </div>
    </section>
  )
}
