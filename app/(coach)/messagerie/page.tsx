import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessagesContent } from '../messages/messages-content'
import { PlanGate } from '@/components/ui/plan-gate'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function MessageriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const typedProfile = profile as Profile

  if (!['starter', 'growth', 'pro'].includes(typedProfile.plan ?? '')) {
    return (
      <PlanGate featureKey="messagerie" userPlan={typedProfile.plan} fullPage>
        <div />
      </PlanGate>
    )
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, email, status, last_seen')
    .eq('coach_id', user.id)
    .eq('status', 'active')
    .order('full_name', { ascending: true })

  const admin = createAdminClient()
  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <MessagesContent
      profile={typedProfile}
      clients={clients ?? []}
      initialMessages={messages ?? []}
    />
  )
}
