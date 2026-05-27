import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlansContent } from './plans-content'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, client_limit')
    .eq('id', user.id)
    .single()

  return <PlansContent currentPlan={profile?.plan ?? 'free'} clientLimit={profile?.client_limit ?? 1} />
}
