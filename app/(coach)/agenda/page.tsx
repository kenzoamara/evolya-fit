import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AgendaContent } from './agenda-content'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/auth/login')

  const admin = createAdminClient()

  const rangeStart = new Date()
  rangeStart.setMonth(rangeStart.getMonth() - 1)
  const rangeEnd = new Date()
  rangeEnd.setMonth(rangeEnd.getMonth() + 6)

  let clients: any[] = []
  let events: any[] = []

  try {
    const [r0, r1] = await Promise.all([
      admin
        .from('clients')
        .select('id, full_name, status, sessions(id, session_date, session_time)')
        .eq('coach_id', user.id)
        .eq('status', 'active')
        .order('full_name', { ascending: true }),

      supabase
        .from('coach_events')
        .select('id, title, event_date, start_time, end_time')
        .eq('coach_id', user.id)
        .gte('event_date', rangeStart.toISOString().split('T')[0])
        .lte('event_date', rangeEnd.toISOString().split('T')[0])
        .order('event_date', { ascending: true }),
    ])
    clients = r0.data ?? []
    events = r1.data ?? []
  } catch (err) {
    console.error('[agenda] data fetch error:', err)
  }

  return (
    <AgendaContent
      profile={profile as Profile}
      clients={(clients ?? []) as any}
      events={events ?? []}
    />
  )
}
