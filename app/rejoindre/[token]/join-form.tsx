'use client'

import { useState } from 'react'

type Props = { coachId: string; coachName: string; brand: string }

const inputCls = 'w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[var(--brand)] transition-all'

export function JoinForm({ coachId, coachName, brand }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !emailValid) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/join/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId, firstName, lastName, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); setLoading(false); return }
      setDone(true)
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--brand-bg)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-[17px] font-bold text-[#0D1F3C] mb-1.5">Demande envoyée !</h2>
        <p className="text-[13px] text-[#64748B] leading-relaxed">
          {coachName} a reçu ta demande. Tu recevras l&apos;accès à ton espace dès qu&apos;elle sera validée.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-[#0D1F3C] mb-1.5">Prénom</label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required maxLength={40} placeholder="Marie" className={inputCls} autoFocus />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#0D1F3C] mb-1.5">Nom</label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required maxLength={40} placeholder="Dupont" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[12px] font-medium text-[#0D1F3C] mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} placeholder="marie@exemple.com" className={inputCls} />
        <p className="text-[11px] text-[#94A3B8] mt-1.5">Tu recevras ton accès par email dès que ta demande sera validée.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !firstName.trim() || !lastName.trim() || !emailValid}
        className="w-full py-3 text-white text-[14px] font-semibold rounded-xl transition-all disabled:opacity-40"
        style={{ background: brand }}
      >
        {loading ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
      <p className="text-[11px] text-[#94A3B8] text-center leading-relaxed">
        Ta demande sera validée par {coachName} avant l&apos;accès à ton espace.
      </p>
    </form>
  )
}
