'use client'

import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { AnimatedBackground } from '../AnimatedBackground'

const AppleLogo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF" aria-hidden>
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
)

const GooglePlayLogo = () => (
  <svg viewBox="0 0 512 512" width="22" height="22" aria-hidden>
    <path fill="#4285F4" d="M48 16 48 496 256 256Z"/>
    <path fill="#EA4335" d="M48 16 380 208 256 256Z"/>
    <path fill="#34A853" d="M48 496 380 304 256 256Z"/>
    <path fill="#FBBC04" d="M380 208 462 256 380 304 256 256Z"/>
  </svg>
)

function StoreBadge({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2.5 min-w-[150px]">
      <span className="flex items-center justify-center w-6 shrink-0">{icon}</span>
      <div className="text-left">
        <p className="text-[9px] text-white/55 leading-none">{top}</p>
        <p className="text-[14px] font-semibold text-white leading-tight mt-0.5">{bottom}</p>
      </div>
    </div>
  )
}

const PRODUCT_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Comment ça marche', href: '#how' },
]

const LEGAL_LINKS = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
  { label: 'CGU', href: '/cgu' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-[#091528] to-[#040A14] px-6 pt-20 pb-10 relative overflow-hidden">
      <AnimatedBackground mode="mesh" theme="dark" intensity={1} />
      <div className="max-w-5xl mx-auto relative z-[1]">

        {/* ── Bloc focal : apps mobiles bientôt ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 mb-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] text-[#4E9B6F] mb-2">Bientôt disponible</span>
            <h3 className="text-[20px] sm:text-[24px] font-bold text-white leading-tight">Emporte ton coaching partout</h3>
            <p className="text-[13px] text-white/45 mt-1.5 max-w-sm">Les applications iOS et Android arrivent. Tes membres t&apos;auront dans la poche.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StoreBadge icon={<AppleLogo />} top="Bientôt sur" bottom="App Store" />
            <StoreBadge icon={<GooglePlayLogo />} top="Bientôt sur" bottom="Google Play" />
          </div>
        </div>

        {/* ── Marque + navigation ── */}
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-white/[0.06]">
          {/* Brand col */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo height={48} variant="light" />
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[260px]">
              Gère ton coaching, simplement — moins d&apos;outils, plus de résultats.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-[11px] font-bold text-white/70 tracking-[0.15em] uppercase mb-4">
              Produit
            </h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link, j) => (
                <li key={j}>
                  <Link href={link.href} className="text-[13px] text-white/45 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Mention légale (discrète) ── */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/25 order-2 md:order-1">
            &copy; {year} Evolya. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 order-1 md:order-2">
            {LEGAL_LINKS.map((link, i) => (
              <Link key={i} href={link.href} className="text-[12px] text-white/25 hover:text-white/50 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
