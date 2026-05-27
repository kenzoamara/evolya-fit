import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  // Vérification du secret Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const weekAgoStr     = weekAgo.toISOString()
  const twoWeeksAgoStr = twoWeeksAgo.toISOString()
  const weekAgoDate    = weekAgo.toISOString().split('T')[0]

  // Récupérer tous les coachs actifs avec email
  const { data: coaches } = await admin
    .from('profiles')
    .select('id, full_name, email, plan')
    .eq('role', 'coach')
    .neq('suspended', true)
    .not('email', 'is', null)

  if (!coaches || coaches.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no coaches' })
  }

  let sent = 0
  const errors: string[] = []

  for (const coach of coaches) {
    if (!coach.email) continue

    try {
      // Membres de ce coach
      const { data: clients } = await admin
        .from('clients')
        .select('id, status, created_at')
        .eq('coach_id', coach.id)

      const activeClients = clients?.filter(c => c.status === 'active') ?? []
      if (activeClients.length === 0) continue // pas d'email si aucun membre

      const clientIds = activeClients.map(c => c.id)
      const newThisWeek = clients?.filter(c => new Date(c.created_at) >= weekAgo) ?? []

      // Check-ins reçus cette semaine
      const { count: checkinCount } = await admin
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .in('client_id', clientIds)
        .gte('submitted_at', weekAgoStr)

      // Séances planifiées cette semaine
      const { count: sessionCount } = await admin
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .in('client_id', clientIds)
        .gte('session_date', weekAgoDate)

      // Membres inactifs (pas de check-in depuis 14+ jours)
      const { data: inactiveData } = await admin
        .from('clients')
        .select('id')
        .eq('coach_id', coach.id)
        .eq('status', 'active')
        .or(`last_checkin_at.is.null,last_checkin_at.lt.${twoWeeksAgoStr}`)

      const inactiveCount = inactiveData?.length ?? 0

      const weekLabel = `${weekAgo.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
      const coachFirstName = coach.full_name?.split(' ')[0] ?? 'Coach'

      const { error: sendError } = await resend.emails.send({
        from: 'Evolya <noreply@evolya.fr>',
        to: coach.email,
        subject: `📊 Ton rapport de la semaine — ${weekLabel}`,
        html: buildWeeklyReportHtml({
          coachName: coachFirstName,
          weekLabel,
          activeCount:  activeClients.length,
          newCount:     newThisWeek.length,
          checkinCount: checkinCount ?? 0,
          sessionCount: sessionCount ?? 0,
          inactiveCount,
        }),
      })

      if (sendError) {
        errors.push(`${coach.email}: ${sendError.message}`)
      } else {
        sent++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`coach ${coach.id}: ${msg}`)
    }
  }

  console.log(`[cron/weekly-report] sent=${sent} errors=${errors.length}`, errors.slice(0, 3))
  return NextResponse.json({ ok: true, sent, errors: errors.slice(0, 5) })
}

/* ── Email HTML ─────────────────────────────────────────────── */

function statCell(emoji: string, value: string, label: string, color: string) {
  return `
    <td style="width:50%;padding:8px;">
      <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;color:#94A3B8;">${emoji} ${label}</p>
        <p style="margin:0;font-size:30px;font-weight:700;color:${color};line-height:1;">${value}</p>
      </div>
    </td>`
}

function buildWeeklyReportHtml({
  coachName,
  weekLabel,
  activeCount,
  newCount,
  checkinCount,
  sessionCount,
  inactiveCount,
}: {
  coachName:    string
  weekLabel:    string
  activeCount:  number
  newCount:     number
  checkinCount: number
  sessionCount: number
  inactiveCount: number
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'

  const inactiveBlock = inactiveCount > 0
    ? `
      <div style="margin:0 32px 24px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px 20px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#C2410C;">
          ⚠️ ${inactiveCount} membre${inactiveCount > 1 ? 's' : ''} sans check-in depuis 14+ jours
        </p>
        <p style="margin:0;font-size:12px;color:#92400E;line-height:1.5;">
          Pense à les relancer avant qu'ils décrachent complètement.
        </p>
      </div>`
    : `
      <div style="margin:0 32px 24px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#16A34A;">
          ✓ Tous tes membres sont restés actifs cette semaine
        </p>
      </div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#0D1F3C;padding:28px 32px;">
      <span style="color:#fff;font-weight:700;font-size:17px;letter-spacing:-0.3px;">Evolya</span>
      <p style="color:rgba(255,255,255,0.45);margin:6px 0 0;font-size:12px;">
        Rapport hebdomadaire · ${weekLabel}
      </p>
    </div>

    <!-- Greeting -->
    <div style="padding:32px 32px 20px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0D1F3C;">
        Bonjour ${coachName} 👋
      </h1>
      <p style="margin:0;color:#64748B;font-size:14px;line-height:1.6;">
        Voici un résumé de ton activité cette semaine.
      </p>
    </div>

    <!-- Stats -->
    <div style="padding:0 24px 8px;">
      <table style="width:100%;border-collapse:separate;border-spacing:0;">
        <tr>
          ${statCell('👥', String(activeCount),  'Membres actifs',      '#0D1F3C')}
          ${statCell('✅', String(checkinCount), 'Check-ins reçus',      '#4E9B6F')}
        </tr>
        <tr>
          ${statCell('⚡', String(sessionCount), 'Séances planifiées',   '#D97706')}
          ${statCell('🆕', String(newCount),     'Nouveaux membres',    '#3B82F6')}
        </tr>
      </table>
    </div>

    <!-- Alerte inactifs -->
    ${inactiveBlock}

    <!-- CTA -->
    <div style="padding:0 32px 32px;">
      <a href="${appUrl}/dashboard"
        style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;
               padding:13px 26px;border-radius:10px;font-size:14px;font-weight:600;">
        Voir mon tableau de bord →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFB;padding:16px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.5;">
        Tu reçois ce rapport chaque lundi matin.
        <a href="${appUrl}/parametres" style="color:#4E9B6F;text-decoration:none;">Gérer mes préférences</a>
      </p>
    </div>

  </div>
</body>
</html>`
}
