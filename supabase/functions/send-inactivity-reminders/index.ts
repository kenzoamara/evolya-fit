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

    const now = new Date()
    const todayDow = now.getDay() // 0=Dim..6=Sam
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
    const cooldown24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id, full_name, email, magic_token, last_checkin_at, rest_days,
        profiles!clients_coach_id_fkey(full_name)
      `)
      .eq('status', 'active')

    if (error) throw error

    let sent = 0

    for (const client of clients ?? []) {
      const restDays: number[] = client.rest_days ?? []

      // Skip si aujourd'hui est un jour de repos
      if (restDays.includes(todayDow)) continue

      // Cooldown : email inactivity déjà envoyé dans les 24h ?
      const { data: recentLog } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('client_id', client.id)
        .eq('type', 'inactivity')
        .eq('channel', 'email')
        .gte('sent_at', cooldown24h)
        .maybeSingle()
      if (recentLog) continue

      // Dernière complétion d'objectif
      const { data: lastCompletion } = await supabase
        .from('daily_completions')
        .select('completed_date')
        .eq('client_id', client.id)
        .order('completed_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastCheckinTs = client.last_checkin_at ? new Date(client.last_checkin_at) : null
      const lastCompletionTs = lastCompletion
        ? new Date(lastCompletion.completed_date + 'T23:59:59Z')
        : null

      // Dernière activité = max(checkin, completion)
      let lastActivity: Date | null = null
      if (lastCheckinTs && lastCompletionTs) {
        lastActivity = lastCheckinTs > lastCompletionTs ? lastCheckinTs : lastCompletionTs
      } else {
        lastActivity = lastCheckinTs ?? lastCompletionTs
      }

      // Activité < 48h → pas de rappel
      if (lastActivity && lastActivity >= new Date(cutoff48h)) continue

      // Compter les jours non-repos écoulés depuis la dernière activité
      // (ou depuis 7 jours si jamais actif)
      const since = lastActivity ?? new Date(now.getTime() - 7 * 86400000)
      let nonRestDaysSince = 0
      const cursor = new Date(since)
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(0, 0, 0, 0)
      while (cursor <= now) {
        if (!restDays.includes(cursor.getDay())) nonRestDaysSince++
        cursor.setDate(cursor.getDate() + 1)
      }
      if (nonRestDaysSince < 2) continue // Pas encore 2 jours non-repos sans activité

      const coachName = (client as any).profiles?.full_name ?? 'Votre coach'
      const magicLink = `${APP_URL}/c/${client.magic_token}/dashboard`

      // Envoi email
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: client.email,
            subject: `On pense à toi — Reprends ton élan avec ${coachName}`,
            html: inactivityEmailHtml({ clientName: client.full_name, coachName, magicLink }),
          }),
        })
        await supabase.from('reminder_logs').insert({
          client_id: client.id,
          type: 'inactivity',
          channel: 'email',
        })
        sent++
        console.log(`[inactivity] email → ${client.email}`)
      } catch (e) {
        console.error(`[inactivity] email failed for ${client.id}:`, e)
      }

      // In-app : un seul rappel non-dismissed par type
      const { data: existing } = await supabase
        .from('client_reminders')
        .select('id')
        .eq('client_id', client.id)
        .eq('type', 'inactivity')
        .is('dismissed_at', null)
        .maybeSingle()

      if (!existing) {
        await supabase.from('client_reminders').insert({
          client_id: client.id,
          type: 'inactivity',
          title: 'On pense à toi 👋',
          message: "Pas d'activité depuis 2 jours. Un seul objectif aujourd'hui, c'est déjà une victoire.",
        })
        await supabase.from('reminder_logs').insert({
          client_id: client.id,
          type: 'inactivity',
          channel: 'in_app',
        })
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-inactivity-reminders]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function inactivityEmailHtml({
  clientName, coachName, magicLink,
}: { clientName: string; coachName: string; magicLink: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
    <div style="background:#4E9B6F;padding:20px 32px;">
      <span style="color:#fff;font-weight:600;font-size:15px;">Evolya</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">Bonjour ${clientName} 👋</h1>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        Ton coach <strong style="color:#0D1F3C;">${coachName}</strong> remarque que tu n'es pas passé depuis 2 jours.
        Ce n'est pas grave — chaque jour est une nouvelle occasion de reprendre.
      </p>
      <p style="margin:0 0 24px;color:#64748B;line-height:1.6;font-size:14px;">
        Un seul objectif aujourd'hui, c'est déjà une belle victoire.
      </p>
      <a href="${magicLink}" style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
        Reprendre mes objectifs →
      </a>
    </div>
    <div style="background:#F8FAFB;padding:12px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">Vous recevez cet email car votre coach souhaite vous accompagner · Evolya</p>
    </div>
  </div>
</body>
</html>`
}
