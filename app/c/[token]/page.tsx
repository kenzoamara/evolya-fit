import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function ClientRootPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = createAdminClient()
  const { data: client } = await supabase
    .from('clients')
    .select('auth_user_id, onboarding_completed_at')
    .eq('magic_token', token)
    .single()

  if (!client) {
    // Le layout gèrera le token invalide, on redirige vers dashboard pour déclencher ce check
    redirect(`/c/${token}/dashboard`)
  }

  // 1. Pas encore de compte → créer le mot de passe
  if (!client.auth_user_id) {
    redirect(`/c/${token}/create-account`)
  }

  // 2. Compte créé mais onboarding pas fait → onboarding
  if (!client.onboarding_completed_at) {
    redirect(`/c/${token}/onboarding`)
  }

  // 3. Tout est fait → dashboard
  redirect(`/c/${token}/dashboard`)
}
