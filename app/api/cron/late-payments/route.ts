import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

type LatePayment = {
  id: string
  client_id: string
  amount: number
  currency: string
  due_date: string
  notes: string | null
  clients: { full_name: string } | { full_name: string }[] | null
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr)
  const now = new Date()
  return Math.floor((now.getTime() - due.getTime()) / 86400000)
}

function palier(days: number): 'j3' | 'j7' | 'j14' {
  if (days >= 14) return 'j14'
  if (days >= 7)  return 'j7'
  return 'j3'
}

function clientName(p: LatePayment): string {
  if (!p.clients) return 'Membre inconnu'
  if (Array.isArray(p.clients)) return p.clients[0]?.full_name ?? 'Membre inconnu'
  return p.clients.full_name
}

function fmtAmount(amount: number): string {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function GET(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = getTodayStr()

  // Récupérer tous les paiements en retard (pas payés, date dépassée)
  const { data: latePayments, error } = await admin
    .from('client_payments')
    .select('id, client_id, coach_id, amount, currency, due_date, notes, clients(full_name)')
    .is('paid_date', null)
    .lt('due_date', today)

  if (error) {
    console.error('[cron/late-payments] query error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!latePayments || latePayments.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no late payments' })
  }

  // Grouper par coach
  const byCoach: Record<string, { payments: typeof latePayments; coachId: string }> = {}
  for (const p of latePayments) {
    if (!p.coach_id) continue
    if (!byCoach[p.coach_id]) byCoach[p.coach_id] = { payments: [], coachId: p.coach_id }
    byCoach[p.coach_id].payments.push(p)
  }

  // Récupérer les profils des coachs concernés
  const coachIds = Object.keys(byCoach)
  const { data: coaches } = await admin
    .from('profiles')
    .select('id, full_name, email, suspended')
    .in('id', coachIds)
    .neq('suspended', true)
    .not('email', 'is', null)

  if (!coaches || coaches.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no eligible coaches' })
  }

  let sent = 0
  const errors: string[] = []

  for (const coach of coaches) {
    if (!coach.email) continue
    const { payments } = byCoach[coach.id] ?? { payments: [] }
    if (payments.length === 0) continue

    const coachFirstName = coach.full_name?.split(' ')[0] ?? 'Coach'

    // Enrichir avec jours de retard
    const enriched = payments.map(p => ({
      ...p,
      days: daysOverdue(p.due_date),
      palier: palier(daysOverdue(p.due_date)),
      name: clientName(p as LatePayment),
    }))

    const j3 = enriched.filter(p => p.palier === 'j3')
    const j7 = enriched.filter(p => p.palier === 'j7')
    const j14 = enriched.filter(p => p.palier === 'j14')

    // Total impayé
    const totalAmount = enriched.reduce((acc, p) => acc + p.amount, 0)

    const { error: sendError } = await resend.emails.send({
      from: 'Evolya <noreply@evolya.fr>',
      to: coach.email,
      subject: buildSubject(enriched.length, totalAmount),
      html: buildLatePaymentsHtml({
        coachName: coachFirstName,
        j3,
        j7,
        j14,
        totalAmount,
      }),
    })

    if (sendError) {
      errors.push(`${coach.email}: ${sendError.message}`)
    } else {
      sent++
    }
  }

  console.log(`[cron/late-payments] sent=${sent} errors=${errors.length}`, errors.slice(0, 3))
  return NextResponse.json({ ok: true, sent, errors: errors.slice(0, 5) })
}

/* ── Helpers ─────────────────────────────────────────────────── */

function buildSubject(count: number, total: number): string {
  const totalStr = total.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  if (count === 1) return `Rappel : 1 paiement en retard (${totalStr} €)`
  return `Rappel : ${count} paiements en retard (${totalStr} € total)`
}

type EnrichedPayment = {
  id: string
  amount: number
  due_date: string
  days: number
  name: string
}

function paymentRow(p: EnrichedPayment, urgency: 'low' | 'medium' | 'high'): string {
  const colors = {
    low:    { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', badge: '#EA580C' },
    medium: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', badge: '#DC2626' },
    high:   { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', badge: '#BE123C' },
  }
  const c = colors[urgency]
  const dayLabel = p.days === 1 ? '1 jour' : `${p.days} jours`

  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0D1F3C;">${p.name}</p>
            <p style="margin:0;font-size:12px;color:#94A3B8;">Échéance : ${fmtDate(p.due_date)}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0D1F3C;">${fmtAmount(p.amount)}</p>
            <span style="background:${c.bg};border:1px solid ${c.border};color:${c.badge};
                         padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">
              +${dayLabel}
            </span>
          </div>
        </div>
      </td>
    </tr>`
}

function buildSection(title: string, subtitle: string, payments: EnrichedPayment[], urgency: 'low' | 'medium' | 'high'): string {
  if (payments.length === 0) return ''
  return `
    <div style="margin:0 32px 20px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0D1F3C;">${title}</p>
      <p style="margin:0 0 12px;font-size:12px;color:#94A3B8;">${subtitle}</p>
      <table style="width:100%;border-collapse:collapse;">
        ${payments.map(p => paymentRow(p, urgency)).join('')}
      </table>
    </div>`
}

function buildLatePaymentsHtml({
  coachName,
  j3,
  j7,
  j14,
  totalAmount,
}: {
  coachName: string
  j3: EnrichedPayment[]
  j7: EnrichedPayment[]
  j14: EnrichedPayment[]
  totalAmount: number
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
  const total = fmtAmount(totalAmount)
  const count = j3.length + j7.length + j14.length

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
        Rappel paiements · ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 32px 16px;">
      <h1 style="margin:0 0 8px;font-size:19px;font-weight:600;color:#0D1F3C;">
        Bonjour ${coachName},
      </h1>
      <p style="margin:0;color:#64748B;font-size:14px;line-height:1.6;">
        Tu as <strong style="color:#0D1F3C;">${count} paiement${count > 1 ? 's' : ''} en retard</strong>
        pour un total de <strong style="color:#DC2626;">${total}</strong>.
      </p>
    </div>

    <!-- Sections par palier -->
    ${buildSection(
      'Retard modéré — J+3 à J+6',
      'Premier rappel à envoyer à ton membre.',
      j3,
      'low'
    )}
    ${buildSection(
      'Retard significatif — J+7 à J+13',
      'Relance ferme recommandée.',
      j7,
      'medium'
    )}
    ${buildSection(
      'Retard critique — J+14 et plus',
      'Action urgente requise.',
      j14,
      'high'
    )}

    <!-- CTA -->
    <div style="padding:8px 32px 32px;">
      <a href="${appUrl}/business"
        style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;
               padding:13px 26px;border-radius:10px;font-size:14px;font-weight:600;">
        Gérer les paiements →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFB;padding:16px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.5;">
        Tu reçois cet email car des paiements sont en retard dans ton espace Evolya.
        <a href="${appUrl}/parametres" style="color:#4E9B6F;text-decoration:none;">Gérer mes préférences</a>
      </p>
    </div>

  </div>
</body>
</html>`
}
