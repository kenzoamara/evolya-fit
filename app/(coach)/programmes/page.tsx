import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgrammesContent } from './programmes-content'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ProgrammesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: clients }, { data: programmes }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('programmes')
      .select('id, title, type, description, status, start_date, end_date, duration_days, created_at, programme_clients(client_id, clients(full_name))')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ProgrammesContent
      profile={profile as Profile}
      clients={clients ?? []}
      programmes={(programmes ?? []) as unknown as Parameters<typeof ProgrammesContent>[0]['programmes']}
    />
  )
}
