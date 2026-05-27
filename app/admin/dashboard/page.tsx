import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardAdminContent } from './dashboard-admin-content'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const MRR_MAP: Record<string, number> = { trial: 0, starter: 19, standard: 49 }

  // Coaches actifs
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, full_name, email, plan, plan_status, created_at, suspended')
    .eq('role', 'coach')
    .order('created_at', { ascending: false })

  const activeCoaches = (coaches ?? []).filter(c => !c.suspended && c.plan_status === 'active')
  const mrr = activeCoaches.reduce((acc, c) => acc + (MRR_MAP[c.plan] ?? 0), 0)

  // Nouveaux coaches (7 derniers jours)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const newCoaches = (coaches ?? []).filter(c => c.created_at > sevenDaysAgo).length

  // Tickets ouverts
  const { count: openTickets } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  // Inscriptions 30 derniers jours (pour graphique)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: recentCoaches } = await supabase
    .from('profiles')
    .select('created_at, plan')
    .eq('role', 'coach')
    .gt('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  // Feed activité récente (30 derniers events)
  const { data: recentActivity } = await supabase
    .from('profiles')
    .select('id, full_name, plan, created_at')
    .eq('role', 'coach')
    .order('created_at', { ascending: false })
    .limit(15)

  const { data: recentTickets } = await supabase
    .from('support_tickets')
    .select('id, subject, created_at, coach_id, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardAdminContent
      totalCoaches={(coaches ?? []).length}
      activeCoaches={activeCoaches.length}
      mrr={mrr}
      newCoaches={newCoaches}
      openTickets={openTickets ?? 0}
      recentCoaches={(recentCoaches ?? []) as { created_at: string; plan: string }[]}
      recentActivity={(recentActivity ?? []) as { id: string; full_name: string | null; plan: string; created_at: string }[]}
      recentTickets={(recentTickets ?? []) as unknown as { id: string; subject: string; created_at: string; profiles: { full_name: string | null } | null }[]}
    />
  )
}
