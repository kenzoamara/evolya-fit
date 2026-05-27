import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsContent } from './settings-content'
import type { Profile } from '@/types/database'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  return <SettingsContent profile={profile as Profile} />
}
