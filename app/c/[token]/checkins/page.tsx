import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { ClientCheckinsView } from './client-checkins-view'
import type { Client, Checkin } from '@/types/database'

export default async function ClientCheckinsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('magic_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (!client) redirect(`/c/${token}`)

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })
    .limit(52)

  return (
    <ClientCheckinsView
      client={client as Client}
      checkins={(checkins ?? []) as Checkin[]}
    />
  )
}
