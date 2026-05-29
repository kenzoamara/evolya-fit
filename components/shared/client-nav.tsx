'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

type Props = {
  clientName: string
  coachName: string
  coachPhoto?: string | null
  token: string
  paymentBadge?: number
  isCoachView?: boolean
}

type NavItem = {
  href: string
  label: string
  emoji: string
  color: string
  bg: string
  badge?: number
}

type NavSection = {
  title: string
  items: NavItem[]
}

const buildNav = (base: string, paymentBadge: number, coachView: boolean): NavSection[] => {
  const q = coachView ? '?coach=1' : ''
  return [
    {
      title: 'Mon espace',
      items: [
        { href: `${base}/dashboard${q}`,    label: 'Accueil',         emoji: '🏠', color: '#6366F1', bg: '#EEF2FF' },
        { href: `${base}/messages${q}`,     label: 'Messagerie',      emoji: '💬', color: '#0EA5E9', bg: '#E0F2FE' },
      ],
    },
    {
      title: 'Mon programme',
      items: [
        { href: `${base}/programme${q}`,   label: 'Vue ensemble',     emoji: '📋', color: '#8B5CF6', bg: '#F5F3FF' },
        { href: `${base}/sport${q}`,       label: 'Entraînement',     emoji: '💪', color: '#F97316', bg: '#FFF7ED' },
        { href: `${base}/nutrition${q}`,   label: 'Nutrition',        emoji: '🥗', color: '#22C55E', bg: '#F0FDF4' },
        { href: `${base}/habitudes${q}`,   label: 'Habitudes',        emoji: '✅', color: '#A855F7', bg: '#FAF5FF' },
        { href: `${base}/agenda${q}`,      label: 'Agenda',           emoji: '📅', color: '#3B82F6', bg: '#EFF6FF' },
      ],
    },
    {
      title: 'Mes progrès',
      items: [
        { href: `${base}/progression${q}`,  label: 'Progrès',         emoji: '📈', color: '#4E9B6F', bg: '#EEF9F3' },
        { href: `${base}/statistiques${q}`, label: 'Statistiques',    emoji: '📊', color: '#F43F5E', bg: '#FFF1F2' },
        { href: `${base}/checkins${q}`,     label: 'Check-in',        emoji: '📋', color: '#14B8A6', bg: '#F0FDFA' },
        { href: `${base}/bilan${q}`,        label: 'Mon Bilan',       emoji: '🏆', color: '#D4A853', bg: '#FFFBEB' },
      ],
    },
    {
      title: 'Mon compte',
      items: [
        { href: `${base}/paiement${q}`,    label: 'Paiement',         emoji: '💳', color: '#F59E0B', bg: '#FFFBEB', badge: paymentBadge > 0 ? paymentBadge : undefined },
        { href: `${base}/notes${q}`,       label: 'Notes',            emoji: '📔', color: '#64748B', bg: '#F8FAFC' },
        { href: `${base}/profil${q}`,      label: 'Profil',           emoji: '👤', color: '#64748B', bg: '#F8FAFC' },
      ],
    },
  ]
}

// 4 onglets principaux fixes sur mobile
const MAIN_TABS = (base: string, q: string) => [
  { href: `${base}/dashboard${q}`,  label: 'Accueil',    emoji: '🏠', color: '#6366F1', bg: '#EEF2FF' },
  { href: `${base}/sport${q}`,      label: 'Entraîn.',   emoji: '💪', color: '#F97316', bg: '#FFF7ED' },
  { href: `${base}/programme${q}`,  label: 'Programme',  emoji: '📋', color: '#8B5CF6', bg: '#F5F3FF' },
  { href: `${base}/messages${q}`,   label: 'Messages',   emoji: '💬', color: '#0EA5E9', bg: '#E0F2FE' },
]

export function ClientNav({ clientName, coachName, coachPhoto, token, paymentBadge = 0 }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCoachView = searchParams.get('coach') === '1'
  const base = `/c/${token}`
  const q = isCoachView ? '?coach=1' : ''
  const sections = buildNav(base, paymentBadge, isCoachView)
  const mainTabs = MAIN_TABS(base, q)
  const [sheetOpen, setSheetOpen] = useState(false)

  const isActive = (href: string) => pathname.startsWith(href.split('?')[0])
  const isMoreActive = !mainTabs.some(t => isActive(t.href))

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-52 min-h-screen bg-white flex-col flex-shrink-0 border-r border-[#E2E8F0]">
        <div className="px-5 pt-6 pb-4">
          <Logo height={48} variant="default" />
        </div>

        <nav className="flex-1 px-2 overflow-y-auto pb-2">
          {sections.map((section, si) => (
            <div key={section.title} className={si > 0 ? 'mt-4' : ''}>
              <p className="px-3 mb-1 text-[9px] font-bold text-[#CBD5E1] uppercase tracking-[0.12em]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        active ? 'font-semibold' : 'text-[#64748B] hover:text-[#0D1F3C] hover:bg-[#F8FAFB]'
                      }`}
                      style={active ? { color: 'var(--brand)', backgroundColor: 'var(--brand-bg)' } : {}}
                    >
                      {active && (
                        <div className="absolute left-0 w-0.5 h-4 rounded-r-full" style={{ backgroundColor: 'var(--brand)', marginLeft: '-8px' }} />
                      )}
                      <span className="relative text-[15px] leading-none shrink-0">
                        {item.emoji}
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EF4444] border border-white" />
                        )}
                      </span>
                      <span className="flex-1 leading-none">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-[#EF4444] leading-none shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {isCoachView && (
          <div className="mx-3 mb-3 px-3 py-2 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl">
            <p className="text-[10px] font-bold text-[#92400E] uppercase tracking-wide">Mode spectateur</p>
            <p className="text-[11px] text-[#B45309] mt-0.5">Vue en lecture seule</p>
          </div>
        )}

        <div className="px-3 py-4 border-t border-[#E2E8F0] shrink-0">
          <p className="text-[9px] text-[#CBD5E1] uppercase tracking-wider mb-1.5">Suivi par</p>
          <div className="flex items-center gap-2 mb-3">
            {coachPhoto
              ? <img src={coachPhoto} alt={coachName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              : <div className="w-5 h-5 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[8px] font-bold text-[#64748B] flex-shrink-0">{coachName[0]}</div>
            }
            <p className="text-[11px] text-[#64748B] truncate">{coachName}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 bg-[#F0FDF4] text-[#22C55E]">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#0D1F3C] truncate">{clientName}</p>
              <p className="text-[9px] text-[#94A3B8]">Espace client</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(60px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-stretch h-[60px]">
          {/* 4 main tabs */}
          {mainTabs.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]"
                style={{ color: active ? 'var(--brand)' : '#94A3B8' }}
              >
                <span
                  className="text-[20px] leading-none flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                  style={active ? { backgroundColor: 'var(--brand-bg)', transform: 'scale(1.08)' } : {}}
                >
                  {item.emoji}
                </span>
                <span className={`text-[9px] leading-none font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* "Plus" button */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors"
            style={{ color: isMoreActive ? 'var(--brand, #4E9B6F)' : '#94A3B8' }}
          >
            <span
              className="text-[20px] leading-none flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={isMoreActive ? { backgroundColor: 'var(--brand-bg, #EEF9F3)', transform: 'scale(1.08)' } : {}}
            >
              {isMoreActive ? '●●●' : '···'}
            </span>
            <span className={`text-[9px] leading-none font-medium ${isMoreActive ? 'font-semibold' : ''}`}>Plus</span>
          </button>
        </div>
      </nav>

      {/* ── Bottom sheet "Plus" ── */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)', maxHeight: '85vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <p className="text-[15px] font-bold text-[#0D1F3C]">Navigation</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {sections.map((section) => (
                <div key={section.title} className="mb-4">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 px-1">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map(item => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all active:scale-95"
                          style={{
                            backgroundColor: active ? 'var(--brand-bg)' : '#F8FAFB',
                            border: active ? '1.5px solid var(--brand-border)' : '1.5px solid transparent',
                          }}
                        >
                          <span className="text-[24px] leading-none">{item.emoji}</span>
                          <span
                            className="text-[11px] font-medium text-center leading-tight"
                            style={{ color: active ? 'var(--brand)' : '#64748B' }}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-[#EF4444]">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Coach info dans le sheet */}
              <div className="mt-2 pt-4 border-t border-[#F1F5F9] flex items-center gap-3 px-1">
                {coachPhoto
                  ? <img src={coachPhoto} alt={coachName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[12px] font-bold text-[#64748B] flex-shrink-0">{coachName[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#94A3B8]">Suivi par</p>
                  <p className="text-[13px] font-semibold text-[#0D1F3C] truncate">{coachName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold bg-[#F0FDF4] text-[#22C55E]">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[12px] font-medium text-[#0D1F3C] truncate max-w-[100px]">{clientName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
