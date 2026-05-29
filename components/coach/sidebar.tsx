'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/logo'
import type { Profile } from '@/types/database'
import { LogOut, X, Menu } from 'lucide-react'

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
      {profile.plan === 'trial' && profile.trial_ends_at && (() => {
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
            {profile.brand_icon?.startsWith('http')
              ? <img src={profile.brand_icon} alt="" className="w-full h-full object-cover" />
              : (profile.brand_icon || initials)
            }
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
        { id: 'personnalisation', label: 'Personnalisation', href: '/personnalisation', emoji: '🎨', emojiColor: '#7C3AED', emojiBg: '#F5F3FF' },
        { id: 'nouveautes',       label: 'Nouveautés',       href: '/nouveautes-vote',  emoji: '✨', emojiColor: '#D97706', emojiBg: '#FFFBEB', badge: newUpdates },
        { id: 'parametres',       label: 'Paramètres',       href: '/parametres',       emoji: '⚙️', emojiColor: '#64748B', emojiBg: '#F1F5F9' },
      ],
    },
  ]

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-[220px] shrink-0 h-screen sticky top-0 flex-col overflow-hidden" style={{ backgroundColor: 'var(--evolya-card)', borderRight: '1px solid var(--evolya-border)' }}>
        <SidebarContent navGroups={NAV_GROUPS} active={active} profile={profile} initials={initials} logout={logout} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 gap-3" style={{ backgroundColor: 'var(--evolya-card)', borderBottom: '1px solid var(--evolya-border)' }}>
        <button onClick={() => setMobileOpen(true)} className="text-[#64748B] p-1">
          <Menu size={20} />
        </button>
        <Logo height={28} variant="default" />
        <div className="flex-1" />
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {profile.brand_icon || initials}
        </div>
      </div>

      {/* Mobile spacer */}
      <div className="md:hidden h-12 shrink-0" />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full shadow-2xl flex flex-col" style={{ backgroundColor: 'var(--evolya-card)' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B] p-1"
            >
              <X size={18} />
            </button>
            <SidebarContent navGroups={NAV_GROUPS} active={active} profile={profile} initials={initials} logout={logout} />
          </aside>
        </div>
      )}
    </>
  )
}
