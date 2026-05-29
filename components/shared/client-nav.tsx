'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
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
  badgeKey?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS = (base: string, paymentBadge: number, coachView: boolean): NavSection[] => {
  const q = coachView ? '?coach=1' : ''
  return [
    {
      title: 'Mon espace',
      items: [
        { href: `${base}/dashboard${q}`, label: 'Accueil',    emoji: '🏠', color: '#6366F1', bg: '#EEF2FF' },
        { href: `${base}/messages${q}`,  label: 'Messagerie', emoji: '💬', color: '#0EA5E9', bg: '#E0F2FE' },
      ],
    },
    {
      title: 'Mon programme',
      items: [
        { href: `${base}/programme${q}`,  label: 'Vue d\'ensemble', emoji: '📋', color: '#8B5CF6', bg: '#F5F3FF' },
        { href: `${base}/sport${q}`,      label: 'Entraînement',    emoji: '💪', color: '#F97316', bg: '#FFF7ED' },
        { href: `${base}/nutrition${q}`,  label: 'Nutrition',       emoji: '🥗', color: '#22C55E', bg: '#F0FDF4' },
        { href: `${base}/habitudes${q}`,  label: 'Habitudes',       emoji: '✅', color: '#A855F7', bg: '#FAF5FF' },
        { href: `${base}/agenda${q}`,     label: 'Agenda',          emoji: '📅', color: '#3B82F6', bg: '#EFF6FF' },
      ],
    },
    {
      title: 'Mes progrès',
      items: [
        { href: `${base}/progression${q}`,  label: 'Progrès',       emoji: '📈', color: '#4E9B6F', bg: '#EEF9F3' },
        { href: `${base}/statistiques${q}`, label: 'Statistiques',  emoji: '📊', color: '#F43F5E', bg: '#FFF1F2' },
        { href: `${base}/checkins${q}`,     label: 'Check-in',      emoji: '📋', color: '#14B8A6', bg: '#F0FDFA' },
        { href: `${base}/bilan${q}`,        label: 'Mon Bilan',     emoji: '🏆', color: '#D4A853', bg: '#FFFBEB' },
      ],
    },
    {
      title: 'Mon compte',
      items: [
        { href: `${base}/paiement${q}`, label: 'Paiement', emoji: '💳', color: '#F59E0B', bg: '#FFFBEB', badgeKey: true },
        { href: `${base}/notes${q}`,    label: 'Notes',    emoji: '📔', color: '#64748B', bg: '#F8FAFC' },
        { href: `${base}/profil${q}`,   label: 'Profil',   emoji: '👤', color: '#64748B', bg: '#F8FAFC' },
      ],
    },
  ]
}

// Mobile bottom nav : 5 items fixes (pas de scroll)
const MOBILE_ITEMS = (base: string, coachView: boolean, paymentBadge: number) => {
  const q = coachView ? '?coach=1' : ''
  return [
    { href: `${base}/dashboard${q}`,  label: 'Accueil',    emoji: '🏠', color: '#6366F1', bg: '#EEF2FF',  badgeKey: false },
    { href: `${base}/programme${q}`,  label: 'Programme',  emoji: '📋', color: '#8B5CF6', bg: '#F5F3FF',  badgeKey: false },
    { href: `${base}/sport${q}`,      label: 'Entraîn.',   emoji: '💪', color: '#F97316', bg: '#FFF7ED',  badgeKey: false },
    { href: `${base}/messages${q}`,   label: 'Messages',   emoji: '💬', color: '#0EA5E9', bg: '#E0F2FE',  badgeKey: false },
    { href: `${base}/profil${q}`,     label: 'Profil',     emoji: '👤', color: '#64748B', bg: '#F8FAFC',  badgeKey: paymentBadge > 0 },
  ]
}

export function ClientNav({ clientName, coachName, coachPhoto, token, paymentBadge = 0 }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Mode spectateur uniquement si le param ?coach=1 est explicitement dans l'URL
  const isCoachView = searchParams.get('coach') === '1'
  const base = `/c/${token}`
  const sections = NAV_SECTIONS(base, paymentBadge, isCoachView)
  const mobileItems = MOBILE_ITEMS(base, isCoachView, paymentBadge)

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
              {/* Section label */}
              <p className="px-3 mb-1 text-[9px] font-bold text-[#CBD5E1] uppercase tracking-[0.12em]">
                {section.title}
              </p>

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = pathname.startsWith(item.href)
                  const showBadge = item.badgeKey && paymentBadge > 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        active ? 'font-semibold' : 'text-[#64748B] hover:text-[#0D1F3C] hover:bg-[#F8FAFB]'
                      }`}
                      style={active ? { color: item.color, backgroundColor: item.bg } : {}}
                    >
                      {active && (
                        <div
                          className="absolute left-0 w-0.5 h-4 rounded-r-full"
                          style={{ backgroundColor: item.color, marginLeft: '-8px' }}
                        />
                      )}
                      <span className="relative text-[15px] leading-none shrink-0">
                        {item.emoji}
                        {showBadge && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EF4444] border border-white" />
                        )}
                      </span>
                      <span className="flex-1 leading-none">{item.label}</span>
                      {showBadge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-[#EF4444] leading-none shrink-0">
                          {paymentBadge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Spectator banner */}
        {isCoachView && (
          <div className="mx-3 mb-3 px-3 py-2 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl">
            <p className="text-[10px] font-bold text-[#92400E] uppercase tracking-wide">Mode spectateur</p>
            <p className="text-[11px] text-[#B45309] mt-0.5">Vue en lecture seule</p>
          </div>
        )}

        {/* Coach + client info */}
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

      {/* ── Mobile bottom nav — 5 items fixes ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0]"
        style={{ height: 60 }}
      >
        <div className="flex items-stretch h-full">
          {mobileItems.map(item => {
            const active = pathname.startsWith(item.href)
            const showBadge = item.badgeKey && paymentBadge > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color: active ? item.color : '#94A3B8' }}
              >
                <span
                  className="relative text-[18px] leading-none flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
                  style={active ? { backgroundColor: item.bg } : {}}
                >
                  {item.emoji}
                  {showBadge && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#EF4444] border border-white" />
                  )}
                </span>
                <span className="text-[8px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
