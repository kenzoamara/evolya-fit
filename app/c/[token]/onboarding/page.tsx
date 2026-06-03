export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from './onboarding-flow'

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date().toISOString()
  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, coach_id, onboarding_completed_at')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) redirect(`/c/${token}/dashboard`)

  // Already completed — go straight to dashboard
  if (client.onboarding_completed_at) redirect(`/c/${token}/dashboard`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, brand_icon')
    .eq('id', client.coach_id)
    .single()

  const p = profile as { full_name: string | null; brand_icon: string | null } | null
  const coachName  = p?.full_name ?? 'Votre coach'
  const coachPhoto = p?.brand_icon?.startsWith('http') ? p.brand_icon : null

  return (
    <OnboardingFlow
      clientId={client.id}
      token={token}
      initialName={client.full_name}
      coachName={coachName}
      coachPhoto={coachPhoto}
    />
  )
}
