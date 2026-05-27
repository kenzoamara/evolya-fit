import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PersonnalisationContent } from './personnalisation-content'
import type { Profile } from '@/types/database'

export default async function PersonnalisationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  return <PersonnalisationContent profile={profile as Profile} />
}
