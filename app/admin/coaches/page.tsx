import { createAdminClient } from '@/lib/supabase/admin'
import { CoachesAdminContent } from './coaches-admin-content'

export const revalidate = 0

export default async function AdminCoachesPage() {
  const supabase = createAdminClient()

  const { data: coaches } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'coach')
    .order('created_at', { ascending: false })

  // Nombre de clients par coach
  const { data: clientCounts } = await supabase
    .from('clients')
    .select('coach_id')
    .eq('status', 'active')

  const countMap: Record<string, number> = {}
  ;(clientCounts ?? []).forEach(c => {
    countMap[c.coach_id] = (countMap[c.coach_id] ?? 0) + 1
  })

  const enriched = (coaches ?? []).map(c => ({
    ...c,
    activeClients: countMap[c.id] ?? 0,
    mrr: c.plan === 'standard' ? 49 : c.plan === 'starter' ? 19 : 0,
  }))

  return <CoachesAdminContent coaches={enriched} />
}
