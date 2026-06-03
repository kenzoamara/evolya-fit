import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DisponibilitesContent } from './disponibilites-content'

export default async function DisponibilitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: avails } = await supabase
    .from('coach_availabilities')
    .select('*')
    .eq('coach_id', user.id)
    .order('day_of_week')
    .order('start_time')

  const { data: requests } = await supabase
    .from('session_requests')
    .select('*, clients(full_name)')
    .eq('coach_id', user.id)
    .eq('status', 'pending')
    .order('requested_date')

  return (
    <DisponibilitesContent
      initialAvails={avails ?? []}
      initialRequests={requests ?? []}
    />
  )
}
