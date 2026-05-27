import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RoadmapAdminContent } from './roadmap-admin-content'
import type { RoadmapItem, Suggestion } from '@/types/database'

export const revalidate = 0

export default async function AdminRoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Vérifier que l'utilisateur est admin (on sa propre ligne, RLS OK)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/app')

  const adminClient = createAdminClient()

  // Tous les items roadmap (publiés + brouillons)
  const { data: roadmapItems } = await adminClient
    .from('roadmap_items')
    .select('*')
    .order('created_at', { ascending: false })

  // Toutes les suggestions
  const { data: suggestions } = await adminClient
    .from('suggestions')
    .select('*')
    .order('created_at', { ascending: false })

  // Analytics : votes totaux ce mois
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: votesThisMonth } = await adminClient
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', startOfMonth.toISOString())

  const { count: suggestionsThisMonth } = await adminClient
    .from('suggestions')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', startOfMonth.toISOString())

  return (
    <RoadmapAdminContent
      adminName={profile.full_name ?? 'Admin'}
      roadmapItems={(roadmapItems ?? []) as RoadmapItem[]}
      suggestions={(suggestions ?? []) as Suggestion[]}
      votesThisMonth={votesThisMonth ?? 0}
      suggestionsThisMonth={suggestionsThisMonth ?? 0}
    />
  )
}
