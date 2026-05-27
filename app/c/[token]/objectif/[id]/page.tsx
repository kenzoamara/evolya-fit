export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import { ExerciseClient } from './exercise-client'
import type { Objective } from '@/types/database'

export default async function ObjectifPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>
}) {
  const { token, id } = await params

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (!client) redirect(`/c/${token}`)

  const { data: objective } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', id)
    .eq('client_id', client.id)
    .single()

  if (!objective) notFound()

  return (
    <ExerciseClient
      objective={objective as Objective}
      token={token}
    />
  )
}
