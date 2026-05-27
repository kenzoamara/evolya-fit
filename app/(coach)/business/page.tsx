import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessContent } from './business-content'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function BusinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, status, created_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return <BusinessContent profile={profile as Profile} clients={clients ?? []} />
}
