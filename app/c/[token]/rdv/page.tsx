export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { RdvClient } from './rdv-client'

export default async function RdvPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id, full_name')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client || !client.coach_id) redirect(`/c/${token}/dashboard`)

  const coachId = client.coach_id as string

  // Disponibilités du coach
  const { data: avails, error: availsError } = await admin
    .from('coach_availabilities')
    .select('*')
    .eq('coach_id', coachId)
    .order('day_of_week')
    .order('start_time')

  if (availsError) {
    console.error('[rdv/page] avails error:', availsError.message, '| coach_id:', coachId)
  }

  // Demandes existantes du client (resilient si table manquante)
  let existingRequests: { requested_date: string; requested_time: string; status: string }[] = []
  try {
    const { data } = await admin
      .from('session_requests')
      .select('requested_date, requested_time, status')
      .eq('client_id', client.id)
      .in('status', ['pending', 'confirmed'])
    existingRequests = data ?? []
  } catch {
    // table pas encore créée — ignore
  }

  return (
    <RdvClient
      token={token}
      availabilities={avails ?? []}
      existingRequests={existingRequests}
    />
  )
}
