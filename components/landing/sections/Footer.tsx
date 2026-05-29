'use client'

import Link from 'next/link'
import { Apple, Play } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { AnimatedBackground } from '../AnimatedBackground'

function StoreBadge({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div className="relative flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 opacity-70">
      <span className="text-white/60">{icon}</span>
      <div className="text-left">
        <p className="text-[9px] text-white/40 leading-none">{top}</p>
        <p className="text-[13px] font-semibold text-white/70 leading-tight mt-0.5">{bottom}</p>
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
            <StoreBadge icon={<Apple size={20} />} top="Bientôt sur" bottom="App Store" />
            <StoreBadge icon={<Play size={18} />} top="Bientôt sur" bottom="Google Play" />
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
