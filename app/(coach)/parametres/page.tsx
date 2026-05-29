import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ParametresContent } from './parametres-content'
import type { Profile } from '@/types/database'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Génère le code de parrainage si absent
  if (!profile.referral_code) {
    const code = 'EV-' + user.id.replace(/-/g, '').slice(0, 6).toUpperCase()
    await supabase.from('profiles').update({ referral_code: code } as never).eq('id', user.id)
    profile.referral_code = code
  }

  return <ParametresContent profile={profile as Profile} />
}
