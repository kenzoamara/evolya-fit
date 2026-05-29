'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useIsCoachView } from '@/hooks/use-coach-view'

// ── Types ──────────────────────────────────────────────────────────────────────
type Payment = {
  id: string
  amount: number
  currency: string
  due_date: string
  paid_date: string | null
  claimed_at: string | null
  notes: string | null
  created_at: string
}

type PaymentStatus = 'paid' | 'claimed' | 'late' | 'pending'

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(s: string): string {
  const d = new Date(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function getStatus(p: Payment): PaymentStatus {
  if (p.paid_date) return 'paid'
  if (p.claimed_at) return 'claimed'
  if (p.due_date < todayStr()) return 'late'
  return 'pending'
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string }> = {
  paid:    { label: 'Payé',                       color: 'var(--success)', bg: 'var(--success-bg)', border: '#BBF7D0' },
  claimed: { label: 'En attente de confirmation', color: 'var(--warning)', bg: 'var(--warning-bg)', border: '#FDE68A' },
  late:    { label: 'En retard',                  color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: '#FECACA' },
  pending: { label: 'À régler',                   color: 'var(--info)',    bg: 'var(--info-bg)',    border: '#BFDBFE' },
}

const COLOR = 'var(--brand)'
const COLOR_BG = 'var(--brand-bg)'

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  payment,
  onClose,
  onConfirmed,
}: {
  payment: Payment
  onClose: () => void
  onConfirmed: (p: Payment) => void
}) {
  const params = useParams()
  const token = params?.token as string
  const [loading, setLoading] = useState(false)

  async function handleClaim() {
    setLoading(true)
    const res = await fetch(`/api/client/payments/${payment.id}/claim`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? 'Erreur')
      return
    }
    const { payment: updated } = await res.json()
    toast.success('Déclaration envoyée à ton coach')
    onConfirmed(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-2xl">

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: COLOR_BG }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </div>

        <p className="text-[16px] font-bold text-[#0D1F3C] text-center mb-1">Signaler le paiement</p>
        <p className="text-[13px] text-[#64748B] text-center mb-5 leading-relaxed">
          Tu vas indiquer à ton coach que tu as effectué le virement de{' '}
          <span className="font-bold text-[#0D1F3C]">{fmtAmount(payment.amount)}</span>.
          Il devra confirmer de son côté.
        </p>

        {/* Details */}
        <div className="bg-[#F8FAFB] rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#94A3B8]">Montant</span>
            <span className="font-bold text-[#0D1F3C]">{fmtAmount(payment.amount)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#94A3B8]">Échéance</span>
            <span className="font-medium text-[#0D1F3C]">{fmtDate(payment.due_date)}</span>
          </div>
          {payment.notes && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#94A3B8]">Note</span>
              <span className="font-medium text-[#0D1F3C] text-right max-w-[180px] truncate">{payment.notes}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFB] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleClaim}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: COLOR }}
          >
            {loading ? 'Envoi…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaiementPage() {
  const params = useParams()
  const token = params?.token as string
  const isCoachView = useIsCoachView()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [claimTarget, setClaimTarget] = useState<Payment | null>(null)

  // Packs en ligne (Stripe Connect)
  const [offers, setOffers] = useState<{ id: string; name: string; price_cents: number; sessions_count: number | null }[]>([])
  const [creditsRemaining, setCreditsRemaining] = useState(0)
  const [paymentsEnabled, setPaymentsEnabled] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/client/payments?token=${token}`)
      .then(r => r.json())
      .then(d => { setPayments(d.payments ?? []); setLoading(false) })
      .catch(() => setLoading(false))

    fetch(`/api/payments/offers?token=${token}`)
      .then(r => r.json())
      .then(d => {
        setOffers(d.offers ?? [])
        setPaymentsEnabled(d.paymentsEnabled ?? false)
        setCreditsRemaining((d.entitlements ?? []).reduce((s: number, e: { sessions_remaining: number | null }) => s + (e.sessions_remaining ?? 0), 0))
      })
      .catch(() => {})

    const sp = new URLSearchParams(window.location.search)
    if (sp.get('paid') === '1') { toast.success('Paiement réussi — merci !'); window.history.replaceState({}, '', `/c/${token}/paiement`) }
    if (sp.get('canceled') === '1') { window.history.replaceState({}, '', `/c/${token}/paiement`) }
  }, [token])

  async function handleBuy(offerId: string) {
    setBuyingId(offerId)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, offerId }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      toast.error(data.error ?? 'Paiement indisponible.')
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setBuyingId(null)
    }
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalDue = payments.filter(p => !p.paid_date).reduce((s, p) => s + p.amount, 0)
  const totalPaid = payments.filter(p => p.paid_date).reduce((s, p) => s + p.amount, 0)
  const lateCount = payments.filter(p => getStatus(p) === 'late').length

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${COLOR} transparent transparent transparent` }} />
    </div>
  )

  // Sort: late → pending → claimed → paid
  const ORDER: Record<PaymentStatus, number> = { late: 0, pending: 1, claimed: 2, paid: 3 }
  const sorted = [...payments].sort((a, b) => ORDER[getStatus(a)] - ORDER[getStatus(b)])

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

      {/* Bandeau mode spectateur */}
      {isCoachView && (
        <div className="mb-5 px-4 py-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 9.5v.3"/></svg>
          <p className="text-[12px] text-[#92400E] font-medium">Mode spectateur — les actions de paiement sont désactivées.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: COLOR_BG }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1F3C]">Paiements</h1>
          <p className="text-[12px] text-[#94A3B8]">Règle tes packs et suis tes paiements</p>
        </div>
      </div>

      {/* Crédits de séances restants */}
      {creditsRemaining > 0 && (
        <div className="mb-5 rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: COLOR_BG }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: COLOR }}>
            <span className="text-white text-[16px] font-bold">{creditsRemaining}</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C]">{creditsRemaining} séance{creditsRemaining > 1 ? 's' : ''} restante{creditsRemaining > 1 ? 's' : ''}</p>
            <p className="text-[12px] text-[#64748B]">Décomptées au fur et à mesure de tes séances.</p>
          </div>
        </div>
      )}

      {/* Packs à acheter en ligne */}
      {paymentsEnabled && offers.length > 0 && !isCoachView && (
        <div className="mb-6">
          <p className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-2.5">Packs de séances</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {offers.map(o => (
              <div key={o.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col">
                <p className="text-[14px] font-bold text-[#0D1F3C]">{o.name}</p>
                <p className="text-[12px] text-[#94A3B8] mb-3">{o.sessions_count} séances</p>
                <p className="text-[22px] font-bold text-[#0D1F3C] mb-3">{fmtAmount(o.price_cents / 100)}</p>
                <button
                  onClick={() => handleBuy(o.id)}
                  disabled={buyingId === o.id}
                  className="mt-auto w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: COLOR }}
                >
                  {buyingId === o.id ? 'Redirection…' : 'Régler en ligne'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-2">Paiement sécurisé par Stripe. Tu recevras un reçu par email.</p>
        </div>
      )}

      {/* Empty state — uniquement si vraiment rien (ni paiement, ni pack, ni crédit) */}
      {payments.length === 0 ? (
        (offers.length === 0 && creditsRemaining === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: COLOR_BG }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#0D1F3C] mb-1">Aucun paiement</p>
          <p className="text-[13px] text-[#94A3B8] max-w-xs leading-relaxed">
            Ton coach n'a pas encore enregistré de paiement pour toi.
          </p>
        </div>
        ) : null
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 sm:p-4">
              <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">Total dû</p>
              <p className="text-[18px] sm:text-[22px] font-bold text-[#0D1F3C] leading-none">
                {totalDue > 0 ? fmtAmount(totalDue) : '—'}
              </p>
            </div>
            <div
              className="border rounded-2xl p-3 sm:p-4"
              style={lateCount > 0 ? { background: '#FEF2F2', borderColor: '#FECACA' } : { background: '#fff', borderColor: '#E2E8F0' }}
            >
              <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">En retard</p>
              <p className="text-[18px] sm:text-[22px] font-bold leading-none" style={{ color: lateCount > 0 ? '#DC2626' : '#0D1F3C' }}>
                {lateCount > 0 ? lateCount : '—'}
              </p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 sm:p-4">
              <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">Réglé</p>
              <p className="text-[18px] sm:text-[22px] font-bold text-[#16A34A] leading-none">
                {totalPaid > 0 ? fmtAmount(totalPaid) : '—'}
              </p>
            </div>
          </div>

          {/* Alert banner for late payments */}
          {lateCount > 0 && (
            <div className="flex items-start gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 mb-5">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-[#DC2626]">
                  {lateCount} paiement{lateCount > 1 ? 's' : ''} en retard
                </p>
                <p className="text-[12px] text-[#DC2626]/70 mt-0.5 leading-relaxed">
                  Règle dès que possible et signale le paiement à ton coach ci-dessous.
                </p>
              </div>
            </div>
          )}

          {/* Payment list */}
          <div className="space-y-3">
            {sorted.map(p => {
              const status = getStatus(p)
              const sc = STATUS_CONFIG[status]
              const canClaim = status === 'pending' || status === 'late'

              return (
                <div
                  key={p.id}
                  className="bg-white border rounded-2xl overflow-hidden transition-all"
                  style={{ borderColor: canClaim || status === 'claimed' ? sc.border : '#E2E8F0' }}
                >
                  {/* Top stripe for late */}
                  {status === 'late' && (
                    <div className="h-1 w-full" style={{ background: sc.color }} />
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        {/* Amount */}
                        <p className="text-[22px] font-bold text-[#0D1F3C] leading-none mb-1.5">
                          {fmtAmount(p.amount)}
                        </p>
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#94A3B8]">
                          <span>Échéance : {fmtDate(p.due_date)}</span>
                          {p.notes && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[160px]">{p.notes}</span>
                            </>
                          )}
                          {p.paid_date && (
                            <>
                              <span>·</span>
                              <span className="text-[#16A34A]">Payé le {fmtDate(p.paid_date)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ color: sc.color, background: sc.bg }}
                      >
                        {sc.label}
                      </span>
                    </div>

                    {/* Action */}
                    {canClaim && !isCoachView && (
                      <button
                        onClick={() => setClaimTarget(p)}
                        className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                        style={{ background: COLOR }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Signaler le paiement
                      </button>
                    )}

                    {status === 'claimed' && (
                      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl" style={{ background: '#FFFBEB' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <p className="text-[12px] font-medium" style={{ color: '#D97706' }}>
                          Déclaration envoyée — en attente de confirmation par ton coach
                        </p>
                      </div>
                    )}

                    {status === 'paid' && (
                      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl" style={{ background: '#F0FDF4' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <p className="text-[12px] font-medium text-[#16A34A]">
                          Paiement confirmé par ton coach
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-[#D1D5DB] mt-6">
            Les paiements sont gérés et confirmés par ton coach.
          </p>
        </>
      )}

      {/* Confirm modal — bloqué en mode spectateur */}
      {claimTarget && !isCoachView && (
        <ConfirmModal
          payment={claimTarget}
          onClose={() => setClaimTarget(null)}
          onConfirmed={updated => {
            setPayments(prev => prev.map(p => p.id === updated.id ? updated : p))
            setClaimTarget(null)
          }}
        />
      )}
    </div>
  )
}
