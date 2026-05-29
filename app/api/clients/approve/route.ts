import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { getPlanLimits, isUnlimited } from '@/lib/plan-limits'

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'clientId requis.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan')
      .eq('id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

    const admin = createAdminClient()

    // Vérifier que la demande appartient bien à ce coach et est en attente
    const { data: client } = await admin
      .from('clients')
      .select('id, full_name, email, magic_token, coach_id, status')
      .eq('id', clientId)
      .single()

    if (!client || client.coach_id !== user.id) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }
    if (client.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande a déjà été traitée.' }, { status: 409 })
    }

    // Limite de plan (clients actifs)
    const limits = getPlanLimits(profile.plan)
    const { count } = await admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('status', 'active')

    if (!isUnlimited(limits.clients) && (count ?? 0) >= limits.clients) {
      return NextResponse.json({ error: `Limite de ${limits.clients} membres atteinte. Passe à un plan supérieur.` }, { status: 403 })
    }

    // Valider
    const { error: updateError } = await admin
      .from('clients')
      .update({ status: 'active' })
      .eq('id', clientId)
    if (updateError) return NextResponse.json({ error: 'Erreur lors de la validation.' }, { status: 500 })

    // Email de bienvenue avec le lien magique (si email réel)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
    const magicLink = `${appUrl}/c/${client.magic_token}/dashboard`
    if (client.email && !client.email.includes('@evolya.internal')) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const coachName = profile.full_name ?? 'Votre coach'
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Evolyafit <noreply@evolyafit.fr>',
          to: client.email,
          subject: `${coachName} a validé ta demande`,
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <p style="font-size:15px;color:#0D1F3C;">Bonjour ${client.full_name},</p>
            <p style="font-size:14px;color:#475569;line-height:1.6;"><strong>${coachName}</strong> a validé ta demande. Ton espace de suivi personnalisé est prêt.</p>
            <a href="${magicLink}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#4E9B6F;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Accéder à mon espace</a>
            <p style="margin-top:16px;font-size:11px;color:#94A3B8;word-break:break-all;">Ou copie ce lien : ${magicLink}</p>
          </div>`,
        })
      } catch (e) {
        console.error('[clients/approve] email (non-blocking):', e)
      }
    }

    return NextResponse.json({ success: true, magicLink, hasEmail: !!client.email && !client.email.includes('@evolya.internal') })
  } catch (err) {
    console.error('[clients/approve]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
