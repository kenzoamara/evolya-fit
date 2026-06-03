import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST — client soumet ses réponses (via magic token)
export async function POST(req: Request) {
  const { token, formId, answers } = await req.json()
  if (!token || !formId || !answers) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

  await admin.from('intake_responses').upsert({
    client_id:    client.id,
    form_id:      formId,
    answers,
    completed_at: now,
  } as never, { onConflict: 'client_id,form_id' })

  return NextResponse.json({ success: true })
}

// GET — coach lit les réponses d'un client
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId requis.' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const admin = createAdminClient()

  const { data } = await admin
    .from('intake_responses')
    .select('answers, completed_at, form_id, intake_forms(title, intake_questions(id, question, type, position))')
    .eq('client_id', clientId)
    .maybeSingle()

  return NextResponse.json({ response: data ?? null })
}
