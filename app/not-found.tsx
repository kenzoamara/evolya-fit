import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="mb-8">
          <Logo height={32} variant="default" />
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-black text-[#94A3B8]">404</span>
          </div>
          <h1 className="text-xl font-bold text-[#0D1F3C] mb-2">Page introuvable</h1>
          <p className="text-sm text-[#64748B] leading-relaxed mb-8">
            Cette page n&apos;existe pas ou a été déplacée.<br />
            Vérifiez l&apos;URL ou retournez à l&apos;accueil.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-2.5 bg-[#0D1F3C] hover:bg-[#162847] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <p className="mt-6 text-xs text-[#94A3B8]">
          Besoin d&apos;aide ?{' '}
          <a href="mailto:contact@evolyafit.fr" className="text-[#4E9B6F] hover:underline">
            contact@evolyafit.fr
          </a>
        </p>
      </div>
    </div>
  )
}
