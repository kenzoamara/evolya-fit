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

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠', badge: false, badgeContact: false },
  { href: '/admin/coaches', label: 'Coaches', icon: '👤', badge: false, badgeContact: false },
  { href: '/admin/revenus', label: 'Revenus & MRR', icon: '💰', badge: false, badgeContact: false },
  { href: '/admin/roadmap', label: 'Roadmap & Annonces', icon: '📣', badge: false, badgeContact: false },
  { href: '/admin/emails', label: 'Emails & Notifs', icon: '📧', badge: false, badgeContact: false },
  { href: '/admin/contact', label: 'Messages', icon: '✉️', badge: false, badgeContact: true },
  { href: '/admin/support', label: 'Support', icon: '🎫', badge: true, badgeContact: false },
  { href: '/admin/logs', label: 'Logs', icon: '📋', badge: false, badgeContact: false },
  { href: '/admin/audit', label: 'Audit', icon: '🔍', badge: false, badgeContact: false },
]

export function AdminNav({ adminName, openTickets, unreadContact = 0 }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tickets, setTickets] = useState(openTickets)

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

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

  return (
    <aside className="w-56 min-h-screen bg-[#0D1F3C] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Logo height={30} variant="light" />
          <span className="text-[10px] bg-[#4E9B6F] text-white px-1.5 py-0.5 rounded font-medium">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
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

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#4E9B6F]/30 flex items-center justify-center text-xs font-medium text-[#4E9B6F] flex-shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-white/40">Administrateur</p>
          </div>
          <button
            onClick={logout}
            className="text-white/30 hover:text-white/60 transition-colors text-xs flex-shrink-0"
            title="Se déconnecter"
          >
            ⏻
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-2">Déconnexion auto après 2h d&apos;inactivité</p>
      </div>
    </aside>
  )
}
