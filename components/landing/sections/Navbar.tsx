'use client'

import { useState, useEffect } from 'react'
import { Logo } from '@/components/shared/logo'

const NAV_LINKS = [
  { label: 'Fonctionnalites', href: '#features' },
  { label: 'Comment ca marche', href: '#how' },
  { label: 'Tarifs', href: '#pricing' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">

      <style>{`
        @keyframes navShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Barre flottante arrondie */}
      <div
        className={`max-w-5xl mx-auto h-[58px] flex items-center justify-between gap-6 px-5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
          scrolled
            ? 'bg-white/[0.97] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-[#E5E7EB]'
            : 'bg-white/90 backdrop-blur-sm shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#E5E7EB]'
        }`}
      >
        {/* Shimmer animé subtil sur le header */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #4E9B6F 25%, transparent 50%, #0D1F3C 75%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'navShimmer 8s ease-in-out infinite',
          }}
        />
        {/* Left — logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Logo height={52} />
        </div>

        {/* Center — nav links */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13.5px] font-medium text-[#374151] hover:text-[#0D1F3C] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — CTAs */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <a
            href="/auth/login"
            className="text-[13.5px] font-medium text-[#374151] hover:text-[#0D1F3C] transition-colors px-4 py-2 rounded-lg hover:bg-[#F8FAFB]"
          >
            Se connecter
          </a>
          <a
            href="/#pricing"
            className="text-[13.5px] font-semibold bg-[#0D1F3C] text-white px-4 py-2 rounded-xl hover:bg-[#152E55] transition-colors"
          >
            Créer un compte
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 text-[#374151]"
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer — attaché sous la barre flottante */}
      {open && (
        <div className="max-w-5xl mx-auto mt-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-6 py-4 space-y-1">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-[14px] font-medium text-[#374151] border-b border-[#F3F4F6]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 space-y-2">
            <a href="/auth/login" className="block text-center py-2.5 text-[14px] font-medium text-[#374151] border border-[#E5E7EB] rounded-xl">
              Se connecter
            </a>
            <a href="/#pricing" className="block text-center py-2.5 text-[14px] font-semibold bg-[#0D1F3C] text-white rounded-xl">
              Créer un compte
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
