'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  token: string
  clientName: string
  email: string
  coachName: string
  onboardingDone: boolean
}

export function CreateAccountForm({
  token,
  clientName,
  email,
  coachName,
  onboardingDone,
}: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const firstName = clientName.split(' ')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/client/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création du compte.')
        return
      }
      router.push(onboardingDone ? `/c/${token}/dashboard` : `/c/${token}/onboarding`)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8FAFB] flex flex-col overflow-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Coach branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#4E9B6F] flex items-center justify-center mb-3">
              <span className="text-white font-bold text-lg">{coachName.charAt(0).toUpperCase()}</span>
            </div>
            <p className="text-xs font-semibold text-[#4E9B6F] tracking-widest uppercase">{coachName}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-6 py-8">

            <div className="mb-6">
              <h1 className="text-lg font-semibold text-[#0D1F3C] mb-1">
                Bonjour {firstName}
              </h1>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Créez votre mot de passe pour accéder à votre espace de coaching.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email lecture seule */}
              <div>
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] cursor-default"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="8 caractères minimum"
                    className="w-full px-3 py-2.5 pr-10 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Répétez votre mot de passe"
                    className="w-full px-3 py-2.5 pr-10 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Indicateur force mot de passe */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all"
                        style={{
                          backgroundColor:
                            password.length >= 12 ? '#4E9B6F' :
                            password.length >= 8  ? '#D97706' :
                            i === 1 ? '#EF4444' : '#E2E8F0'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{
                    color: password.length >= 12 ? '#4E9B6F' : password.length >= 8 ? '#D97706' : '#EF4444'
                  }}>
                    {password.length >= 12 ? 'Mot de passe fort' : password.length >= 8 ? 'Mot de passe correct' : 'Trop court'}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || password.length < 8 || !confirm}
                className="w-full py-3 bg-[#4E9B6F] text-white font-semibold rounded-lg hover:bg-[#3d8058] transition-all active:scale-[0.98] disabled:opacity-50 text-sm mt-1"
              >
                {loading ? 'Création en cours...' : 'Créer mon compte'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-5">
            Déjà un compte ?{' '}
            <a href="/c/login" className="text-[#4E9B6F] hover:underline font-medium">
              Se connecter
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}
