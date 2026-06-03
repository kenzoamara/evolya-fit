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
  let avails: any[] = []
  let requests: any[] = []

  try {
    const [r0, r1, r2, r3] = await Promise.all([
      admin
        .from('clients')
        .select('id, full_name, status, sessions(id, session_date, session_time, private_notes)')
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

      supabase
        .from('coach_availabilities')
        .select('*')
        .eq('coach_id', user.id)
        .order('day_of_week')
        .order('start_time'),

      admin
        .from('session_requests')
        .select('*, clients(full_name)')
        .eq('coach_id', user.id)
        .eq('status', 'pending')
        .order('requested_date'),
    ])
    clients  = r0.data ?? []
    events   = r1.data ?? []
    avails   = r2.data ?? []
    requests = r3.data ?? []
  } catch (err) {
    console.error('[agenda] data fetch error:', err)
  }

  // Vérifier si Google Calendar est connecté
  const { data: googleToken } = await admin
    .from('google_tokens')
    .select('id')
    .eq('coach_id', user.id)
    .maybeSingle()

  return (
    <AgendaContent
      profile={profile as Profile}
      clients={(clients ?? []) as any}
      events={events ?? []}
      initialAvails={avails}
      initialRequests={requests}
      isGoogleConnected={!!googleToken}
    />
  )
}
