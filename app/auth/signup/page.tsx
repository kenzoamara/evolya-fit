import { Suspense } from 'react'
import Link from 'next/link'
import { SignupForm } from './signup-form'
import { Logo } from '@/components/shared/logo'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">

      {/* Panneau gauche — branding (desktop uniquement) */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#0D1F3C] flex-col px-12 py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #4E9B6F 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4E9B6F 0%, transparent 50%)' }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <Logo height={40} variant="light" />

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#4E9B6F] mb-4">
              Rejoindre Evolya
            </p>
            <h2 className="text-[32px] font-bold text-white leading-tight tracking-tight mb-4">
              Arrête de jongler entre 6 apps. Gère tout depuis un seul endroit.
            </h2>
            <p className="text-[15px] text-[#94A3B8] leading-relaxed mb-8">
              14 jours d'essai gratuit. Aucune carte bancaire requise.
            </p>

            <div className="space-y-3">
              {[
                'Opérationnel en moins de 10 minutes',
                'Intuitif dès le premier jour — simple',
                'Une question ? Support disponible 7j/7',
                'Données hébergées en Union européenne',
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
            &copy; {new Date().getFullYear()} Evolya · Fait avec passion en France
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
            <h1 className="text-[26px] font-bold text-[#0D1F3C] tracking-tight">Creer votre compte</h1>
            <p className="text-[14px] text-[#64748B] mt-1">14 jours d'essai gratuit — sans carte bancaire</p>
          </div>

          <Suspense fallback={
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-10 bg-[#E2E8F0] rounded-lg animate-pulse" />
              ))}
            </div>
          }>
            <SignupForm />
          </Suspense>

          <p className="text-center text-[13px] text-[#64748B] mt-6">
            Deja un compte ?{' '}
            <Link href="/auth/login" className="text-[#4E9B6F] font-semibold hover:text-[#3d8058] transition-colors">
              Se connecter
            </Link>
          </p>

          <p className="text-center text-[11px] text-[#94A3B8] mt-4">
            En creant un compte, vous acceptez nos{' '}
            <Link href="/cgu" className="underline hover:text-[#64748B] transition-colors">
              conditions d'utilisation
            </Link>
            .
          </p>
        </div>
      </div>

    </div>
  )
}
