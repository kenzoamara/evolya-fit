import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NouveautesContent } from './nouveautes-content'
import type { Profile, RoadmapItem, Suggestion, Vote } from '@/types/database'

export const revalidate = 60

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

  const { data: roadmapItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const { data: suggestions } = await supabase
    .from('suggestions')
    .select('*')
    .in('status', ['approved', 'planned'])
    .order('vote_count', { ascending: false })

  const { data: myVotes } = await supabase
    .from('votes')
    .select('item_id, suggestion_id')
    .eq('coach_id', user.id)

  return (
    <NouveautesContent
      profile={profile as Profile}
      roadmapItems={(roadmapItems ?? []) as RoadmapItem[]}
      suggestions={(suggestions ?? []) as Suggestion[]}
      myVotes={(myVotes ?? []) as Pick<Vote, 'item_id' | 'suggestion_id'>[]}
    />
  )
}
