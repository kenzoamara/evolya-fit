import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://evolya.vercel.app'
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Evolya <noreply@evolya.fr>'

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Trouver les clients actifs sans check-in depuis 7 jours
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, full_name, email, magic_token, profiles!clients_coach_id_fkey(full_name)')
      .eq('status', 'active')
      .or(`last_checkin_at.is.null,last_checkin_at.lt.${sevenDaysAgo}`)

    if (error) throw error

    console.log(`[send-weekly-checkins] ${clients?.length ?? 0} clients à notifier`)

    let sent = 0
    for (const client of clients ?? []) {
      const coachName = (client as any).profiles?.full_name ?? 'Votre coach'
      const magicLink = `${APP_URL}/c/${client.magic_token}#checkin`

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: client.email,
            subject: `Check-in de la semaine — ${coachName} vous attend`,
            html: weeklyCheckinEmailHtml({ clientName: client.full_name, coachName, magicLink }),
          }),
        })

        console.log(`[send-weekly-checkins] Email envoyé à ${client.email} (${client.id})`)
        sent++
      } catch (emailErr) {
        console.error(`[send-weekly-checkins] Échec email ${client.id}:`, emailErr)
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-weekly-checkins] Erreur:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function weeklyCheckinEmailHtml({
  clientName, coachName, magicLink
}: {
  clientName: string
  coachName: string
  magicLink: string
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
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">Bonjour ${clientName} 👋</h1>
      <p style="margin:0 0 20px;color:#64748B;line-height:1.6;font-size:14px;">
        C'est l'heure du check-in hebdomadaire ! <strong style="color:#0D1F3C;">${coachName}</strong> attend votre retour sur cette semaine.
      </p>

      <div style="background:#F8FAFB;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:500;color:#0D1F3C;">3 questions rapides :</p>
        <ol style="margin:0;padding-left:16px;color:#64748B;font-size:13px;line-height:1.8;">
          <li>Comment s'est passée ta semaine ?</li>
          <li>As-tu avancé sur tes objectifs ?</li>
          <li>Qu'est-ce qui t'a bloqué ou ralenti ?</li>
        </ol>
      </div>

      <a href="${magicLink}" style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
        Répondre en 60 secondes →
      </a>
    </div>
    <div style="background:#F8FAFB;padding:12px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">Envoyé par Evolya · Chaque lundi matin</p>
    </div>
  </div>
</body>
</html>`
}
