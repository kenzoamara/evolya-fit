import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si plus suspendu, rediriger
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('suspended').eq('id', user.id).single()
    if (!profile?.suspended) redirect('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFB] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-lg font-semibold text-[#0D1F3C] mb-2">Compte suspendu</h1>
        <p className="text-sm text-[#64748B] leading-relaxed mb-6">
          Votre compte Evolya a été temporairement suspendu par l&apos;équipe.
          Contactez-nous pour en savoir plus.
        </p>
        <a
          href="mailto:support@evolya.fr"
          className="inline-block px-5 py-2.5 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Contacter le support
        </a>
        <form action="/api/auth/signout" method="POST" className="mt-4">
          <button type="submit" className="text-xs text-[#94A3B8] hover:text-[#64748B]">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
