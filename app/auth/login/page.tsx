'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // Redirection selon le rôle : les admins vont directement sur l'espace admin
    let destination = '/dashboard'
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      if (profile?.role === 'admin') destination = '/admin'
    }

    router.push(destination)
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex">

      {/* Panneau gauche — branding (desktop uniquement) */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#0D1F3C] flex-col px-12 py-10 relative overflow-hidden">
        {/* Motif de fond subtil */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #4E9B6F 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4E9B6F 0%, transparent 50%)' }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <Logo height={40} variant="light" />

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#4E9B6F] mb-4">
              Plateforme coaching sportif
            </p>
            <h2 className="text-[32px] font-bold text-white leading-tight tracking-tight mb-6">
              Tout ce dont tu as besoin,<br />dans un seul outil.
            </h2>
            <p className="text-[15px] text-[#94A3B8] leading-relaxed mb-10 max-w-sm">
              Programmes, séances, suivi client, messagerie et gestion — centralisés pour les coachs sportifs français.
            </p>

            <div className="space-y-3">
              {[
                'Suivi de progression en temps réel',
                'Messagerie coach-client intégrée',
                'Planning et gestion de séances',
                'Donnees hebergees en Union europeenne',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4E9B6F]/20 border border-[#4E9B6F]/30 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5l2 2 4-4" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-[13px] text-[#CBD5E1]">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#334155] relative z-10">
            © {new Date().getFullYear()} Evolya · Fait avec passion en France
          </p>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8FAFB]">
        <div className="w-full max-w-[380px]">

          {/* Logo mobile uniquement */}
          <div className="lg:hidden flex justify-center mb-10">
            <Logo height={38} variant="default" />
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-[#0D1F3C] tracking-tight">Bon retour</h1>
            <p className="text-[14px] text-[#64748B] mt-1">Connectez-vous à votre espace coach</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] focus:ring-3 focus:ring-[#4E9B6F]/10 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-[#0D1F3C]">
                  Mot de passe
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] focus:ring-3 focus:ring-[#4E9B6F]/10 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200/60 rounded-lg px-3.5 py-2.5">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#4E9B6F] hover:bg-[#3d8058] active:scale-[0.99] text-white text-[13.5px] font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              style={{ boxShadow: '0 1px 3px rgba(78,155,111,0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Connexion…
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#64748B] mt-6">
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="text-[#4E9B6F] font-semibold hover:text-[#3d8058] transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
