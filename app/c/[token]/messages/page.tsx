import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ClientMessages } from './client-messages'

export default async function ClientMessagesPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, coach_id')
    .eq('magic_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (!client) redirect(`/c/${token}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', client.coach_id)
    .single()

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: true })

  // Marquer messages coach comme lus
  await supabase.from('messages').update({ read_by_client: true })
    .eq('client_id', client.id)
    .eq('sender_role', 'coach')
    .eq('read_by_client', false)

  return (
    <ClientMessages
      clientId={client.id}
      clientName={client.full_name}
      coachName={(profile as any)?.full_name ?? 'Votre coach'}
      token={token}
      initialMessages={initialMessages ?? []}
    />
  )
}
