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
    const todayDow = now.getDay()

    // Date du jour Paris (UTC+1, approximation stable)
    const parisNow = new Date(now.getTime() + 60 * 60 * 1000)
    const todayStr = `${parisNow.getFullYear()}-${String(parisNow.getMonth() + 1).padStart(2, '0')}-${String(parisNow.getDate()).padStart(2, '0')}`

    // Cooldown : aujourd'hui déjà envoyé ? (18h glissantes)
    const cooldown18h = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString()

    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id, full_name, email, magic_token, rest_days,
        profiles!clients_coach_id_fkey(full_name)
      `)
      .eq('status', 'active')

    if (error) throw error

    let sent = 0

    for (const client of clients ?? []) {
      const restDays: number[] = client.rest_days ?? []

      // Skip si aujourd'hui est un jour de repos
      if (restDays.includes(todayDow)) continue

      // Le client a-t-il des objectifs actifs ?
      const { count: activeObjectives } = await supabase
        .from('objectives')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .in('status', ['todo', 'in_progress'])
      if (!activeObjectives || activeObjectives === 0) continue

      // Le client a-t-il déjà coché au moins un objectif aujourd'hui ?
      const { count: todayCompletions } = await supabase
        .from('daily_completions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('completed_date', todayStr)
      if (todayCompletions && todayCompletions > 0) continue

      // Cooldown 18h (évite le spam)
      const { data: recentLog } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('client_id', client.id)
        .eq('type', 'daily')
        .eq('channel', 'email')
        .gte('sent_at', cooldown18h)
        .maybeSingle()
      if (recentLog) continue

      const coachName = (client as any).profiles?.full_name ?? 'Votre coach'
      const magicLink = `${APP_URL}/c/${client.magic_token}/progression`

      // Envoi email (léger, ton soft)
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
            subject: 'Tes objectifs du jour t\'attendent ✨',
            html: dailyReminderEmailHtml({ clientName: client.full_name, coachName, magicLink }),
          }),
        })
        await supabase.from('reminder_logs').insert({
          client_id: client.id,
          type: 'daily',
          channel: 'email',
        })
        sent++
        console.log(`[daily] email → ${client.email}`)
      } catch (e) {
        console.error(`[daily] email failed for ${client.id}:`, e)
      }

      // In-app : message discret (remplace s'il y en avait un vieux non-dismissed)
      // On supprime l'ancien et on recrée pour avoir un message frais daté d'aujourd'hui
      await supabase
        .from('client_reminders')
        .delete()
        .eq('client_id', client.id)
        .eq('type', 'daily')
        .is('dismissed_at', null)

      await supabase.from('client_reminders').insert({
        client_id: client.id,
        type: 'daily',
        title: 'Objectifs du jour ✨',
        message: 'Prends 2 minutes pour cocher ce que tu as accompli aujourd\'hui.',
      })
      await supabase.from('reminder_logs').insert({
        client_id: client.id,
        type: 'daily',
        channel: 'in_app',
      })
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-daily-reminders]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function dailyReminderEmailHtml({
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
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">Bonsoir ${clientName} ✨</h1>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        La journée se termine — as-tu coché tes objectifs du jour ?
        Même un seul accompli, c'est une journée bien terminée.
      </p>
      <p style="margin:0 0 24px;color:#64748B;line-height:1.6;font-size:14px;">
        <strong style="color:#0D1F3C;">${coachName}</strong> suit ta progression et se réjouit de tes avancées.
      </p>
      <a href="${magicLink}" style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
        Cocher mes objectifs →
      </a>
    </div>
    <div style="background:#F8FAFB;padding:12px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">Rappel quotidien · Evolya</p>
    </div>
  </div>
</body>
</html>`
}
