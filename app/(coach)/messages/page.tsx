import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessagesContent } from './messages-content'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
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
    .select('id, full_name, email, status, last_seen')
    .eq('coach_id', user.id)
    .eq('status', 'active')
    .order('full_name', { ascending: true })

  const admin = createAdminClient()
  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <MessagesContent
      profile={profile as Profile}
      clients={clients ?? []}
      initialMessages={messages ?? []}
    />
  )
}
