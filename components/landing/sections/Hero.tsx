'use client'

import Link from 'next/link'
import { WebGLShader } from '@/components/ui/web-gl-shader'

function FrenchFlag({ width = 20, height = 14 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  )
}

export function Hero() {
  return (
    <section
      className="relative overflow-hidden flex flex-col justify-center"
      style={{ minHeight: '100dvh', backgroundColor: '#0D1F3C' }}
    >
      {/* WebGL Shader background — THREE.js, branding Evolya */}
      <WebGLShader />

      {/* Overlay pour garantir la lisibilité du texte */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(13,31,60,0.55) 0%, rgba(13,31,60,0.25) 50%, rgba(13,31,60,0.60) 100%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-24 pb-14 text-center">

        {/* Bannière France */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-[10px] sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8 backdrop-blur-sm whitespace-nowrap">
          Pour les coachs sportifs indépendants francophones
          <FrenchFlag width={16} height={11} />
        </div>

        {/* Titre principal — desktop */}
        <h1 className="hidden sm:block text-[48px] md:text-[68px] lg:text-[82px] xl:text-[92px] font-extrabold text-white leading-[1.06] tracking-[-0.03em] mb-5 sm:mb-6">
          Arrête de jongler entre WhatsApp,{' '}
          les suivis et l'administratif.{' '}
          Dépasse les{' '}
          <span className="text-[#4E9B6F]" style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontStyle: 'normal' }}>30 membres</span>{' '}
          sans charge de travail supplémentaire ni{' '}
          <span className="text-[#4E9B6F]" style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontStyle: 'normal' }}>perte de qualité.</span>
        </h1>

        {/* Titre principal — mobile */}
        <h1 className="sm:hidden text-[34px] font-extrabold text-white leading-[1.1] tracking-[-0.025em] mb-5">
          Arrête de gérer ton activité à l'ancienne et dépasse les{' '}
          <span className="text-[#4E9B6F]" style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontStyle: 'normal' }}>30 membres</span>{' '}
          sans augmenter ta charge de travail ni négliger la{' '}
          <span className="text-[#4E9B6F]" style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontStyle: 'normal' }}>qualité de ton coaching</span>.
        </h1>

        {/* Sous-titre */}
        <p className="text-[15px] sm:text-[17px] md:text-[19px] text-white/65 leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto">
          Le système tout-en-un pour structurer ton coaching, automatiser le suivi et garder un lien fort avec chaque membre — sans surcharge de travail.
        </p>

        {/* CTA principal */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#4E9B6F] hover:bg-[#3D7A5F] text-white text-[15px] sm:text-[16px] font-bold px-8 py-4 rounded-xl transition-colors shadow-[0_4px_24px_rgba(78,155,111,0.45)]"
          >
            Commencer gratuitement — 14 jours offerts
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M3.5 8.5h10M9.5 4.5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          <p className="text-[12px] sm:text-[13px] text-white/45 font-medium">
            Sans carte bancaire · Opérationnel en 10 minutes
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-white/60 text-[11px] sm:text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
              <FrenchFlag width={13} height={10} />
              Conçu en France
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-white/60 text-[11px] sm:text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8.5l3 3 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-white/60 text-[11px] sm:text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Hébergé en Europe
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
