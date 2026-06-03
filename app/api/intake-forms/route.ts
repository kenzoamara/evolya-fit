import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — formulaire actif du coach (ou du coach d'un client via ?coachId=)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const coachId = searchParams.get('coachId')
  const admin = createAdminClient()

  if (coachId) {
    // Lecture publique pour le client
    const { data: form } = await admin
      .from('intake_forms')
      .select('id, title, intake_questions(id, question, type, options, required, position)')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!form) return NextResponse.json({ form: null })

    const questions = ((form as any).intake_questions ?? [])
      .sort((a: any, b: any) => a.position - b.position)

    return NextResponse.json({ form: { ...form, questions } })
  }

  // Coach lit son propre formulaire
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: form } = await supabase
    .from('intake_forms')
    .select('id, title, is_active, intake_questions(id, question, type, options, required, position)')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!form) return NextResponse.json({ form: null })

  const questions = ((form as any).intake_questions ?? [])
    .sort((a: any, b: any) => a.position - b.position)

  return NextResponse.json({ form: { ...form, questions } })
}

// POST — créer ou remplacer le formulaire du coach
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { title, questions } = await req.json()
  const admin = createAdminClient()

  // Désactiver les anciens formulaires
  await admin.from('intake_forms').update({ is_active: false } as never).eq('coach_id', user.id)

  // Créer le nouveau formulaire
  const { data: form, error } = await admin
    .from('intake_forms')
    .insert({ coach_id: user.id, title: title?.trim() || 'Formulaire d\'accueil' } as never)
    .select('id')
    .single()

  if (error || !form) return NextResponse.json({ error: 'Erreur création.' }, { status: 500 })

  // Insérer les questions
  if (questions?.length) {
    const rows = questions.map((q: any, i: number) => ({
      form_id:  form.id,
      question: q.question,
      type:     q.type ?? 'text',
      options:  q.options ?? null,
      required: q.required ?? false,
      position: i,
    }))
    await admin.from('intake_questions').insert(rows as never)
  }

  return NextResponse.json({ success: true, formId: form.id })
}

// DELETE — désactiver le formulaire
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const admin = createAdminClient()
  await admin.from('intake_forms').update({ is_active: false } as never).eq('coach_id', user.id)

  return NextResponse.json({ success: true })
}
