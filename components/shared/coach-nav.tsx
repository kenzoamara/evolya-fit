'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPlanLabel, getDaysUntil } from '@/lib/utils'
import { Logo } from '@/components/shared/logo'
import type { Profile } from '@/types/database'

type Props = { profile: Profile }

/* ── Icon system ── */

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (name) {
    case 'home':
      return <svg {...s}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/><path d="M9 21V14h6v7"/></svg>
    case 'users':
      return <svg {...s}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M22 21c0-3 -2.5-5.5-5.5-6"/></svg>
    case 'calendar':
      return <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/></svg>
    case 'message':
      return <svg {...s}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    case 'settings':
      return <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    case 'sparkle':
      return <svg {...s}><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>
    case 'logout':
      return <svg {...s}><path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M16 17l5-5-5-5M21 12H9"/></svg>
    case 'search':
      return <svg {...s}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
    default:
      return null
  }
}

/* ── Nav config ── */

type NavTab = {
  id: string
  href: string
  label: string
  icon: string
}

const mainTabs: NavTab[] = [
  { id: 'dashboard', href: '/dashboard', label: 'Accueil', icon: 'home' },
  { id: 'clients', href: '/clients', label: 'Clients', icon: 'users' },
  { id: 'agenda', href: '/agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'messages', href: '/messages', label: 'Messages', icon: 'message' },
  { id: 'settings', href: '/settings', label: 'Parametres', icon: 'settings' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

/* ── Desktop Sidebar ── */

function DesktopSidebar({ profile, pathname, unreadMessages, newRoadmap, onLogout }: {
  profile: Profile
  pathname: string
  unreadMessages: number
  newRoadmap: number
  onLogout: () => void
}) {
  const isTrial = profile.plan === 'trial'
  const daysLeft = profile.trial_ends_at ? getDaysUntil(profile.trial_ends_at) : 0

  return (
    <aside className="hidden md:flex w-[220px] min-h-screen bg-[#0B1829] flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Logo height={28} variant="light" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {mainTabs.slice(0, 4).map(tab => {
          const active = isActive(pathname, tab.href)
          const badge = tab.id === 'messages' ? unreadMessages : 0
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group ${
                active
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-[#7B8BA5] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className={`flex-shrink-0 transition-colors ${active ? 'text-[#4E9B6F]' : 'text-[#556680] group-hover:text-[#7B8BA5]'}`}>
                <Icon name={tab.icon} size={18} />
              </span>
              <span className="flex-1">{tab.label}</span>
              {badge > 0 && (
                <span className="bg-[#4E9B6F] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Separator */}
        <div className="h-px bg-white/[0.06] my-3 mx-2" />

        {/* Secondary */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group ${
            isActive(pathname, '/settings')
              ? 'bg-white/[0.08] text-white font-medium'
              : 'text-[#7B8BA5] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className={`flex-shrink-0 transition-colors ${isActive(pathname, '/settings') ? 'text-[#4E9B6F]' : 'text-[#556680] group-hover:text-[#7B8BA5]'}`}>
            <Icon name="settings" size={18} />
          </span>
          <span className="flex-1">Parametres</span>
        </Link>

        <Link
          href="/nouveautes-vote"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group ${
            isActive(pathname, '/nouveautes-vote')
              ? 'bg-white/[0.08] text-white font-medium'
              : 'text-[#7B8BA5] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className={`flex-shrink-0 transition-colors ${isActive(pathname, '/nouveautes-vote') ? 'text-[#4E9B6F]' : 'text-[#556680] group-hover:text-[#7B8BA5]'}`}>
            <Icon name="sparkle" size={18} />
          </span>
          <span className="flex-1">Nouveautes</span>
          {newRoadmap > 0 && (
            <span className="bg-[#4E9B6F]/20 text-[#4E9B6F] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {newRoadmap}
            </span>
          )}
        </Link>
      </nav>

      {/* Trial */}
      {isTrial && daysLeft > 0 && (
        <div className="mx-3 mb-3">
          <div className="bg-[#4E9B6F]/10 border border-[#4E9B6F]/15 rounded-xl px-3.5 py-3">
            <p className="text-[10px] text-[#7B8BA5] uppercase tracking-wider font-medium">Essai gratuit</p>
            <p className="text-[12px] font-semibold text-[#4E9B6F] mt-0.5">{daysLeft} jours restants</p>
          </div>
        </div>
      )}

      {/* Profile footer */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4E9B6F]/15 flex items-center justify-center text-[11px] font-bold text-[#4E9B6F] flex-shrink-0">
            {(profile.full_name ?? 'C').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate">{profile.full_name ?? 'Coach'}</p>
            <p className="text-[10px] text-[#556680]">{getPlanLabel(profile.plan)}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-[#556680] hover:text-[#94A3B8] transition-colors p-1.5 rounded-lg hover:bg-white/[0.04] border-none bg-transparent cursor-pointer"
            title="Se deconnecter"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ── Mobile Bottom Nav ── */

function MobileBottomNav({ pathname, unreadMessages }: {
  pathname: string
  unreadMessages: number
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] safe-bottom">
      <div className="flex items-stretch">
        {mainTabs.map(tab => {
          const active = isActive(pathname, tab.href)
          const badge = tab.id === 'messages' ? unreadMessages : 0
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors relative ${
                active ? 'text-[#4E9B6F]' : 'text-[#94A3B8]'
              }`}
            >
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-[#4E9B6F] rounded-b-full" />}
              <div className="relative">
                <Icon name={tab.icon} size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-[#EF4444] text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {badge > 9 ? '!' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/* ── Mobile Top Bar ── */

function MobileTopBar({ profile }: { profile: Profile }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] h-12 flex items-center px-4">
      <Logo height={24} variant="default" />
      <div className="flex-1" />
      <div className="w-7 h-7 rounded-lg bg-[#EEF9F3] flex items-center justify-center text-[10px] font-bold text-[#4E9B6F]">
        {(profile.full_name ?? 'C').charAt(0).toUpperCase()}
      </div>
    </div>
  )
}

/* ── Main Export ── */

export function CoachNav({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [newRoadmapCount, setNewRoadmapCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const fetchBadges = async () => {
      let query = supabase
        .from('roadmap_items')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'released')
        .eq('is_published', true)
      if (profile.last_visited_roadmap) {
        query = query.gt('created_at', profile.last_visited_roadmap)
      }
      const { count } = await query
      setNewRoadmapCount(count ?? 0)

      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', profile.id)
        .eq('sender_role', 'client')
        .eq('read_by_coach', false)
      setUnreadMessages(msgCount ?? 0)
    }
    fetchBadges()

    const channel = supabase
      .channel('coach-nav-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `coach_id=eq.${profile.id}`,
      }, () => {
        fetchBadges()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id, profile.last_visited_roadmap])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <DesktopSidebar
        profile={profile}
        pathname={pathname}
        unreadMessages={unreadMessages}
        newRoadmap={newRoadmapCount}
        onLogout={handleLogout}
      />
      <MobileTopBar profile={profile} />
      <MobileBottomNav pathname={pathname} unreadMessages={unreadMessages} />

      {/* Mobile spacers */}
      <div className="md:hidden h-12 flex-shrink-0" />
    </>
  )
}
