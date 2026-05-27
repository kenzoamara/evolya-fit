import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { confirmEmail } = await req.json()
  if (!confirmEmail) return NextResponse.json({ error: 'Email de confirmation requis.' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, stripe_subscription_id, plan_status')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

  if (profile.email !== confirmEmail) {
    return NextResponse.json({ error: 'L\'adresse email ne correspond pas.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Annuler l'abonnement Stripe actif
  if (profile.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      if (['active', 'trialing', 'past_due'].includes(sub.status)) {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      }
    } catch (e) {
      console.error('[account/delete] Stripe cancel error:', e)
    }
  }

  // Email de confirmation de suppression (avant suppression du compte)
  const emailTo = profile.email!
  const coachName = profile.full_name ?? 'Coach'
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Evolya <noreply@evolya.fr>',
      to: emailTo,
      subject: 'Votre compte Evolya a été supprimé',
      html: deletionEmailHtml(coachName),
    })
  } catch (e) {
    console.error('[account/delete] Email error:', e)
  }

  // Suppression du compte auth → cascade vers toutes les tables via FK
  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account/delete] deleteUser error:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
  }

  console.log(`[account/delete] Compte supprimé: ${emailTo}`)
  return NextResponse.json({ ok: true })
}

function deletionEmailHtml(name: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
    <div style="background:#0D1F3C;padding:20px 32px;">
      <span style="color:#fff;font-weight:600;font-size:15px;">Evolya</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">Votre compte a été supprimé</h1>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        Bonjour ${name},<br><br>
        Nous confirmons que votre compte Evolya ainsi que l'ensemble de vos données ont été définitivement supprimés, conformément à votre demande et au Règlement Général sur la Protection des Données (RGPD — Art. 17).
      </p>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        Les données supprimées incluent : votre profil, vos clients, vos programmes, vos séances, vos messages et toutes les données associées.
      </p>
      <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
        Si cette suppression n'était pas intentionnelle, contactez-nous à <a href="mailto:contact@evolya.fr" style="color:#4E9B6F;">contact@evolya.fr</a> dans les 48h — nous ne pouvons garantir une restauration mais ferons notre possible.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;color:#94A3B8;font-size:12px;">Merci d'avoir utilisé Evolya.</p>
    </div>
  </div>
</body>
</html>`
}
