'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Users, CreditCard, Gift, Plus, Check, Clock, AlertTriangle, X, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/coach/page-header'
import { InnerTabs } from '@/components/coach/inner-tabs'
import { AnimatedBarCard } from '@/components/coach/animated-bar-card'
import { getPlanLabel } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { toast } from 'sonner'
import { PlanGate } from '@/components/ui/plan-gate'

type ClientRow = { id: string; full_name: string; status: string; created_at: string }

type Payment = {
  id: string
  client_id: string
  amount: number
  currency: string
  due_date: string
  paid_date: string | null
  claimed_at: string | null
  notes: string | null
  created_at: string
  clients: { full_name: string } | { full_name: string }[] | null
}

type Props = { profile: Profile; clients: ClientRow[] }
type TabId = 'overview' | 'paiements' | 'croissance'
type PaymentFilter = 'all' | 'pending' | 'claimed' | 'late' | 'paid'

const TABS = [
  { id: 'overview',   label: "Vue d'ensemble" },
  { id: 'paiements',  label: 'Paiements' },
  { id: 'croissance', label: 'Croissance' },
]

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
const MONTHS_FR_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function paymentStatus(p: Payment): 'paid' | 'claimed' | 'late' | 'pending' {
  if (p.paid_date) return 'paid'
  if (p.claimed_at) return 'claimed'
  if (p.due_date < getTodayStr()) return 'late'
  return 'pending'
}

function clientName(p: Payment): string {
  if (!p.clients) return 'Membre inconnu'
  if (Array.isArray(p.clients)) return p.clients[0]?.full_name ?? 'Membre inconnu'
  return p.clients.full_name
}

function fmtAmount(amount: number): string {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string
}) {
  const color = accent ?? '#4E9B6F'
  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-[26px] font-bold text-[#0D1F3C] leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#CBD5E1] mt-1">{sub}</p>}
    </div>
  )
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({ clients, onClose, onAdded }: {
  clients: ClientRow[]
  onClose: () => void
  onAdded: (p: Payment) => void
}) {
  const today = getTodayStr()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!clientId || !amount || !dueDate) { toast.error('Remplis tous les champs'); return }
    setSaving(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, amount: parseFloat(amount), due_date: dueDate, notes: notes || null }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la création'); return }
    const { payment } = await res.json()
    toast.success('Paiement ajouté')
    onAdded(payment)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[15px] font-bold text-[#0D1F3C]">Nouveau paiement</p>
          <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B]"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Membre</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] focus:outline-none focus:border-[#4E9B6F]">
              {clients.filter(c => c.status === 'active').map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Montant (€)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="ex : 150"
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#4E9B6F]" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Date d&apos;échéance</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] focus:outline-none focus:border-[#4E9B6F]" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Notes <span className="font-normal text-[#94A3B8]">(optionnel)</span></label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="ex : Mensualité mai"
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#4E9B6F]" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3d8058] transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Payment Modal ───────────────────────────────────────────────────────

function EditPaymentModal({ payment, onClose, onUpdated, onDeleted }: {
  payment: Payment
  onClose: () => void
  onUpdated: (p: Payment) => void
  onDeleted: (id: string) => void
}) {
  const status = paymentStatus(payment)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [relancing, setRelancing] = useState(false)
  const [relanced, setRelanced] = useState(false)

  async function markPaid() {
    setSaving(true)
    const today = getTodayStr()
    const res = await fetch(`/api/payments/${payment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_date: today }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erreur'); return }
    const { payment: updated } = await res.json()
    toast.success('Marqué comme payé')
    onUpdated(updated)
    onClose()
  }

  async function markUnpaid() {
    setSaving(true)
    const res = await fetch(`/api/payments/${payment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_date: null, claimed_at: null }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erreur'); return }
    const { payment: updated } = await res.json()
    toast.success('Marqué comme impayé')
    onUpdated(updated)
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce paiement ?')) return
    setDeleting(true)
    const res = await fetch(`/api/payments/${payment.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { toast.error('Erreur'); return }
    toast.success('Paiement supprimé')
    onDeleted(payment.id)
    onClose()
  }

  async function sendRelance() {
    setRelancing(true)
    const name = clientName(payment)
    const firstName = name.split(' ')[0]
    const content = `Bonjour ${firstName}, je me permets de te rappeler qu'un paiement de ${fmtAmount(payment.amount)} était attendu le ${fmtDate(payment.due_date)}. Si tu as la moindre question ou besoin d'un arrangement, n'hésite pas à m'en parler. Merci !`
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: payment.client_id, content }),
    })
    setRelancing(false)
    if (!res.ok) { toast.error('Erreur envoi'); return }
    setRelanced(true)
    toast.success(`Relance envoyée à ${firstName}`)
  }

  const statusConfig = {
    paid:    { label: 'Payé',       color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    claimed: { label: 'Déclaré',    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    late:    { label: 'En retard',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    pending: { label: 'En attente', color: '#94A3B8', bg: '#F8FAFB', border: '#E2E8F0' },
  }
  const sc = statusConfig[status]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[15px] font-bold text-[#0D1F3C]">{clientName(payment)}</p>
            <p className="text-[12px] text-[#94A3B8]">Échéance : {fmtDate(payment.due_date)}</p>
          </div>
          <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B]"><X size={16} /></button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border mb-4" style={{ background: sc.bg, borderColor: sc.border }}>
          <span className="text-[22px] font-bold" style={{ color: sc.color }}>{fmtAmount(payment.amount)}</span>
          <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ color: sc.color, background: 'white' }}>{sc.label}</span>
        </div>

        {/* Claimed alert — client declared they paid */}
        {status === 'claimed' && (
          <div className="flex items-start gap-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 mb-4">
            <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              <span className="font-bold">{clientName(payment)}</span> a déclaré avoir effectué ce paiement.
              Confirme une fois le virement reçu.
            </p>
          </div>
        )}

        {payment.notes && (
          <p className="text-[12px] text-[#64748B] bg-[#F8FAFB] rounded-xl px-3 py-2 mb-4">{payment.notes}</p>
        )}

        <div className="flex gap-2">
          <button onClick={handleDelete} disabled={deleting}
            className="px-3 py-2.5 border border-[#FCA5A5] text-[#EF4444] rounded-xl text-[12px] font-medium hover:bg-[#FEF2F2] transition-colors disabled:opacity-50">
            {deleting ? '…' : 'Supprimer'}
          </button>
          {status !== 'paid' && (
            <button onClick={sendRelance} disabled={relancing || relanced}
              className="px-3 py-2.5 border border-[#E2E8F0] text-[#64748B] rounded-xl text-[12px] font-medium hover:bg-[#F8FAFB] transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {relancing ? (
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : relanced ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5l2.5 2.5L10 3" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {relanced ? 'Envoyé' : 'Relancer'}
            </button>
          )}
          {status === 'paid' ? (
            <button onClick={markUnpaid} disabled={saving}
              className="flex-1 px-4 py-2.5 border border-[#E2E8F0] text-[#64748B] rounded-xl text-[13px] font-semibold hover:bg-[#F8FAFB] transition-colors disabled:opacity-50">
              {saving ? '…' : 'Marquer impayé'}
            </button>
          ) : (
            <button onClick={markPaid} disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3d8058] transition-colors disabled:opacity-50"
              style={status === 'claimed' ? { background: '#16A34A' } : {}}>
              {saving ? '…' : status === 'claimed' ? '✓ Confirmer le paiement' : '✓ Marquer payé'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const BAR_H = 88 // px — fixed height for the bar zone

  return (
    <div className="flex gap-1.5 items-end">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {/* Value label — fixed height so all bars align */}
            <span
              className="text-[10px] font-bold leading-none"
              style={{ color: d.value > 0 ? color : 'transparent', minHeight: 14 }}
            >
              {d.value > 0 ? d.value.toLocaleString('fr-FR') : '0'}
            </span>

            {/* Bar zone — explicit height so % is meaningful */}
            <div className="relative w-full" style={{ height: BAR_H }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500"
                style={{
                  height: d.value > 0 ? `${Math.max(pct, 3)}%` : '3px',
                  background: d.value > 0 ? color : '#E2E8F0',
                  opacity: d.value > 0 ? 1 : 0.4,
                }}
              />
            </div>

            <span className="text-[9px] text-[#94A3B8] mt-0.5">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessContent({ profile, clients }: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [filter, setFilter] = useState<PaymentFilter>('all')

  const activeClients = clients.filter(c => c.status === 'active')
  const inactiveClients = clients.filter(c => c.status !== 'active')
  const now = new Date()
  const todayStr = getTodayStr()

  // Fetch payments on mount (needed for overview impayés panel too)
  useEffect(() => {
    setLoadingPayments(true)
    fetch('/api/payments')
      .then(r => r.json())
      .then(d => { setPayments(d.payments ?? []); setLoadingPayments(false) })
      .catch(() => setLoadingPayments(false))
  }, [])

  // ── Payment KPIs ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthStr = `${nextMonthStart.getFullYear()}-${String(nextMonthStart.getMonth() + 1).padStart(2, '0')}-01`

    const encaisseThisMonth = payments
      .filter(p => p.paid_date && p.paid_date >= thisMonthStart && p.paid_date < nextMonthStr)
      .reduce((s, p) => s + p.amount, 0)

    const pending = payments.filter(p => paymentStatus(p) === 'pending').reduce((s, p) => s + p.amount, 0)
    const late = payments.filter(p => paymentStatus(p) === 'late')
    const lateAmount = late.reduce((s, p) => s + p.amount, 0)

    return { encaisseThisMonth, pending, lateCount: late.length, lateAmount }
  }, [payments, now])

  // ── Revenue per month (last 6) ───────────────────────────────────────────────
  const revenueByMonth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`
      const total = payments
        .filter(p => p.paid_date && p.paid_date >= start && p.paid_date < end)
        .reduce((s, p) => s + p.amount, 0)
      return { label: MONTHS_FR[d.getMonth()], value: total }
    })
  }, [payments, now])

  // ── Clients per month (last 6) ───────────────────────────────────────────────
  const monthlyGrowth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const count = clients.filter(c => {
        const created = new Date(c.created_at)
        return created >= d && created < next
      }).length
      return { label: MONTHS_FR[d.getMonth()], value: count }
    })
  }, [clients, now])

  // ── Growth % vs last month ───────────────────────────────────────────────────
  const growthPct = useMemo(() => {
    const thisM = monthlyGrowth[5].value
    const lastM = monthlyGrowth[4].value
    if (lastM === 0) return thisM > 0 ? '+100%' : '—'
    const pct = Math.round(((thisM - lastM) / lastM) * 100)
    return pct > 0 ? `+${pct}%` : `${pct}%`
  }, [monthlyGrowth])

  const revGrowthPct = useMemo(() => {
    const thisM = revenueByMonth[5].value
    const lastM = revenueByMonth[4].value
    if (lastM === 0) return thisM > 0 ? '+100%' : '—'
    const pct = Math.round(((thisM - lastM) / lastM) * 100)
    return pct > 0 ? `+${pct}%` : `${pct}%`
  }, [revenueByMonth])

  // ── Filtered payments ────────────────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    if (filter === 'all') return payments
    return payments.filter(p => paymentStatus(p) === filter)
  }, [payments, filter])

  const filterCounts = useMemo(() => ({
    all: payments.length,
    pending: payments.filter(p => paymentStatus(p) === 'pending').length,
    claimed: payments.filter(p => paymentStatus(p) === 'claimed').length,
    late: payments.filter(p => paymentStatus(p) === 'late').length,
    paid: payments.filter(p => paymentStatus(p) === 'paid').length,
  }), [payments])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="📊 Business"
        description={`Plan ${getPlanLabel(profile.plan)} · ${activeClients.length} membre${activeClients.length > 1 ? 's' : ''} actif${activeClients.length > 1 ? 's' : ''}`}
      />

      <div className="px-6 pt-4 shrink-0">
        <InnerTabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:px-10 space-y-5">

        {/* ── Vue d'ensemble ──────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* Impayés alert */}
            {!loadingPayments && kpis.lateCount > 0 && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} className="text-[#DC2626]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#DC2626] mb-0.5">
                      {kpis.lateCount} paiement{kpis.lateCount > 1 ? 's' : ''} en retard — {fmtAmount(kpis.lateAmount)}
                    </p>
                    <p className="text-[12px] text-[#991B1B] mb-3">
                      {kpis.lateCount > 1 ? 'Ces membres ont des paiements en retard.' : 'Cet membre a un paiement en retard.'} Relance-les depuis l&apos;onglet Paiements.
                    </p>
                    <button
                      onClick={() => { setTab('paiements'); setFilter('late') }}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#DC2626] hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Voir les impayés <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Users} label="Membres actifs" value={String(activeClients.length)} sub={`sur ${profile.client_limit === 9999 ? '∞' : profile.client_limit} max`} accent="#4E9B6F" />
              <StatCard icon={Users} label="Membres inactifs" value={String(inactiveClients.length)} accent="#94A3B8" />
              <StatCard icon={TrendingUp} label="Plan" value={getPlanLabel(profile.plan)} accent="#3B82F6" />
              <StatCard icon={CreditCard} label="Statut" value={
                profile.plan_status === 'active' ? 'Actif' :
                profile.plan_status === 'cancelled' ? 'Annulé' : 'En attente'
              } accent={profile.plan_status === 'active' ? '#4E9B6F' : profile.plan_status === 'cancelled' ? '#EF4444' : '#F59E0B'} />
            </div>

            {clients.length > 0 && (
              <div className="bg-white rounded-xl border border-[#F1F5F9]">
                <div className="px-4 py-3 border-b border-[#F1F5F9]">
                  <span className="text-[13px] font-semibold text-[#0D1F3C]">Tous les membres</span>
                </div>
                <div className="divide-y divide-[#F8FAFB]">
                  {clients.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0D1F3C] truncate">{c.full_name}</p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        c.status === 'active' ? 'bg-brand-bg text-brand' : 'bg-[#F1F5F9] text-[#94A3B8]'
                      }`}>
                        {c.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Paiements ───────────────────────────────────────────────────── */}
        {tab === 'paiements' && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Check size={12} className="text-[#4E9B6F]" />
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium">Encaissé ce mois</span>
                </div>
                <p className="text-[20px] font-bold text-[#0D1F3C] leading-none">{fmtAmount(kpis.encaisseThisMonth)}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-[#D97706]" />
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium">En attente</span>
                </div>
                <p className="text-[20px] font-bold text-[#0D1F3C] leading-none">{fmtAmount(kpis.pending)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${kpis.lateCount > 0 ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-white border-[#F1F5F9]'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={12} className={kpis.lateCount > 0 ? 'text-[#DC2626]' : 'text-[#94A3B8]'} />
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium">En retard</span>
                </div>
                <p className={`text-[20px] font-bold leading-none ${kpis.lateCount > 0 ? 'text-[#DC2626]' : 'text-[#0D1F3C]'}`}>
                  {kpis.lateCount > 0 ? fmtAmount(kpis.lateAmount) : '—'}
                </p>
                {kpis.lateCount > 0 && (
                  <p className="text-[10px] text-[#DC2626] mt-1">{kpis.lateCount} paiement{kpis.lateCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            {/* Header + add button */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 p-1 bg-[#F8FAFB] rounded-xl">
                {([['all', 'Tous'], ['claimed', 'Déclarés'], ['pending', 'Attente'], ['late', 'Retard'], ['paid', 'Payés']] as [PaymentFilter, string][]).map(([f, label]) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                    style={filter === f ? { background: '#fff', color: '#0D1F3C', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#94A3B8' }}>
                    {label} {filterCounts[f] > 0 && <span className="ml-0.5 opacity-60">({filterCounts[f]})</span>}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#4E9B6F] text-white rounded-xl text-[12px] font-semibold hover:bg-[#3d8058] transition-colors">
                <Plus size={13} />
                Ajouter
              </button>
            </div>

            {/* Payment list */}
            {loadingPayments ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-[#4E9B6F]" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 rounded-2xl bg-[#F8FAFB] flex items-center justify-center mb-3">
                  <CreditCard size={18} className="text-[#94A3B8]" />
                </div>
                <p className="text-[13px] font-medium text-[#64748B]">
                  {filter === 'all' ? 'Aucun paiement enregistré' : 'Aucun paiement dans cette catégorie'}
                </p>
                {filter === 'all' && (
                  <button onClick={() => setShowAddModal(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#4E9B6F] text-white rounded-xl text-[12px] font-semibold hover:bg-[#3d8058] transition-colors">
                    <Plus size={13} />
                    Ajouter un paiement
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden">
                <div className="divide-y divide-[#F8FAFB]">
                  {filteredPayments.map(p => {
                    const st = paymentStatus(p)
                    const stConfig = {
                      paid:    { label: 'Payé',       color: '#16A34A', bg: '#F0FDF4' },
                      claimed: { label: 'Déclaré',    color: '#D97706', bg: '#FFFBEB' },
                      late:    { label: 'En retard',  color: '#DC2626', bg: '#FEF2F2' },
                      pending: { label: 'En attente', color: '#94A3B8', bg: '#F1F5F9' },
                    }
                    const sc = stConfig[st]
                    return (
                      <button key={p.id} onClick={() => setEditPayment(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFBFC] transition-colors text-left"
                        style={st === 'claimed' ? { background: '#FFFDF0' } : {}}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 bg-brand-bg text-brand">
                          {clientName(p).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-[#0D1F3C] truncate">{clientName(p)}</p>
                            {st === 'claimed' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] shrink-0">
                                À CONFIRMER
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#94A3B8]">
                            Échéance : {fmtDate(p.due_date)}
                            {p.notes ? ` · ${p.notes}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[13px] font-bold text-[#0D1F3C]">{fmtAmount(p.amount)}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: sc.color, background: sc.bg }}>
                            {sc.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <PlanGate featureKey="rappels_paiement" userPlan={profile.plan ?? 'free'}>
              <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
                <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">Rappels automatiques de paiement</p>
                <p className="text-[11px] text-[#94A3B8]">Rappels envoyes automatiquement aux membres en retard.</p>
              </div>
            </PlanGate>
          </>
        )}

        {/* ── Croissance ───────────────────────────────────────────────────── */}
        {tab === 'croissance' && (
          <PlanGate featureKey="stats_croissance" userPlan={profile.plan ?? 'free'}>
          <>
            {/* Growth KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={13} className="text-[#4E9B6F]" />
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">Membres actifs</span>
                </div>
                <p className="text-[26px] font-bold text-[#0D1F3C] leading-none">{activeClients.length}</p>
                <p className="text-[11px] mt-1" style={{ color: growthPct.startsWith('+') ? '#4E9B6F' : growthPct === '—' ? '#CBD5E1' : '#EF4444' }}>
                  {growthPct} vs mois dernier
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={13} className="text-[#3B82F6]" />
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wide font-medium">Revenus ce mois</span>
                </div>
                <p className="text-[22px] font-bold text-[#0D1F3C] leading-none">{fmtAmount(revenueByMonth[5].value)}</p>
                <p className="text-[11px] mt-1" style={{ color: revGrowthPct.startsWith('+') ? '#4E9B6F' : revGrowthPct === '—' ? '#CBD5E1' : '#EF4444' }}>
                  {revGrowthPct} vs mois dernier
                </p>
              </div>
            </div>

            {/* Charts côte à côte — style carte sombre animée */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Clients */}
              {(() => {
                const MAX_CLIENTS = 15
                const highestClients = Math.max(...monthlyGrowth.map(m => m.value), 1)
                const clientChartH = Math.max(Math.round((highestClients / MAX_CLIENTS) * 120), 40)
                const clientsChartData = monthlyGrowth.map((m, i) => ({
                  name: m.label,
                  value: Math.round((m.value / highestClients) * 100),
                  highlighted: i === monthlyGrowth.length - 1,
                }))
                const totalNewClients = monthlyGrowth.reduce((s, m) => s + m.value, 0)
                const thisMonthClients = monthlyGrowth[5].value
                const lastMonthClients = monthlyGrowth[4].value
                const diff = thisMonthClients - lastMonthClients
                return (
                  <AnimatedBarCard
                    title="Nouveaux membres — 6 mois"
                    currentValue={thisMonthClients}
                    formatValue={(v) => Math.round(v).toString()}
                    description={
                      diff > 0 ? (
                        <><span style={{ color: '#4E9B6F', fontWeight: 600 }}>+{diff} vs mois dernier</span> · {totalNewClients} sur 6 mois</>
                      ) : diff < 0 ? (
                        <><span style={{ color: '#EF4444', fontWeight: 600 }}>{diff} vs mois dernier</span> · {totalNewClients} sur 6 mois</>
                      ) : (
                        <>Stable vs mois dernier · {totalNewClients} sur 6 mois</>
                      )
                    }
                    chartData={clientsChartData}
                    chartHeight={clientChartH}
                    highlightedBarColor="#4E9B6F"
                  />
                )
              })()}

              {/* Revenus */}
              {loadingPayments ? (
                <div className="rounded-2xl flex items-center justify-center h-[200px]"
                  style={{ background: 'linear-gradient(145deg, #0f1f2e 0%, #0D1F3C 55%, #0a1a10 100%)' }}>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-[#4E9B6F]" />
                </div>
              ) : (() => {
                const MAX_REVENUE = 10000
                const highestRev = Math.max(...revenueByMonth.map(m => m.value), 1)
                // Hauteur du conteneur : grandit avec la valeur absolue (40px → 120px)
                const revChartH = Math.max(Math.round((highestRev / MAX_REVENUE) * 120), 40)
                // Barres normalisées entre elles (la plus haute = 100%) → toujours visibles
                const revenueChartData = revenueByMonth.map((m, i) => ({
                  name: m.label,
                  value: Math.round((m.value / highestRev) * 100),
                  highlighted: i === revenueByMonth.length - 1,
                }))
                const thisMonthRev = revenueByMonth[5].value
                const lastMonthRev = revenueByMonth[4].value
                const delta = Math.round(thisMonthRev - lastMonthRev)
                return (
                  <AnimatedBarCard
                    title="Revenus encaissés — 6 mois"
                    currentValue={thisMonthRev}
                    formatValue={(v) => Math.round(v).toLocaleString('fr-FR') + ' €'}
                    chartHeight={revChartH}
                    description={
                      payments.length === 0 ? (
                        <>Aucun paiement enregistré</>
                      ) : delta > 0 ? (
                        <><span style={{ color: '#4E9B6F', fontWeight: 600 }}>+{delta.toLocaleString('fr-FR')} € vs mois dernier</span></>
                      ) : delta < 0 ? (
                        <><span style={{ color: '#EF4444', fontWeight: 600 }}>{delta.toLocaleString('fr-FR')} € vs mois dernier</span></>
                      ) : (
                        <>Stable vs mois dernier</>
                      )
                    }
                    chartData={revenueChartData}
                    highlightedBarColor="#4E9B6F"
                  />
                )
              })()}

            </div>

            {/* Parrainage */}
            <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
              <div className="flex items-center gap-3 mb-3">
                <Gift size={16} className="text-brand" />
                <p className="text-[13px] font-semibold text-[#0D1F3C]">Parrainage</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[26px] font-bold text-[#0D1F3C] leading-none">{profile.referral_count ?? 0}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    coach{(profile.referral_count ?? 0) > 1 ? 's' : ''} parrainé{(profile.referral_count ?? 0) > 1 ? 's' : ''}
                  </p>
                </div>
                {profile.referral_discount_pending && (
                  <div className="ml-4 px-3 py-2 bg-[#FFF7ED] border border-[#FED7AA] rounded-lg">
                    <p className="text-[12px] font-medium text-[#C2410C]">Remise -50% en attente</p>
                  </div>
                )}
              </div>
            </div>
          </>
          </PlanGate>
        )}

      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPaymentModal
          clients={clients}
          onClose={() => setShowAddModal(false)}
          onAdded={p => setPayments(prev => [p, ...prev])}
        />
      )}
      {editPayment && (
        <EditPaymentModal
          payment={editPayment}
          onClose={() => setEditPayment(null)}
          onUpdated={updated => setPayments(prev => prev.map(p => p.id === updated.id ? updated : p))}
          onDeleted={id => setPayments(prev => prev.filter(p => p.id !== id))}
        />
      )}
    </div>
  )
}
