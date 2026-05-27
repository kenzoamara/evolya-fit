import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const coachId = user.id

  // Récupère toutes les données liées au coach en parallèle
  const [
    profile,
    clients,
    sessions,
    programmes,
    programmeDays,
    objectives,
    checkins,
    messages,
    coachEvents,
    coachTasks,
    habits,
    exercises,
    stripeEvents,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', coachId).single().then(r => r.data),
    admin.from('clients').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('sessions').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('programmes').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('programme_days').select('*').in(
      'programme_id',
      (await admin.from('programmes').select('id').eq('coach_id', coachId).then(r => (r.data ?? []).map((p: { id: string }) => p.id)))
    ).then(r => r.data ?? []),
    admin.from('objectives').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('checkins').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('messages').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('coach_events').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('coach_tasks').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('habits').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('exercises').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
    admin.from('stripe_events').select('*').eq('coach_id', coachId).then(r => r.data ?? []),
  ])

  // Sanitise le profil (retire les champs sensibles d'infra)
  const profileSanitized = profile ? {
    ...profile,
    stripe_customer_id: profile.stripe_customer_id ? '[masqué]' : null,
    stripe_subscription_id: profile.stripe_subscription_id ? '[masqué]' : null,
  } : null

  const exportData = {
    meta: {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      format_version: '1.0',
      rgpd_article: 'Art. 20 RGPD — Droit à la portabilité',
    },
    profile: profileSanitized,
    clients,
    sessions,
    programmes,
    programme_days: programmeDays,
    objectives,
    checkins,
    messages,
    coach_events: coachEvents,
    coach_tasks: coachTasks,
    habits,
    exercises,
    stripe_events: stripeEvents,
  }

  const filename = `evolya-export-${new Date().toISOString().slice(0, 10)}.json`
  const body = JSON.stringify(exportData, null, 2)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
