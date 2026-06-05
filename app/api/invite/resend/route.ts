import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const adminClient = createAdminClient()
    const { data: client, error: lookupError } = await adminClient
      .from('clients')
      .select('id, full_name, email, magic_token')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (lookupError || !client) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const magicLink = `${appUrl}/c/${client.magic_token}`
    const coachName = profile?.full_name ?? 'Votre coach'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Evolyafit <noreply@evolyafit.fr>',
      to: client.email,
      subject: `Votre lien d'acces Evolyafit`,
      html: reinviteEmailHtml({ clientName: client.full_name, coachName, magicLink }),
      headers: {
        'List-Unsubscribe': '<mailto:contact@evolyafit.fr>',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[invite/resend]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

function reinviteEmailHtml({
  clientName, coachName, magicLink
}: {
  clientName: string
  coachName: string
  magicLink: string
}) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Votre lien d'acces Evolyafit</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <span style="font-family:Arial Black,Arial,sans-serif;font-size:28px;font-weight:900;color:#0D1F3C;">Evolyafit</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#ffffff" style="background:#ffffff;border-radius:12px;border:1px solid #E2E8F0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#0D1F3C;font-family:Arial,sans-serif;">Bonjour ${clientName},</h1>
                    <p style="margin:0 0 24px;color:#64748B;line-height:1.6;font-size:14px;font-family:Arial,sans-serif;">
                      <strong style="color:#0D1F3C;">${coachName}</strong> vous a renvoyé votre lien d'acces a votre espace de suivi personnalise.
                    </p>

                    <!-- CTA button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#4E9B6F" style="border-radius:8px;background:#4E9B6F;">
                          <a href="${magicLink}" target="_blank" style="display:inline-block;padding:13px 28px;background:#4E9B6F;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">Creer mon compte</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;font-family:Arial,sans-serif;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#4E9B6F;word-break:break-all;font-family:Arial,sans-serif;">${magicLink}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#F8FAFB" style="background:#F8FAFB;padding:16px 32px;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px;">
                    <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;font-family:Arial,sans-serif;">Ce lien est personnel — ne le partagez pas. Evolyafit — coaching sportif personnalise.</p>
                    <p style="margin:0;font-size:10px;color:#94A3B8;line-height:1.6;font-family:Arial,sans-serif;">
                      Vous recevez cet email car votre coach vous a invité(e) sur Evolyafit.
                      Vos données sont traitées conformément à notre <a href="https://www.evolyafit.fr/politique-confidentialite" style="color:#94A3B8;text-decoration:underline;font-family:Arial,sans-serif;">politique de confidentialité</a>.
                      Pour exercer votre droit d'opposition ou de suppression : <a href="mailto:contact@evolyafit.fr" style="color:#94A3B8;text-decoration:underline;font-family:Arial,sans-serif;">contact@evolyafit.fr</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
