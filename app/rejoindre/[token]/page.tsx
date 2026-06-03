export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { JoinForm } from './join-form'

export default async function JoinRequestPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: coach } = await admin
    .from('profiles')
    .select('id, full_name, coaching_type, brand_color_primary, brand_icon')
    .eq('id', token)
    .eq('role', 'coach')
    .single()

  if (!coach) {
    return (
      <div className="min-h-dvh bg-[#F8FAFB] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#94A3B8] text-xl">✕</span>
          </div>
          <h1 className="text-lg font-semibold text-[#0D1F3C] mb-2">Lien invalide</h1>
          <p className="text-sm text-[#64748B]">Ce lien d&apos;invitation n&apos;est pas valide. Demande un nouveau lien à ton coach.</p>
        </div>
      </div>
    )
  }

  const c = coach as { id: string; full_name: string | null; coaching_type: string | null; brand_color_primary: string | null; brand_icon: string | null }
  const brand = c.brand_color_primary ?? '#4E9B6F'
  const coachName = c.full_name ?? 'Votre coach'
  const photo = c.brand_icon?.startsWith('http') ? c.brand_icon : null
  const initial = coachName.charAt(0).toUpperCase()

  return (
    <div className="min-h-dvh bg-[#F8FAFB] flex items-center justify-center px-4 py-10">
      <style dangerouslySetInnerHTML={{ __html: `:root { --brand: ${brand}; --brand-bg: color-mix(in srgb, ${brand} 12%, white); }` }} />
      <div className="w-full max-w-md">
        {/* Coach header */}
        <div className="text-center mb-6">
          {photo ? (
            <img src={photo} alt={coachName} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
          ) : (
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-[26px] font-bold text-white" style={{ background: brand }}>
              {initial}
            </div>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: brand }}>Rejoindre le coaching</p>
          <h1 className="text-[22px] font-bold text-[#0D1F3C] mt-1">{coachName}</h1>
          {c.coaching_type && <p className="text-[13px] text-[#64748B] mt-0.5">{c.coaching_type}</p>}
        </div>

        <JoinForm coachId={c.id} coachName={coachName} brand={brand} />
      </div>
    </div>
  )
}
