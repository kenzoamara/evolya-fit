export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientBilanView } from './client-bilan-view'
import type { Bilan } from '@/types/database'

export default async function BilanPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date().toISOString()
  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, coach_id')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) return null

  const admin = createAdminClient()

  const [{ data: bilans }, { data: coachProfile }] = await Promise.all([
    admin
      .from('bilans')
      .select('*')
      .eq('client_id', client.id)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(5),
    admin
      .from('profiles')
      .select('full_name')
      .eq('id', client.coach_id)
      .single(),
  ])

  const coachName = (coachProfile as { full_name: string | null } | null)?.full_name ?? 'Votre coach'

  return (
    <ClientBilanView
      clientName={client.full_name}
      coachName={coachName}
      bilans={(bilans ?? []) as Bilan[]}
    />
  )
}
