import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuggestionsContent } from './suggestions-content'
import type { Profile, RoadmapItem, Suggestion, Vote } from '@/types/database'

export const revalidate = 0

export default async function NouveautesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Roadmap items publiés
  const { data: roadmapItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Suggestions visibles avec nom du coach auteur
  const { data: suggestions } = await supabase
    .from('suggestions')
    .select('*, coach:profiles!suggestions_coach_id_fkey(full_name)')
    .order('vote_count', { ascending: false })

  // Mes votes
  const { data: myVotes } = await supabase
    .from('votes')
    .select('item_id, suggestion_id, vote_type')
    .eq('coach_id', user.id)

  // Mise à jour last_visited_roadmap
  await supabase
    .from('profiles')
    .update({ last_visited_roadmap: new Date().toISOString() })
    .eq('id', user.id)

  return (
    <SuggestionsContent
      profile={profile as Profile}
      roadmapItems={(roadmapItems ?? []) as RoadmapItem[]}
      suggestions={(suggestions ?? []) as Suggestion[]}
      myVotes={(myVotes ?? []) as Pick<Vote, 'item_id' | 'suggestion_id' | 'vote_type'>[]}
    />
  )
}
