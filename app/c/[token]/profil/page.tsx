import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ClientProfil } from './client-profil'
import type { Client } from '@/types/database'

export default async function ClientProfilPage({
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

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, coaching_type, brand_icon')
    .eq('id', client.coach_id)
    .single()

  const coachPhoto = (profile as any)?.brand_icon?.startsWith('http') ? (profile as any).brand_icon : null

  return (
    <ClientProfil
      client={client as Client}
      coachName={(profile as any)?.full_name ?? 'Votre coach'}
      coachingType={(profile as any)?.coaching_type ?? null}
      coachPhoto={coachPhoto}
    />
  )
}
