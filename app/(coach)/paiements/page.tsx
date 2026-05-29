import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaiementsContent } from './paiements-content'
import type { Profile, PaymentOffer, Transaction } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function PaiementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: offers }, { data: transactions }] = await Promise.all([
    supabase.from('payment_offers').select('*').eq('coach_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*, client:clients(full_name)').eq('coach_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <PaiementsContent
      profile={profile as Profile}
      initialOffers={(offers ?? []) as PaymentOffer[]}
      transactions={(transactions ?? []) as Transaction[]}
    />
  )
}
