import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsContent } from './clients-content'
import type { Profile, Client, Objective, Checkin, Session } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('*, objectives(*), checkins(*), sessions(*)')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  const params = await searchParams
  const upgraded = params.upgraded === '1'

  return (
    <ClientsContent
      profile={profile as Profile}
      clients={(clients ?? []) as (Client & { objectives: Objective[]; checkins: Checkin[]; sessions: Session[] })[]}
      upgraded={upgraded}
    />
  )
}
