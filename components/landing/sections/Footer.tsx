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
  <svg viewBox="0 0 512 512" width="20" height="20" aria-hidden>
    <path fill="#EA4335" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z"/>
    <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z"/>
    <path fill="#34A853" d="M104.6 499l220.7-221.3 60.1 60.1L104.6 499z"/>
    <path fill="#FBBC04" d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z"/>
  </svg>
)

function StoreBadge({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div className="relative flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2.5">
      <span className="flex items-center justify-center w-6">{icon}</span>
      <div className="text-left">
        <p className="text-[9px] text-white/60 leading-none">{top}</p>
        <p className="text-[14px] font-semibold text-white leading-tight mt-0.5">{bottom}</p>
      </div>
      <span className="absolute -top-2 -right-2 text-[9px] font-bold uppercase tracking-wide text-white bg-[#4E9B6F] rounded-full px-2 py-0.5">
        Bientôt
      </span>
    </div>
  )
}

const FOOTER_COLS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalites', href: '#features' },
      { label: 'Tarifs', href: '#pricing' },
      { label: 'Comment ca marche', href: '#how' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Mentions legales', href: '/mentions-legales' },
      { label: 'Politique de confidentialite', href: '/politique-confidentialite' },
      { label: 'CGU', href: '/cgu' },
    ],
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-[#091528] to-[#040A14] px-6 pt-20 pb-10 relative overflow-hidden">
      <AnimatedBackground mode="mesh" theme="dark" intensity={1} />
      <div className="max-w-5xl mx-auto relative z-[1]">
        {/* Top row */}
        <div className="grid md:grid-cols-4 gap-12 pb-16 border-b border-white/[0.06]">
          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="mb-5">
              <Logo height={51} variant="light" />
            </div>
            <p className="text-[13px] text-white/35 leading-relaxed max-w-[220px]">
              Gere ton coaching, simplement — pour moins d'outils et plus de resultats.
            </p>
          </div>

          {/* Link cols */}
          {FOOTER_COLS.map((col, i) => (
            <div key={i}>
              <h4 className="text-[12px] font-semibold text-white/50 tracking-widest uppercase mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="text-[13px] text-white/35 hover:text-white/70 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Apps mobiles — bientôt */}
        <div className="py-10 border-b border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <p className="text-[14px] font-semibold text-white/80">Les applications mobiles arrivent</p>
            <p className="text-[12px] text-white/35 mt-1">Bientôt sur l&apos;App Store et Google Play.</p>
          </div>
          <div className="flex items-center gap-3">
            <StoreBadge icon={<AppleLogo />} top="Bientôt sur" bottom="App Store" />
            <StoreBadge icon={<GooglePlayLogo />} top="Bientôt sur" bottom="Google Play" />
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/25 order-2 md:order-1">
            &copy; {year} Evolya. Tous droits reserves.
          </p>
          <div className="flex items-center gap-6 order-1 md:order-2">
            {FOOTER_COLS[1].links.map((link, i) => (
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
