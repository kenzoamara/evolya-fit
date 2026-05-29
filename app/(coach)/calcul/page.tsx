import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanGate } from '@/components/ui/plan-gate'
import { CalcContent } from './calcul-content'

export default async function CalcPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const userPlan = (profile?.plan ?? 'free') as string

  return (
    <PlanGate featureKey="calculatrice" userPlan={userPlan} fullPage>
      <CalcContent />
    </PlanGate>
  )
}
