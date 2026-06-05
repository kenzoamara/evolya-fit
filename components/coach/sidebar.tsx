'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/logo'
import type { Profile } from '@/types/database'
import { LogOut, ChevronDown, ChevronUp, Settings } from 'lucide-react'

/* ── Icônes bottom-nav (SVG, jamais d'emoji) ── */
function BottomIcon({ name, size = 22 }: { name: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'home':     return <svg {...s}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/><path d="M9 21V14h6v7"/></svg>
    case 'users':    return <svg {...s}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M22 21c0-3-2.5-5.5-5.5-6"/></svg>
    case 'calendar': return <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'message':  return <svg {...s}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    case 'more':     return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    default:         return null
  }
}

const BOTTOM_TABS = [
  { id: 'dashboard',  label: 'Accueil',  href: '/dashboard',  icon: 'home' },
  { id: 'clients',    label: 'Elève',  href: '/clients',    icon: 'users' },
  { id: 'agenda',     label: 'Planning', href: '/agenda',     icon: 'calendar' },
  { id: 'messagerie', label: 'Messages', href: '/messagerie', icon: 'message' },
] as const

type NavItem = {
  id: string
  label: string
  href: string
  emoji: string
  emojiColor: string
  emojiBg: string
  badge?: number
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

type Props = { profile: Profile }

function useNavBadges(coachId: string, lastRoadmap: string | null) {
  const [unread, setUnread] = useState(0)
  const [newUpdates, setNewUpdates] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { count: msg } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('sender_role', 'client')
        .eq('read_by_coach', false)
      setUnread(msg ?? 0)

      let q = supabase
        .from('roadmap_items')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'released')
        .eq('is_published', true)
      if (lastRoadmap) q = q.gt('created_at', lastRoadmap)
      const { count: rd } = await q
      setNewUpdates(rd ?? 0)
    }
    fetch()

    const channel = supabase
      .channel('sidebar-badges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `coach_id=eq.${coachId}` }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [coachId, lastRoadmap])

  return { unread, newUpdates }
}

type SidebarContentProps = {
  navGroups: NavGroup[]
  active: (href: string) => boolean
  profile: Profile
  initials: string
  logout: () => void
}

function SidebarContent({ navGroups, active, profile, initials, logout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 shrink-0">
        <Logo height={34} variant="default" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="h-px bg-[#F1F5F9] my-2 mx-1" />}
            {group.label && (
              <p className="text-[10px] font-semibold text-[--evolya-subtle] uppercase tracking-widest px-2.5 pb-1 pt-0.5">
                {group.label}
              </p>
            )}
            {group.items.map(item => (
              <NavLink key={item.id} item={item} active={active(item.href)} />
            ))}
          </div>
        ))}
      </nav>

      {/* Trial badge */}
      {profile.plan_status === 'trial' && profile.trial_ends_at && (() => {
        const days = Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
        return days > 0 ? (
          <div className="mx-3 mb-2 px-3 py-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-lg">
            <p className="text-[10px] text-[#92400E] font-semibold uppercase tracking-wide">Essai gratuit</p>
            <p className="text-[12px] font-bold text-[#C2410C] mt-0.5">{days} jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}</p>
          </div>
        ) : null
      })()}

      {/* User footer */}
      <div className="px-3 pb-4 pt-2 shrink-0" style={{ borderTop: '1px solid var(--evolya-border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 text-white overflow-hidden"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-[--evolya-text] truncate leading-tight">{profile.full_name ?? 'Coach'}</p>
            <p className="text-[11px] text-[--evolya-subtle] capitalize leading-tight mt-0.5">{profile.coaching_type ?? 'Coach'}</p>
          </div>
          <button
            onClick={logout}
            className="text-[--evolya-subtle] hover:text-[--evolya-muted] transition-colors p-1.5 rounded-lg hover:bg-[#F8FAFB]"
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative ${
        active ? '' : 'text-[--evolya-muted] hover:bg-[#F8FAFB] hover:text-[--evolya-text]'
      }`}
      style={active ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand)' } : {}}
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center text-[13px] shrink-0 transition-all"
        style={{
          backgroundColor: active ? item.emojiColor + '22' : item.emojiBg,
          color: active ? item.emojiColor : item.emojiColor,
        }}
      >
        {item.emoji}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {(item.badge ?? 0) > 0 && (
        <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 text-white bg-[#EF4444]">
          {(item.badge ?? 0) > 9 ? '9+' : item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { unread, newUpdates } = useNavBadges(profile.id, profile.last_visited_roadmap)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  // Fermer le drawer à chaque changement de page
  useEffect(() => { setMobileOpen(false); setAccountOpen(false) }, [pathname])

  function toggleGroup(gi: number) {
    setCollapsed(c => ({ ...c, [gi]: !c[gi] }))
  }

  function active(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = (profile.full_name ?? 'C')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const NAV_GROUPS: NavGroup[] = [
    {
      items: [
        { id: 'dashboard', label: 'Accueil',       href: '/dashboard', emoji: '🏠', emojiColor: '#4E9B6F', emojiBg: '#EEF9F3' },
        { id: 'clients',   label: 'Mes membres',  href: '/clients',   emoji: '👥', emojiColor: '#3B82F6', emojiBg: '#EFF6FF' },
      ],
    },
    {
      label: 'COACHING',
      items: [
        { id: 'programmes',  label: 'Programmes',   href: '/programmes',  emoji: '📋', emojiColor: '#8B5CF6', emojiBg: '#F5F3FF' },
        { id: 'exercices',   label: 'Bibliothèque', href: '/exercices',   emoji: '🦾', emojiColor: '#EA580C', emojiBg: '#FFF7ED' },
        { id: 'agenda',      label: 'Planning',     href: '/agenda',      emoji: '📅', emojiColor: '#D97706', emojiBg: '#FFFBEB' },
        { id: 'messagerie',  label: 'Messagerie',   href: '/messagerie',  emoji: '💬', emojiColor: '#0D9488', emojiBg: '#F0FDFA', badge: unread },
      ],
    },
    {
      label: 'PILOTAGE',
      items: [
        { id: 'business',     label: 'Business',     href: '/business',     emoji: '📊', emojiColor: '#4E9B6F', emojiBg: '#EEF9F3' },
        { id: 'statistiques', label: 'Statistiques', href: '/statistiques', emoji: '📈', emojiColor: '#3B82F6', emojiBg: '#EFF6FF' },
        { id: 'calcul',       label: 'Calcul',       href: '/calcul',       emoji: '🧮', emojiColor: '#DB2777', emojiBg: '#FCE7F3' },
      ],
    },
    {
      label: 'RÉGLAGES',
      items: [
        { id: 'formulaire',       label: 'Formulaire accueil', href: '/formulaire',       emoji: '📋', emojiColor: '#0EA5E9', emojiBg: '#E0F2FE' },
        { id: 'personnalisation', label: 'Personnalisation',   href: '/personnalisation', emoji: '🎨', emojiColor: '#7C3AED', emojiBg: '#F5F3FF' },
        { id: 'nouveautes',       label: 'Nouveautés',       href: '/nouveautes-vote',  emoji: '✨', emojiColor: '#D97706', emojiBg: '#FFFBEB', badge: newUpdates },
        { id: 'parametres',       label: 'Paramètres',       href: '/parametres',       emoji: '⚙️', emojiColor: '#64748B', emojiBg: '#F1F5F9' },
      ],
    },
  ]

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-[220px] shrink-0 h-dvh sticky top-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--evolya-card)', borderRight: '1px solid var(--evolya-border)' }}>
        <SidebarContent navGroups={NAV_GROUPS} active={active} profile={profile} initials={initials} logout={logout} />
      </aside>

      {/* Mobile top bar (logo + accès compte/menu via l'avatar) */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 gap-3"
        style={{
          backgroundColor: 'var(--evolya-card)',
          borderBottom: '1px solid var(--evolya-border)',
          height: 'calc(3rem + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <Logo height={28} variant="default" />
        <div className="flex-1" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white overflow-hidden active:scale-95 transition-transform"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {initials}
        </button>
      </div>

      {/* Mobile bottom nav (navigation principale au pouce) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          backgroundColor: 'var(--evolya-card)',
          borderTop: '1px solid var(--evolya-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(3.75rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-stretch h-[60px]">
          {BOTTOM_TABS.map(tab => {
            const isActive = active(tab.href)
            const badge = tab.id === 'messagerie' ? unread : 0
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative transition-colors"
                style={{ color: isActive ? 'var(--brand)' : '#94A3B8' }}
              >
                <span className="relative">
                  <BottomIcon name={tab.icon} size={22} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#EF4444] text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Plus de menus"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors"
            style={{ color: (mobileOpen || !BOTTOM_TABS.some(t => active(t.href))) ? 'var(--brand)' : '#94A3B8' }}
          >
            <BottomIcon name="more" size={22} />
            <span className="text-[10px] leading-none font-medium">Plus</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer (slide-in) */}
      <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 h-full w-[300px] max-w-[86vw] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: 'var(--evolya-card)' }}
        >
          {/* Profile pill */}
          <div className="p-3 shrink-0">
            <div className="rounded-2xl bg-[#0D1F3C] px-3 py-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[15px] shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[15px] truncate leading-tight">{profile.full_name ?? 'Coach'}</p>
                <p className="text-[#94A3B8] text-[11px] truncate capitalize mt-0.5">{profile.coaching_type ?? 'Coach'}</p>
              </div>
              <button onClick={() => setAccountOpen(v => !v)} className="text-white/60 hover:text-white p-1 transition-colors" aria-label="Menu compte">
                <ChevronDown size={18} className={`transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {accountOpen && (
              <div className="mt-2 rounded-xl border border-[#E2E8F0] overflow-hidden">
                <Link href="/parametres" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[--evolya-text] hover:bg-[#F8FAFB] transition-colors">
                  <Settings size={15} className="text-[#94A3B8]" /> Paramètres
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-[#F1F5F9]">
                  <LogOut size={15} /> Se déconnecter
                </button>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            {NAV_GROUPS.map((group, gi) => {
              const isCollapsed = !!collapsed[gi]
              return (
                <div key={gi} className="mb-0.5">
                  {group.label ? (
                    <button onClick={() => toggleGroup(gi)} className="w-full flex items-center justify-between px-2.5 pt-3.5 pb-1.5">
                      <span className="text-[11px] font-bold text-[--evolya-subtle] uppercase tracking-widest">{group.label}</span>
                      <ChevronUp size={14} className={`text-[#CBD5E1] transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                  ) : <div className="pt-1.5" />}
                  {!isCollapsed && group.items.map(item => {
                    const isActive = active(item.href)
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${isActive ? '' : 'text-[--evolya-text] hover:bg-[#F8FAFB]'}`}
                        style={isActive ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand)' } : {}}
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] shrink-0"
                          style={{ backgroundColor: isActive ? 'transparent' : '#F1F5F9' }}
                        >
                          {item.emoji}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {(item.badge ?? 0) > 0 && (
                          <span className="text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 text-white bg-[#EF4444]">
                            {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Trial badge */}
          {profile.plan_status === 'trial' && profile.trial_ends_at && (() => {
            const days = Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
            return days > 0 ? (
              <div className="mx-3 mb-3 px-3 py-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl shrink-0">
                <p className="text-[10px] text-[#92400E] font-semibold uppercase tracking-wide">Essai gratuit</p>
                <p className="text-[12px] font-bold text-[#C2410C] mt-0.5">{days} jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}</p>
              </div>
            ) : null
          })()}
        </aside>
      </div>
    </>
  )
}
