import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

function buildOnboardingUpdate(body: Record<string, string | boolean | undefined>, includeComplete: boolean): Record<string, unknown> {
  const { firstName, lastName, birthDate, gender, heightCm, weightKg, mainGoal, activityLevel, injuries, dietaryHabits, avgSleepHours, sportPerformances, dailyCalories, parqCardiac, parqInjuries, parqMedical } = body
  const update: Record<string, unknown> = {}
  const fullName = [String(firstName ?? '').trim(), String(lastName ?? '').trim()].filter(Boolean).join(' ')
  if (fullName)                          update.full_name                = fullName
  if (birthDate)                         update.birth_date               = birthDate
  if (gender)                            update.gender                   = gender
  if (heightCm)                          update.height_cm                = parseInt(String(heightCm), 10)
  if (weightKg)                          update.weight_kg                = parseFloat(String(weightKg))
  if (mainGoal)                          update.main_goal                = mainGoal
  if (activityLevel)                     update.activity_level           = activityLevel
  if (String(injuries ?? '').trim())     update.injuries                 = String(injuries).trim()
  if (String(dietaryHabits ?? '').trim()) update.dietary_habits          = String(dietaryHabits).trim()
  if (avgSleepHours)                     update.avg_sleep_hours          = parseFloat(String(avgSleepHours))
  if (String(sportPerformances ?? '').trim()) update.sport_performances  = String(sportPerformances).trim()
  if (dailyCalories)                     update.daily_calories_estimated = parseInt(String(dailyCalories), 10)
  if (parqCardiac  !== undefined)        update.parq_cardiac             = parqCardiac  === 'yes' || parqCardiac  === true
  if (parqInjuries !== undefined)        update.parq_injuries            = parqInjuries === 'yes' || parqInjuries === true
  if (parqMedical  !== undefined)        update.parq_medical             = parqMedical  === 'yes' || parqMedical  === true
  if (includeComplete)                   update.onboarding_completed_at  = new Date().toISOString()
  return update
}

/* Partial save — called after each step, does NOT complete onboarding */
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { token } = body
    if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
    const admin = createAdminClient()
    const { data: client, error } = await admin
      .from('clients').select('id')
      .eq('magic_token', token).gt('token_expires_at', new Date().toISOString()).single()
    if (error || !client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
    const update = buildOnboardingUpdate(body, false)
    if (Object.keys(update).length === 0) return NextResponse.json({ success: true })
    const { error: updateError } = await admin.from('clients').update(update as never).eq('id', client.id)
    if (updateError) return NextResponse.json({ error: 'Erreur sauvegarde.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 }) }
}

function parsePerformances(text: string): { label: string; value: number; unit: string }[] {
  const entries: { label: string; value: number; unit: string }[] = []
  const lines = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
  const pattern = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|g|km|m|min|s|rep|reps|%)?$/i
  for (const line of lines) {
    const match = line.match(pattern)
    if (!match) continue
    const label = match[1].trim()
    const value = parseFloat(match[2].replace(',', '.'))
    const unit  = match[3]?.toLowerCase() ?? 'kg'
    if (label && !isNaN(value)) entries.push({ label, value, unit })
  }
  return entries
}

/* Final submit — saves everything and marks onboarding as completed */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, sportPerformances, privacyAccepted } = body
    if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
    const admin = createAdminClient()
    const { data: client, error } = await admin
      .from('clients').select('id')
      .eq('magic_token', token).gt('token_expires_at', new Date().toISOString()).single()
    if (error || !client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
    const update = buildOnboardingUpdate(body, true)
    if (privacyAccepted === true) {
      (update as Record<string, unknown>).privacy_accepted_at = new Date().toISOString()
    }
    const { error: updateError } = await admin.from('clients').update(update as never).eq('id', client.id)
    if (updateError) {
      console.error('[onboarding] update error:', updateError.message)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
    }

    // Convertir sportPerformances texte libre → performance_entries structurées
    if (sportPerformances?.trim()) {
      const parsed = parsePerformances(sportPerformances)
      if (parsed.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        await admin.from('performance_entries').insert(
          parsed.map(p => ({
            client_id: client.id,
            date: today,
            label: p.label,
            value: p.value,
            unit: p.unit,
          }))
        )
      }
    }

    // ── Email de confirmation post-onboarding (non-bloquant) ──────────────
    try {
      const { data: fullClient } = await admin
        .from('clients')
        .select('full_name, email, coach_id')
        .eq('id', client.id)
        .single()

      if (fullClient?.email && !fullClient.email.includes('@evolya.internal')) {
        const { data: coachProfile } = await admin
          .from('profiles')
          .select('full_name')
          .eq('id', fullClient.coach_id)
          .single()

        const coachName = (coachProfile as { full_name: string | null } | null)?.full_name ?? 'Votre coach'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
        const dashboardLink = `${appUrl}/c/${token}/dashboard`

        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Evolyafit <noreply@evolyafit.fr>',
          to: fullClient.email,
          subject: `Votre profil est prêt — ${coachName} prépare votre programme`,
          html: onboardingCompleteEmailHtml({
            clientName: fullClient.full_name ?? 'vous',
            coachName,
            dashboardLink,
          }),
        })
      }
    } catch (emailErr) {
      console.error('[onboarding] email error (non-blocking):', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

function onboardingCompleteEmailHtml({ clientName, coachName, dashboardLink }: { clientName: string; coachName: string; dashboardLink: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Votre profil est prêt</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td align="center" style="padding:0 0 24px;">
          <span style="font-family:Arial Black,Arial,sans-serif;font-size:26px;font-weight:900;color:#0D1F3C;letter-spacing:-0.5px;">Evolyafit</span>
        </td></tr>

        <tr><td bgcolor="#ffffff" style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td bgcolor="#4E9B6F" style="background:#4E9B6F;padding:28px 32px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Profil complété</p>
              <h1 style="margin:0;font-size:22px;font-weight:bold;color:#fff;line-height:1.3;">Votre espace est prêt, ${clientName} !</h1>
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:28px 32px;">

              <p style="margin:0 0 20px;color:#475569;line-height:1.7;font-size:14px;">
                Votre profil de coaching a bien été enregistré. <strong style="color:#0D1F3C;">${coachName}</strong> a été notifié et prépare votre programme personnalisé.
              </p>

              <!-- Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  ['1', 'Consultez votre programme', 'Disponible dans votre espace sous "Entraînement"'],
                  ['2', 'Faites votre premier check-in', 'Chaque semaine, 2 min pour tenir votre coach informé'],
                  ['3', 'Suivez votre progression', 'Graphiques et stats dans la section Progrès'],
                ].map(([n, title, sub]) => `
                <tr><td style="padding:0 0 14px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28" height="28" bgcolor="#EEF9F3" style="background:#EEF9F3;border-radius:14px;text-align:center;vertical-align:middle;width:28px;height:28px;">
                        <span style="color:#4E9B6F;font-weight:bold;font-size:13px;">${n}</span>
                      </td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <p style="margin:0;font-size:13px;font-weight:bold;color:#0D1F3C;">${title}</p>
                        <p style="margin:2px 0 0;font-size:12px;color:#94A3B8;">${sub}</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>`).join('')}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td bgcolor="#4E9B6F" style="border-radius:8px;">
                  <a href="${dashboardLink}" style="display:inline-block;padding:14px 32px;background:#4E9B6F;color:#fff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:8px;">Accéder à mon espace →</a>
                </td></tr>
              </table>

            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;"/></td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:18px 32px 24px;">
              <p style="margin:0;font-size:11px;color:#94A3B8;">Lien direct : <span style="color:#4E9B6F;word-break:break-all;">${dashboardLink}</span></p>
            </td></tr>
          </table>

        </td></tr>

        <tr><td align="center" style="padding:20px 0 0;">
          <p style="margin:0;font-size:10px;color:#94A3B8;line-height:1.6;">
            Evolyafit — coaching sportif personnalisé<br>
            <a href="https://www.evolyafit.fr/politique-confidentialite" style="color:#94A3B8;">Politique de confidentialité</a> · <a href="mailto:contact@evolyafit.fr" style="color:#94A3B8;">contact@evolyafit.fr</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
