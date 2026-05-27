import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://evolya.vercel.app'
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Evolya <noreply@evolya.fr>'

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    const todayDow = now.getDay()
    const cooldown24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

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

      // Cooldown : email streak_fail déjà envoyé dans les 24h ?
      const { data: recentLog } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('client_id', client.id)
        .eq('type', 'streak_fail')
        .eq('channel', 'email')
        .gte('sent_at', cooldown24h)
        .maybeSingle()
      if (recentLog) continue

      // Le client a-t-il des objectifs actifs ?
      const { count: activeObjectives } = await supabase
        .from('objectives')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .in('status', ['todo', 'in_progress'])
      if (!activeObjectives || activeObjectives === 0) continue

      // Trouver les 3 derniers jours non-repos (en remontant)
      const nonRestDays: Date[] = []
      const cursor = new Date(now)
      cursor.setHours(23, 59, 59, 999)
      // On ne compte pas aujourd'hui (incomplet), on remonte
      cursor.setDate(cursor.getDate() - 1)
      while (nonRestDays.length < 3) {
        if (!restDays.includes(cursor.getDay())) {
          nonRestDays.push(new Date(cursor))
        }
        cursor.setDate(cursor.getDate() - 1)
        if (nonRestDays.length >= 30) break // sécurité boucle infinie si trop de jours repos
      }

      if (nonRestDays.length < 3) continue // Pas assez d'historique

      // Vérifier que ces 3 jours ont tous 0 complétion
      const dateStrings = nonRestDays.map(toDateStr)
      const { data: completions } = await supabase
        .from('daily_completions')
        .select('completed_date')
        .eq('client_id', client.id)
        .in('completed_date', dateStrings)

      const hasCompletion = (completions ?? []).length > 0
      if (hasCompletion) continue // Au moins un jour a eu une complétion → pas de rappel

      const coachName = (client as any).profiles?.full_name ?? 'Votre coach'
      const magicLink = `${APP_URL}/c/${client.magic_token}/messages`

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
            subject: `3 jours sans objectifs complétés — ${coachName} est là pour toi`,
            html: streakFailEmailHtml({ clientName: client.full_name, coachName, magicLink }),
          }),
        })
        await supabase.from('reminder_logs').insert({
          client_id: client.id,
          type: 'streak_fail',
          channel: 'email',
        })
        sent++
        console.log(`[streak_fail] email → ${client.email}`)
      } catch (e) {
        console.error(`[streak_fail] email failed for ${client.id}:`, e)
      }

      // In-app
      const { data: existing } = await supabase
        .from('client_reminders')
        .select('id')
        .eq('client_id', client.id)
        .eq('type', 'streak_fail')
        .is('dismissed_at', null)
        .maybeSingle()

      if (!existing) {
        await supabase.from('client_reminders').insert({
          client_id: client.id,
          type: 'streak_fail',
          title: 'Ensemble on va y arriver 💪',
          message: '3 jours sans objectifs complétés. Parle-en à ton coach, il est là pour adapter ton programme.',
        })
        await supabase.from('reminder_logs').insert({
          client_id: client.id,
          type: 'streak_fail',
          channel: 'in_app',
        })
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-streak-reminders]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function streakFailEmailHtml({
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
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">Bonjour ${clientName} 💙</h1>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        Ces 3 derniers jours ont été difficiles — et c'est tout à fait normal. Le coaching, c'est justement ça :
        avancer ensemble même quand c'est compliqué.
      </p>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        <strong style="color:#0D1F3C;">${coachName}</strong> est disponible si tu veux lui expliquer ce qui bloque.
        Peut-être que certains objectifs méritent d'être ajustés — aucune honte à ça.
      </p>
      <a href="${magicLink}" style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
        En parler à mon coach →
      </a>
    </div>
    <div style="background:#F8FAFB;padding:12px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">Envoyé avec bienveillance · Evolya</p>
    </div>
  </div>
</body>
</html>`
}
