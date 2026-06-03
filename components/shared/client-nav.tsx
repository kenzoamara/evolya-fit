'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

/* ── Icônes de navigation (SVG monochromes, jamais d'emoji) ── */
function NavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'home':      return <svg {...s}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/><path d="M9 21V14h6v7"/></svg>
    case 'message':   return <svg {...s}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    case 'programme': return <svg {...s}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v2H9z"/><path d="M8.5 10h7M8.5 14h7M8.5 18h4"/></svg>
    case 'sport':     return <svg {...s}><path d="M3 9v6M6.5 7.5v9M17.5 7.5v9M21 9v6M6.5 12h11"/></svg>
    case 'nutrition': return <svg {...s}><path d="M11 20A7 7 0 014 13C4 7 11 4 20 3c-1 9-4 16-9 17z"/><path d="M11 20c0-5 2.5-8.5 6.5-11"/></svg>
    case 'habitudes': return <svg {...s}><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>
    case 'agenda':    return <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'progres':   return <svg {...s}><path d="M3 17l6-6 4 4 7-7"/><path d="M17 7h4v4"/></svg>
    case 'stats':     return <svg {...s}><path d="M3 21h18"/><path d="M6 21V11M12 21V5M18 21v-7"/></svg>
    case 'checkin':   return <svg {...s}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v2H9z"/><path d="M8.5 13l2.5 2.5 4-5"/></svg>
    case 'bilan':     return <svg {...s}><circle cx="12" cy="9" r="5"/><path d="M8.5 13L7.5 21l4.5-2.2L16.5 21l-1-8"/></svg>
    case 'calcul':    return <svg {...s}><rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="3" rx="0.5"/><path d="M9 13h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01M15 16h.01"/></svg>
    case 'rdv':       return <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M12 14v4M10 16h4"/></svg>
    case 'notes':     return <svg {...s}><path d="M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M9 3v18M12.5 8h4M12.5 12h4"/></svg>
    case 'profil':    return <svg {...s}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/></svg>
    case 'more':      return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    default:          return null
  }
}

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
  icon: string
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
        { href: `${base}/dashboard${q}`,    label: 'Accueil',         icon: 'home' },
        { href: `${base}/messages${q}`,     label: 'Messagerie',      icon: 'message' },
      ],
    },
    {
      title: 'Mon programme',
      items: [
        { href: `${base}/programme${q}`,   label: 'Vue ensemble',     icon: 'programme' },
        { href: `${base}/sport${q}`,       label: 'Entraînement',     icon: 'sport' },
        { href: `${base}/nutrition${q}`,   label: 'Nutrition',        icon: 'nutrition' },
        { href: `${base}/habitudes${q}`,   label: 'Habitudes',        icon: 'habitudes' },
        { href: `${base}/agenda${q}`,      label: 'Agenda',           icon: 'agenda' },
      ],
    },
    {
      title: 'Mes progrès',
      items: [
        { href: `${base}/progression${q}`,  label: 'Progrès',         icon: 'progres' },
        { href: `${base}/statistiques${q}`, label: 'Statistiques',    icon: 'stats' },
        { href: `${base}/checkins${q}`,     label: 'Check-in',        icon: 'checkin' },
        { href: `${base}/bilan${q}`,        label: 'Mon Bilan',       icon: 'bilan' },
      ],
    },
    {
      title: 'Mon compte',
      items: [
        { href: `${base}/calcul${q}`,      label: 'Calculatrice',     icon: 'calcul' },
        { href: `${base}/rdv${q}`,         label: 'Réserver',         icon: 'rdv' },
        { href: `${base}/notes${q}`,       label: 'Notes',            icon: 'notes' },
        { href: `${base}/profil${q}`,      label: 'Profil',           icon: 'profil' },
      ],
    },
  ]
}

// 4 onglets principaux fixes sur mobile
const MAIN_TABS = (base: string, q: string) => [
  { href: `${base}/dashboard${q}`,  label: 'Accueil',    icon: 'home' },
  { href: `${base}/sport${q}`,      label: 'Entraîn.',   icon: 'sport' },
  { href: `${base}/programme${q}`,  label: 'Programme',  icon: 'programme' },
  { href: `${base}/messages${q}`,   label: 'Messages',   icon: 'message' },
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
      <aside className="hidden md:flex w-52 min-h-dvh bg-white flex-col flex-shrink-0 border-r border-[#E2E8F0]">
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
                      <span className="relative shrink-0 flex items-center justify-center" style={active ? { color: 'var(--brand)' } : { color: '#94A3B8' }}>
                        <NavIcon name={item.icon} size={18} />
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
                  className="leading-none flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                  style={active ? { backgroundColor: 'var(--brand-bg)', transform: 'scale(1.08)' } : {}}
                >
                  <NavIcon name={item.icon} size={22} />
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
              className="leading-none flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={isMoreActive ? { backgroundColor: 'var(--brand-bg, #EEF9F3)', transform: 'scale(1.08)' } : {}}
            >
              <NavIcon name="more" size={22} />
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
                          <span className="leading-none flex items-center justify-center" style={{ color: active ? 'var(--brand)' : '#64748B' }}>
                            <NavIcon name={item.icon} size={24} />
                          </span>
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
