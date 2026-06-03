'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile, PaymentOffer, Transaction } from '@/types/database'

type Props = { profile: Profile; initialOffers: PaymentOffer[]; transactions: Transaction[] }

function euros(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function PaiementsContent({ profile, initialOffers, transactions }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [offers, setOffers] = useState(initialOffers)
  const [status, setStatus] = useState(profile.connect_status)
  const [chargesEnabled, setChargesEnabled] = useState(profile.connect_charges_enabled)
  const [connecting, setConnecting] = useState(false)

  // Formulaire nouvelle offre
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [sessions, setSessions] = useState('')
  const [saving, setSaving] = useState(false)

  // Au retour de l'onboarding Stripe (?connect=done) → rafraîchir le statut
  useEffect(() => {
    if (searchParams.get('connect') === 'done') {
      fetch('/api/stripe/connect/status').then(r => r.json()).then(d => {
        if (d.status) { setStatus(d.status); setChargesEnabled(d.chargesEnabled) }
        if (d.chargesEnabled) toast.success('Paiements activés !')
        window.history.replaceState({}, '', '/paiements')
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      toast.error(data.error ?? 'Erreur lors de la connexion Stripe.')
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/payment-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, priceEuros: price, sessionsCount: sessions }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erreur.'); return }
      setOffers([data.offer, ...offers])
      setName(''); setPrice(''); setSessions(''); setShowForm(false)
      toast.success('Pack créé.')
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteOffer(id: string) {
    const res = await fetch(`/api/payment-offers?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Erreur.'); return }
    setOffers(offers.filter(o => o.id !== id))
    toast.success('Pack retiré.')
  }

  const totalPaid = transactions.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount_cents, 0)

  return (
    <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-6 pb-24 sm:py-8 max-w-5xl w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#0D1F3C] tracking-tight">Paiements clients</h1>
        <p className="text-sm text-[#64748B] mt-1">Vends des packs de séances. L&apos;argent arrive directement sur ton compte.</p>
      </div>

      {/* État Connect */}
      {chargesEnabled ? (
        <div className="mb-6 bg-[#EEF9F3] border border-[#4E9B6F]/25 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4E9B6F]/15 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4E9B6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C]">Paiements activés</p>
            <p className="text-[12px] text-[#64748B]">Tes clients peuvent régler leurs packs en ligne.</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <p className="text-[14px] font-semibold text-[#0D1F3C] mb-1">Active les paiements en ligne</p>
          <p className="text-[13px] text-[#64748B] mb-4 leading-relaxed">
            Connecte ton compte via Stripe (vérification en quelques minutes). L&apos;argent de tes clients arrive <strong>directement sur ton compte bancaire</strong>. Evolya ne prélève aucune commission — seuls les frais Stripe (~1,5 % + 0,25 €) s&apos;appliquent.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-5 py-2.5 bg-[#4E9B6F] text-white text-sm font-semibold rounded-lg hover:bg-[#3d8058] transition-all disabled:opacity-50"
          >
            {connecting ? 'Redirection…' : status === 'pending' ? 'Continuer la configuration' : 'Activer les paiements'}
          </button>
          {status === 'restricted' && (
            <p className="text-[12px] text-red-600 mt-2">Ton compte nécessite des informations supplémentaires. Clique pour compléter.</p>
          )}
        </div>
      )}

      {/* Offres / packs */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0D1F3C]">Mes packs</h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="text-sm font-medium text-[#4E9B6F] hover:text-[#3d8058]">+ Nouveau pack</button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreateOffer} className="bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg p-4 mb-4 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase mb-1">Nom</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Pack 10 séances" className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase mb-1">Prix (€)</label>
                <input type="number" min="1" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="350" className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase mb-1">Séances</label>
                <input type="number" min="1" value={sessions} onChange={e => setSessions(e.target.value)} required placeholder="10" className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9]">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#4E9B6F] text-white text-sm font-medium rounded-lg hover:bg-[#3d8058] disabled:opacity-50">{saving ? 'Création…' : 'Créer le pack'}</button>
            </div>
          </form>
        )}

        {offers.length === 0 ? (
          <p className="text-[13px] text-[#94A3B8] py-4 text-center">Aucun pack. Crée ton premier pack de séances à vendre.</p>
        ) : (
          <div className="space-y-2">
            {offers.map(o => (
              <div key={o.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#0D1F3C]">{o.name}</p>
                  <p className="text-[12px] text-[#64748B]">{o.sessions_count} séances · {euros(o.price_cents)}</p>
                </div>
                <button onClick={() => handleDeleteOffer(o.id)} className="text-[12px] text-[#94A3B8] hover:text-red-500">Retirer</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transactions */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0D1F3C]">Transactions</h2>
          <span className="text-[13px] font-semibold text-[#4E9B6F]">{euros(totalPaid)} encaissés</span>
        </div>
        {transactions.length === 0 ? (
          <p className="text-[13px] text-[#94A3B8] py-4 text-center">Aucune transaction pour le moment.</p>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-[#0D1F3C]">{t.client?.full_name ?? 'Client'}</p>
                  <p className="text-[11px] text-[#94A3B8]">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[13px] font-semibold ${t.status === 'refunded' ? 'text-[#94A3B8] line-through' : 'text-[#0D1F3C]'}`}>{euros(t.amount_cents)}</p>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: t.status === 'paid' ? '#16A34A' : t.status === 'refunded' ? '#94A3B8' : '#DC2626' }}>
                    {t.status === 'paid' ? 'Payé' : t.status === 'refunded' ? 'Remboursé' : 'Échoué'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
