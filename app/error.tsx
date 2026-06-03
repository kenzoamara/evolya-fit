'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-[#F8FAFB] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="1.5"/>
              <path d="M12 7v6M12 16.5v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0D1F3C] mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-[#64748B] leading-relaxed mb-8">
            Quelque chose s&apos;est mal passé. Réessayez ou revenez à l&apos;accueil.
            {error.digest && (
              <span className="block mt-2 text-xs text-[#94A3B8] font-mono">
                Ref : {error.digest}
              </span>
            )}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={reset}
              className="w-full py-2.5 bg-[#0D1F3C] hover:bg-[#162847] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="w-full py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] text-sm font-semibold rounded-xl transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#94A3B8]">
          Si le problème persiste :{' '}
          <a href="mailto:contact@evolyafit.fr" className="text-[#4E9B6F] hover:underline">
            contact@evolyafit.fr
          </a>
        </p>
      </div>
    </div>
  )
}
