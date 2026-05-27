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
    .select('full_name')
    .eq('id', client.coach_id)
    .single()

  const coachName = (profile as { full_name: string | null } | null)?.full_name ?? 'Votre coach'

  return (
    <OnboardingFlow
      clientId={client.id}
      token={token}
      initialName={client.full_name}
      coachName={coachName}
    />
  )
}
