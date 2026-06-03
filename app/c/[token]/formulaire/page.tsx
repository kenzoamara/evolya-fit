export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { IntakeForm } from './intake-form'

export default async function FormulairePage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id, full_name')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) redirect(`/c/${token}/dashboard`)

  // Formulaire du coach
  const { data: form } = await admin
    .from('intake_forms')
    .select('id, title, intake_questions(id, question, type, options, required, position)')
    .eq('coach_id', client.coach_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!form) redirect(`/c/${token}/dashboard`)

  // Déjà rempli ?
  const { data: existing } = await admin
    .from('intake_responses')
    .select('id')
    .eq('client_id', client.id)
    .eq('form_id', form.id)
    .maybeSingle()

  if (existing) redirect(`/c/${token}/dashboard`)

  const questions = ((form as any).intake_questions ?? [])
    .sort((a: any, b: any) => a.position - b.position)

  return (
    <IntakeForm
      token={token}
      formId={form.id}
      formTitle={(form as any).title}
      questions={questions}
      clientName={client.full_name}
    />
  )
}
