import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ClientNotesView } from './client-notes-view'
import type { Client } from '@/types/database'

export default async function ClientNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { token } = await params
  const sp = await searchParams
  const coachView = sp.coach === '1'
  const supabase = createAdminClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('magic_token', token)
    .single()

  if (!client) redirect(`/c/${token}`)

  let query = supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', client.id)
    .neq('author_role', 'coach')   // masquer les notes privées du coach
    .order('created_at', { ascending: false })

  // En mode spectateur (coach), cacher aussi les notes privées du client
  if (coachView) query = query.eq('is_private', false)

  const { data: notes } = await query

  return (
    <ClientNotesView
      client={client as Client}
      notes={notes ?? []}
      coachView={coachView}
    />
  )
}
