export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CreateAccountForm } from './create-account-form'

export default async function CreateAccountPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, email, auth_user_id, onboarding_completed_at, coach_id')
    .eq('magic_token', token)
    .single()

  if (!client) redirect(`/c/${token}/dashboard`)

  // Compte déjà créé — rediriger vers la bonne étape
  if (client.auth_user_id) {
    redirect(client.onboarding_completed_at ? `/c/${token}/dashboard` : `/c/${token}/onboarding`)
  }

  const { data: coach } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', client.coach_id)
    .single()

  const p = coach as { full_name: string | null } | null
  const coachName  = p?.full_name ?? 'Votre coach'

  return (
    <CreateAccountForm
      token={token}
      clientName={client.full_name}
      email={client.email}
      coachName={coachName}
      onboardingDone={!!client.onboarding_completed_at}
    />
  )
}
