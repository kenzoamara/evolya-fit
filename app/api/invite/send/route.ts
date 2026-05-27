import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { clientName, clientEmail } = await req.json()

    if (!clientName) {
      return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
    }
    // Email optionnel — on génère un placeholder si absent
    const resolvedEmail = clientEmail?.trim() || `client_${crypto.randomUUID().slice(0, 8)}@evolya.internal`

    // Récupérer le coach connecté
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, client_limit')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })
    }

    // Vérifier la limite clients
    const adminClient = createAdminClient()
    const { count } = await adminClient
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('status', 'active')

    if (profile.client_limit !== 9999 && (count ?? 0) >= profile.client_limit) {
      return NextResponse.json({
        error: `Limite de ${profile.client_limit} clients atteinte. Passez au plan Standard.`
      }, { status: 403 })
    }

    // Générer le magic token (accès permanent du client à son espace)
    const newMagicToken = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 10 * 365 * 86400000).toISOString()

    // Créer le client en base
    const { data: newClient, error: insertError } = await adminClient
      .from('clients')
      .insert({
        coach_id: user.id,
        full_name: clientName,
        email: resolvedEmail,
        status: 'active',
        magic_token: newMagicToken,
        token_expires_at: tokenExpiresAt,
      })
      .select()
      .single()

    if (insertError || !newClient) {
      console.error('[invite/send] DB insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création du client.' }, { status: 500 })
    }

    // Envoyer l'email d'invitation — non bloquant (Resend peut échouer sans casser le flux)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const magicLink = `${appUrl}/c/${newMagicToken}/dashboard`
    const coachName = profile.full_name ?? 'Votre coach'

    if (clientEmail?.trim() && !resolvedEmail.includes('@evolya.internal')) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Evolyafit <noreply@evolyafit.fr>',
          to: resolvedEmail,
          subject: `${coachName} a créé votre espace de coaching`,
          html: invitationEmailHtml({ clientName, coachName, magicLink }),
          headers: {
            'List-Unsubscribe': '<mailto:contact@evolyafit.fr>',
            'X-Entity-Ref-ID': newClient.id,
          },
        })
      } catch (emailErr) {
        console.error('[invite/send] Email error (non-blocking):', emailErr)
      }
    }

    return NextResponse.json({ success: true, clientId: newClient.id, magicLink })
  } catch (err) {
    console.error('[invite/send]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

function invitationEmailHtml({
  clientName, coachName, magicLink
}: {
  clientName: string
  coachName: string
  magicLink: string
}) {
  const initial = coachName.charAt(0).toUpperCase()
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Votre espace de coaching</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <span style="font-family:Arial Black,Arial,sans-serif;font-size:28px;font-weight:900;color:#0D1F3C;letter-spacing:-0.5px;">Evolyafit</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#ffffff" style="background:#ffffff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">

              <!-- Card header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#0D1F3C" style="background:#0D1F3C;padding:28px 32px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#4E9B6F;letter-spacing:2px;text-transform:uppercase;">Votre coach vous invite</p>
                    <h1 style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;line-height:1.3;">Bonjour ${clientName},</h1>
                  </td>
                </tr>
              </table>

              <!-- Card body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <!-- Coach info -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                      <tr>
                        <td width="40" height="40" bgcolor="#4E9B6F" style="background:#4E9B6F;border-radius:20px;text-align:center;vertical-align:middle;width:40px;height:40px;">
                          <span style="color:#ffffff;font-weight:bold;font-size:16px;line-height:40px;">${initial}</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <p style="margin:0;font-size:13px;font-weight:bold;color:#0D1F3C;">${coachName}</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#94A3B8;">Votre coach personnel</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 28px;color:#475569;line-height:1.7;font-size:14px;">
                      <strong style="color:#0D1F3C;">${coachName}</strong> a créé votre espace de suivi personnalisé. Vous y retrouverez vos programmes, objectifs et votre progression en temps réel.
                    </p>

                    <!-- CTA button — compatible Outlook + tous clients -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#4E9B6F" style="border-radius:8px;background:#4E9B6F;">
                          <a href="${magicLink}" target="_blank" style="display:inline-block;padding:14px 32px;background:#4E9B6F;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">Acceder a mon espace</a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;" /></td>
                </tr>
              </table>

              <!-- Footer card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:20px 32px 24px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p style="margin:0;font-size:11px;color:#4E9B6F;word-break:break-all;">${magicLink}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom note + footer légal RGPD -->
          <tr>
            <td align="center" style="padding:20px 0 0;">
              <p style="margin:0 0 10px;font-size:11px;color:#64748B;line-height:1.7;">Ce lien est personnel — ne le partagez pas. Il vous donne un acces permanent a votre espace.<br>Evolyafit — coaching sportif personnalise</p>
              <p style="margin:0;font-size:10px;color:#94A3B8;line-height:1.6;">
                Vous recevez cet email car votre coach vous a invité(e) sur Evolyafit.<br>
                Vos données sont traitées conformément à notre <a href="https://www.evolyafit.fr/politique-confidentialite" style="color:#94A3B8;text-decoration:underline;">politique de confidentialité</a>.<br>
                Pour exercer votre droit d'opposition ou de suppression, contactez : <a href="mailto:contact@evolyafit.fr" style="color:#94A3B8;text-decoration:underline;">contact@evolyafit.fr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
