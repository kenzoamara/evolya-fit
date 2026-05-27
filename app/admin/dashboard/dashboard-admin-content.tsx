'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

type Props = {
  totalCoaches: number
  activeCoaches: number
  mrr: number
  newCoaches: number
  openTickets: number
  recentCoaches: { created_at: string; plan: string }[]
  recentActivity: { id: string; full_name: string | null; plan: string; created_at: string }[]
  recentTickets: { id: string; subject: string; created_at: string; profiles: { full_name: string | null } | null }[]
}

const MRR_MAP: Record<string, number> = { trial: 0, starter: 19, standard: 49 }

function buildDailyData(coaches: { created_at: string; plan: string }[]) {
  const days: Record<string, { date: string; inscriptions: number; mrr: number }> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    days[key] = { date: label, inscriptions: 0, mrr: 0 }
  }
  coaches.forEach(c => {
    const key = c.created_at.split('T')[0]
    if (days[key]) {
      days[key].inscriptions++
      days[key].mrr += MRR_MAP[c.plan] ?? 0
    }
  })
  return Object.values(days)
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function planLabel(plan: string) {
  return plan === 'standard' ? 'Pro' : plan === 'starter' ? 'Starter' : 'Trial'
}

export function DashboardAdminContent({
  totalCoaches, activeCoaches, mrr, newCoaches, openTickets,
  recentCoaches, recentActivity, recentTickets,
}: Props) {
  const [liveCoaches, setLiveCoaches] = useState(activeCoaches)
  const [liveMrr, setLiveMrr] = useState(mrr)
  const [liveTickets, setLiveTickets] = useState(openTickets)
  const [feed, setFeed] = useState<{ id: string; text: string; time: string; color: string; rawTime: number }[]>([])
  const chartData = buildDailyData(recentCoaches)

  // Construire le feed initial
  useEffect(() => {
    const items: typeof feed = []
    recentActivity.forEach(c => {
      items.push({
        id: `coach-${c.id}`,
        text: `🟢 ${c.full_name ?? 'Coach'} vient de s'inscrire — Plan ${planLabel(c.plan)}`,
        time: formatTimeAgo(c.created_at),
        color: '#4E9B6F',
        rawTime: new Date(c.created_at).getTime(),
      })
    })
    recentTickets.forEach(t => {
      items.push({
        id: `ticket-${t.id}`,
        text: `💬 Nouveau ticket — ${t.profiles?.full_name ?? 'Coach'} : "${t.subject}"`,
        time: formatTimeAgo(t.created_at),
        color: '#D4A853',
        rawTime: new Date(t.created_at).getTime(),
      })
    })
    items.sort((a, b) => b.rawTime - a.rawTime)
    setFeed(items.slice(0, 15))
  }, [recentActivity, recentTickets])

  // Refetch KPIs depuis la DB (source de vérité)
  const refetchKpis = async () => {
    const supabase = createClient()
    const { data: coaches } = await supabase
      .from('profiles')
      .select('plan, plan_status, suspended')
      .eq('role', 'coach')
    const active = (coaches ?? []).filter(c => !c.suspended && c.plan_status === 'active')
    setLiveCoaches(active.length)
    setLiveMrr(active.reduce((acc, c) => acc + (MRR_MAP[c.plan] ?? 0), 0))
    const { count } = await supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
    setLiveTickets(count ?? 0)
  }

  // Realtime : toutes les sources de changement
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-dashboard-rt')
      // Nouvelle inscription coach
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new as { full_name?: string; plan?: string; role?: string }
        if (p.role === 'coach') {
          setFeed(prev => [{
            id: `live-${Date.now()}`,
            text: `🟢 ${p.full_name ?? 'Coach'} vient de s\'inscrire — Plan ${planLabel(p.plan ?? 'trial')}`,
            time: 'à l\'instant',
            color: '#4E9B6F',
            rawTime: Date.now(),
          }, ...prev.slice(0, 14)])
          refetchKpis()
        }
      })
      // Changement plan / suspension → recalcul propre
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const n = payload.new as { plan?: string; plan_status?: string; suspended?: boolean; full_name?: string }
        const o = payload.old as { plan?: string; plan_status?: string; suspended?: boolean }
        if (n.plan !== o.plan || n.plan_status !== o.plan_status || n.suspended !== o.suspended) {
          if (n.suspended && !o.suspended) {
            setFeed(prev => [{
              id: `live-suspend-${Date.now()}`,
              text: `🔴 ${n.full_name ?? 'Coach'} suspendu`,
              time: 'à l\'instant',
              color: '#DC2626',
              rawTime: Date.now(),
            }, ...prev.slice(0, 14)])
          }
          if (n.plan_status === 'cancelled' && o.plan_status !== 'cancelled') {
            setFeed(prev => [{
              id: `live-churn-${Date.now()}`,
              text: `🔴 ${n.full_name ?? 'Coach'} vient d\'annuler son abonnement`,
              time: 'à l\'instant',
              color: '#DC2626',
              rawTime: Date.now(),
            }, ...prev.slice(0, 14)])
          }
          refetchKpis()
        }
      })
      // Paiement Stripe réussi
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stripe_events' }, (payload) => {
        const e = payload.new as { type?: string; amount?: number }
        if (e.type === 'invoice.payment_succeeded' && e.amount) {
          setFeed(prev => [{
            id: `live-pay-${Date.now()}`,
            text: `💳 Paiement reçu — +${Math.round(e.amount! / 100)}€`,
            time: 'à l\'instant',
            color: '#4E9B6F',
            rawTime: Date.now(),
          }, ...prev.slice(0, 14)])
          refetchKpis()
        }
      })
      // Nouveau ticket support
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, (payload) => {
        const t = payload.new as { subject?: string }
        setFeed(prev => [{
          id: `live-ticket-${Date.now()}`,
          text: `💬 Nouveau ticket support : "${t.subject}"`,
          time: 'à l\'instant',
          color: '#D4A853',
          rawTime: Date.now(),
        }, ...prev.slice(0, 14)])
        setLiveTickets(n => n + 1)
      })
      // Ticket fermé
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' }, (payload) => {
        const n = payload.new as { status?: string }
        const o = payload.old as { status?: string }
        if (o.status !== 'closed' && n.status === 'closed') {
          setLiveTickets(prev => Math.max(0, prev - 1))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = [
    { label: 'Coaches actifs', value: liveCoaches, sub: `${totalCoaches} total`, color: '#4E9B6F' },
    { label: 'MRR du jour', value: `${liveMrr}€`, sub: `ARR ≈ ${liveMrr * 12}€`, color: '#4E9B6F' },
    { label: 'Nouveaux (7j)', value: newCoaches, sub: 'inscriptions récentes', color: '#D4A853' },
    { label: 'Tickets ouverts', value: liveTickets, sub: 'en attente', color: liveTickets > 0 ? '#DC2626' : '#4E9B6F' },
  ]

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0D1F3C]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Vue temps réel — Supabase Realtime</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <p className="text-xs text-[#64748B] mb-1">{kpi.label}</p>
            <p className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graphiques */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inscriptions */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#0D1F3C] mb-4">Inscriptions — 30 derniers jours</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="inscriptions" fill="#4E9B6F" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* MRR cumulé */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#0D1F3C] mb-4">MRR cumulé — 30 derniers jours</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData.map((d, i) => ({
                ...d,
                mrrCumul: chartData.slice(0, i + 1).reduce((acc, x) => acc + x.mrr, 0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => [`${v ?? 0}€`, 'MRR cumulé']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
                <Line type="monotone" dataKey="mrrCumul" stroke="#4E9B6F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feed activité */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-[#0D1F3C] mb-4">Activité en direct</h2>
          <div className="flex-1 space-y-3 overflow-auto max-h-[420px]">
            {feed.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">En attente d&apos;activité...</p>
            ) : (
              feed.map(item => (
                <div key={item.id} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#0D1F3C] leading-relaxed">{item.text}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
