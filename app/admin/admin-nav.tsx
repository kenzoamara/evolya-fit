'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/logo'

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000 // 2h

type Props = {
  adminName: string
  openTickets: number
  unreadContact?: number
}

/* ── Icônes SVG (jamais d'emoji) ── */
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'dashboard': return <svg {...s}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"/><path d="M9 21V14h6v7"/></svg>
    case 'coaches':   return <svg {...s}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M22 21c0-3-2.5-5.5-5.5-6"/></svg>
    case 'revenus':   return <svg {...s}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/></svg>
    case 'roadmap':   return <svg {...s}><path d="M3 10v4h3l5 4V6L6 10H3z"/><path d="M16 8.5a4 4 0 010 7"/></svg>
    case 'emails':    return <svg {...s}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
    case 'contact':   return <svg {...s}><path d="M5 5h14l3 7v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6z"/><path d="M2 12h6l2 3h4l2-3h6"/></svg>
    case 'support':   return <svg {...s}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5 5l4.5 4.5M14.5 14.5L19 19M19 5l-4.5 4.5M9.5 14.5L5 19"/></svg>
    case 'logs':      return <svg {...s}><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>
    case 'audit':     return <svg {...s}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    case 'menu':      return <svg {...s}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    case 'close':     return <svg {...s}><path d="M6 6l12 12M18 6L6 18"/></svg>
    case 'logout':    return <svg {...s}><path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M16 17l5-5-5-5M21 12H9"/></svg>
    default:          return null
  }
}

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard',          icon: 'dashboard', badge: false, badgeContact: false },
  { href: '/admin/coaches',   label: 'Coaches',            icon: 'coaches',   badge: false, badgeContact: false },
  { href: '/admin/revenus',   label: 'Revenus & MRR',      icon: 'revenus',   badge: false, badgeContact: false },
  { href: '/admin/roadmap',   label: 'Roadmap & Annonces', icon: 'roadmap',   badge: false, badgeContact: false },
  { href: '/admin/emails',    label: 'Emails & Notifs',    icon: 'emails',    badge: false, badgeContact: false },
  { href: '/admin/contact',   label: 'Messages',           icon: 'contact',   badge: false, badgeContact: true },
  { href: '/admin/support',   label: 'Support',            icon: 'support',   badge: true,  badgeContact: false },
  { href: '/admin/logs',      label: 'Logs',               icon: 'logs',      badge: false, badgeContact: false },
  { href: '/admin/audit',     label: 'Audit',              icon: 'audit',     badge: false, badgeContact: false },
]

export function AdminNav({ adminName, openTickets, unreadContact = 0 }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tickets, setTickets] = useState(openTickets)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  // Fermer le drawer à chaque changement de page
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Session timeout 2h inactivité
  const resetTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(logout, IDLE_TIMEOUT)
  }, [logout])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [resetTimer])

  // Realtime : badge tickets
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-tickets-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')
          .then(({ count }) => setTickets(count ?? 0))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const NavList = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navItems.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="shrink-0"><Icon name={item.icon} size={18} /></span>
            <span className="flex-1">{item.label}</span>
            {item.badge && tickets > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {tickets > 9 ? '9+' : tickets}
              </span>
            )}
            {item.badgeContact && unreadContact > 0 && (
              <span className="bg-[#4E9B6F] text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadContact > 9 ? '9+' : unreadContact}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const UserFooter = () => (
    <div className="px-4 py-4 border-t border-white/10 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#4E9B6F]/30 flex items-center justify-center text-xs font-medium text-[#4E9B6F] flex-shrink-0">
          {adminName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{adminName}</p>
          <p className="text-xs text-white/40">Administrateur</p>
        </div>
        <button onClick={logout} className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/5" title="Se déconnecter">
          <Icon name="logout" size={16} />
        </button>
      </div>
      <p className="text-[10px] text-white/20 mt-2">Déconnexion auto après 2h d&apos;inactivité</p>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-dvh bg-[#0D1F3C] flex-col flex-shrink-0 sticky top-0 h-dvh">
        <div className="px-5 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo height={30} variant="light" />
            <span className="text-[10px] bg-[#4E9B6F] text-white px-1.5 py-0.5 rounded font-medium">Admin</span>
          </div>
        </div>
        <NavList />
        <UserFooter />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0D1F3C] flex items-center px-4 gap-3 border-b border-white/10"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button onClick={() => setDrawerOpen(true)} aria-label="Ouvrir le menu" className="text-white/80 p-1 -ml-1">
          <Icon name="menu" size={22} />
        </button>
        <Logo height={26} variant="light" />
        <span className="text-[10px] bg-[#4E9B6F] text-white px-1.5 py-0.5 rounded font-medium">Admin</span>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[280px] max-w-[84vw] bg-[#0D1F3C] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="px-5 flex items-center justify-between border-b border-white/10 shrink-0" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))', paddingBottom: '1.25rem' }}>
            <div className="flex items-center gap-2.5">
              <Logo height={28} variant="light" />
              <span className="text-[10px] bg-[#4E9B6F] text-white px-1.5 py-0.5 rounded font-medium">Admin</span>
            </div>
            <button onClick={() => setDrawerOpen(false)} aria-label="Fermer le menu" className="text-white/60 hover:text-white p-1">
              <Icon name="close" size={20} />
            </button>
          </div>
          <NavList />
          <UserFooter />
        </aside>
      </div>
    </>
  )
}
