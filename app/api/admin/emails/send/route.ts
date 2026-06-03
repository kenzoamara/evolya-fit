import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const PLAN_MRR: Record<string, number> = { starter: 19, standard: 49 }

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { subject, body, recipients, scheduleAt } = await req.json()
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })

  const admin = createAdminClient()

  // If scheduled, just save to DB
  if (scheduleAt) {
    const { data: record, error } = await admin.from('email_scheduled').insert({
      subject,
      body,
      recipients: { type: recipients },
      scheduled_at: scheduleAt,
      status: 'scheduled',
      created_by: user.id,
      sent_count: 0,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, record })
  }

  // Fetch target coaches
  let query = admin.from('profiles').select('id, full_name, email, plan').eq('role', 'coach').neq('suspended', true)
  // Filtre générique : "plan:<valeur>" cible les coachs de ce plan (trial/starter/growth/pro…)
  if (typeof recipients === 'string' && recipients.startsWith('plan:')) {
    query = query.eq('plan', recipients.slice(5))
  }

  const { data: coaches } = await query
  if (!coaches || coaches.length === 0) {
    return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
  }

  // Send emails via Resend
  let sentCount = 0
  const errors: string[] = []

  for (const coach of coaches) {
    if (!coach.email) continue
    const personalizedBody = body
      .replace(/{prenom}/g, coach.full_name?.split(' ')[0] ?? 'Coach')
      .replace(/{email}/g, coach.email)
      .replace(/{plan}/g, coach.plan)

    const { error: sendError } = await resend.emails.send({
      from: 'Evolya <noreply@evolya.fr>',
      to: coach.email,
      subject,
      text: personalizedBody,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0D1F3C;">${personalizedBody.replace(/\n/g, '<br/>')}</div>`,
    })

    if (sendError) {
      errors.push(`${coach.email}: ${sendError.message}`)
    } else {
      sentCount++
    }
  }

  // Save to history
  const { data: record } = await admin.from('email_scheduled').insert({
    subject,
    body,
    recipients: { type: recipients },
    sent_at: new Date().toISOString(),
    sent_count: sentCount,
    status: errors.length === 0 ? 'sent' : sentCount > 0 ? 'sent' : 'failed',
    created_by: user.id,
  }).select().single()

  await admin.from('audit_logs').insert({
    admin_id: user.id,
    action: 'email_sent',
    target_type: 'broadcast',
    target_id: null,
    payload: { subject, recipients, sent: sentCount, errors: errors.slice(0, 5) },
  })

  return NextResponse.json({ ok: true, sent: sentCount, record })
}
