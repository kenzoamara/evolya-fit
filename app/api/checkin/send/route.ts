import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { clientId, weekNumber, year, q1, q2, q3 } = await req.json()

    if (!clientId || !weekNumber || !year) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    // Vérifier la fenêtre de soumission : samedi 8h00 → dimanche 23h59
    const now = new Date()
    const dow = now.getDay() // 0=Dim, 6=Sam
    const hour = now.getHours()
    const inWindow = (dow === 6 && hour >= 8) || dow === 0
    if (!inWindow) {
      return NextResponse.json({ error: 'Le check-in est disponible uniquement du samedi 8h au dimanche 23h59.' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Vérifier que le client existe
    const { data: client } = await adminClient
      .from('clients')
      .select('*, profiles!clients_coach_id_fkey(full_name, email)')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })
    }

    // Vérifier si un check-in existe déjà cette semaine
    const { data: existing } = await adminClient
      .from('checkins')
      .select('id')
      .eq('client_id', clientId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Check-in déjà soumis cette semaine.' }, { status: 409 })
    }

    // Insérer le check-in
    const { error: insertError } = await adminClient.from('checkins').insert({
      client_id: clientId,
      week_number: weekNumber,
      year,
      q1_answer: q1 || null,
      q2_answer: q2 || null,
      q3_answer: q3 || null,
      energy_score: null,
    })

    if (insertError) {
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
    }

    // Mettre à jour last_checkin_at du client
    await adminClient
      .from('clients')
      .update({ last_checkin_at: new Date().toISOString() })
      .eq('id', clientId)

    // Notifier le coach par email
    const coachProfile = (client as any).profiles
    if (coachProfile?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const clientLink = `${appUrl}/clients/${clientId}`

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'Evolya <noreply@evolya.fr>',
        to: coachProfile.email,
        subject: `${client.full_name} vient de compléter son check-in`,
        html: checkinNotifHtml({
          clientName: client.full_name,
          q1, q2, q3,
          clientLink,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[checkin/send]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

function checkinNotifHtml({
  clientName, q1, q2, q3, clientLink
}: {
  clientName: string
  q1?: string; q2?: string; q3?: string
  clientLink: string
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
    <div style="background:#4E9B6F;padding:20px 32px;">
      <span style="color:#fff;font-weight:600;font-size:15px;">Evolya</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">
        ${clientName} vient de compléter son check-in
      </h1>

      <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:20px;">
        ${q1 ? `<div style="margin-bottom:12px;"><p style="margin:0 0 4px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">💬 Ressenti de la semaine</p><p style="margin:0;font-size:13px;color:#0D1F3C;">${q1}</p></div>` : ''}
        ${q2 ? `<div style="margin-bottom:12px;"><p style="margin:0 0 4px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">🎯 Progression & accomplissements</p><p style="margin:0;font-size:13px;color:#0D1F3C;">${q2}</p></div>` : ''}
        ${q3 ? `<div><p style="margin:0 0 4px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">🚧 Blocages & attentes</p><p style="margin:0;font-size:13px;color:#0D1F3C;">${q3}</p></div>` : ''}
      </div>

      <a href="${clientLink}" style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;">
        Voir l'espace de ${clientName} →
      </a>
    </div>
  </div>
</body>
</html>`
}
