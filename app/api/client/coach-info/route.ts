import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET ?token= — infos coach visibles par le client (formulaire dispo, etc.)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ hasIntakeForm: false })

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) return NextResponse.json({ hasIntakeForm: false })

  // Vérifier si le coach a un formulaire actif
  const { data: form } = await admin
    .from('intake_forms')
    .select('id')
    .eq('coach_id', client.coach_id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  // Vérifier si le client a déjà répondu
  let alreadyAnswered = false
  if (form) {
    const { data: existing } = await admin
      .from('intake_responses')
      .select('id')
      .eq('client_id', client.id)
      .eq('form_id', form.id)
      .maybeSingle()
    alreadyAnswered = !!existing
  }

  return NextResponse.json({
    hasIntakeForm: !!form && !alreadyAnswered,
  })
}
