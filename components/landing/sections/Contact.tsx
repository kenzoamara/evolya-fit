'use client'

import { useState } from 'react'
import { AnimatedBackground } from '../AnimatedBackground'
import { SectionTag } from '@/components/landing/section-tag'

export function Contact() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', sujet: '', message: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Une erreur est survenue.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Impossible d\'envoyer le message. Réessaie plus tard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-gradient-to-b from-[#0D1F3C] to-[#091528] py-24 px-6 relative overflow-hidden">
      <AnimatedBackground mode="rain" theme="dark" intensity={0.4} density={80} speed={0.6} accent={0.45} />
      <div className="max-w-5xl mx-auto relative z-[1]">
        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* Gauche — texte */}
          <div className="pt-2">
            <SectionTag>Contact</SectionTag>
            <h2 className="text-[40px] md:text-[52px] font-bold text-white leading-tight tracking-tight mb-5">
              Une question&nbsp;?
            </h2>
            <p className="text-[15px] text-[#94A3B8] leading-relaxed mb-10 max-w-sm">
              Tu veux en savoir plus sur Evolya ? Alors pose-nous une question directement ici.
            </p>

            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#4E9B6F" strokeWidth="1.4"/>
                  <path d="M1.5 5.5l6.5 4 6.5-4" stroke="#4E9B6F" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] font-medium uppercase tracking-wide">Notre email</p>
                <a href="mailto:contact.evolya.pro@gmail.com" className="text-[14px] text-white font-medium hover:text-[#4E9B6F] transition-colors">
                  contact.evolya.pro@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Droite — formulaire */}
          <div className="bg-[#0F2748] border border-white/10 rounded-2xl p-7 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-[#4E9B6F]/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11l5 5 9-9" stroke="#4E9B6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-white font-semibold text-[16px] mb-1">Message envoyé</p>
                <p className="text-[#64748B] text-[13px]">On vous répond rapidement.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Prénom / Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#94A3B8] mb-1.5">Prénom</label>
                    <input
                      name="prenom"
                      value={form.prenom}
                      onChange={handleChange}
                      placeholder="Jean"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#475569] focus:outline-none focus:border-[#4E9B6F]/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#94A3B8] mb-1.5">Nom</label>
                    <input
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Dupont"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#475569] focus:outline-none focus:border-[#4E9B6F]/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#94A3B8] mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jean@exemple.fr"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#475569] focus:outline-none focus:border-[#4E9B6F]/60 transition-colors"
                  />
                </div>

                {/* Sujet */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#94A3B8] mb-1.5">Sujet</label>
                  <select
                    name="sujet"
                    value={form.sujet}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#4E9B6F]/60 transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                  >
                    <option value="" disabled>Choisir un sujet</option>
                    <option value="Question générale">Question générale</option>
                    <option value="Tarifs & abonnement">Tarifs & abonnement</option>
                    <option value="Fonctionnalités">Fonctionnalités</option>
                    <option value="Problème technique">Problème technique</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#94A3B8] mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Ton message..."
                    required
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#475569] focus:outline-none focus:border-[#4E9B6F]/60 transition-colors resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4E9B6F] hover:bg-[#3D7A5F] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-3.5 rounded-xl transition-colors duration-200"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>

              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
