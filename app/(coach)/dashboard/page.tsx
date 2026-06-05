import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardContent } from './dashboard-content'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const admin = createAdminClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const in7Days = new Date(today)
  in7Days.setDate(today.getDate() + 6)
  const in7DaysStr = in7Days.toISOString().split('T')[0]

  let clients: Parameters<typeof DashboardContent>[0]['clients'] = []
  let programmes: { id: string; title: string; created_at: string }[] = []
  let tasks: { id: string; title: string; completed: boolean; created_at: string }[] = []
  let upcomingSessions: {
    id: string
    session_date: string
    session_time: string | null
    client_id: string
    clients: { full_name: string }
  }[] = []
  let hasMessage = false

  try {
    const [r0, r1, r2, r3, r4] = await Promise.all([
      admin
        .from('clients')
        .select(`
          id, full_name, status, rest_days,
          objectives(*),
          checkins(*),
          sessions(id, session_date, session_time, created_at, attendance),
          programme_assignments(id, programme_id, start_date, active, programmes(id, title, duration_days))
        `)
        .eq('coach_id', user.id),
      admin
        .from('programmes')
        .select('id, title, created_at')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      admin
        .from('coach_tasks')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: true }),
      admin
        .from('sessions')
        .select('id, session_date, session_time, client_id, clients!inner(full_name, coach_id)')
        .eq('clients.coach_id', user.id)
        .gte('session_date', todayStr)
        .lte('session_date', in7DaysStr)
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true }),
      admin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .eq('sender_role', 'coach')
        .limit(1),
    ])
    clients = (r0.data ?? []) as unknown as typeof clients
    programmes = (r1.data ?? []) as typeof programmes
    tasks = (r2.data ?? []) as typeof tasks
    upcomingSessions = (r3.data ?? []) as unknown as typeof upcomingSessions
    hasMessage = (r4.count ?? 0) > 0
  } catch (err) {
    console.error('[dashboard] data fetch error:', err)
    throw err
  }

  return (
    <DashboardContent
      profile={profile as Profile}
      clients={clients}
      programmes={programmes}
      tasks={tasks}
      upcomingSessions={upcomingSessions}
      todayStr={todayStr}
      hasMessage={hasMessage}
    />
  )
}
