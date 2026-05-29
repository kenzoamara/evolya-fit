import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { coachId, firstName, lastName, email } = await req.json()

    if (!coachId || !firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Prénom et nom requis.' }, { status: 400 })
    }

    const resolvedEmail = email?.trim().toLowerCase() ?? ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      return NextResponse.json({ error: 'Un email valide est requis pour recevoir ton accès.' }, { status: 400 })
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`

    const admin = createAdminClient()

    // Vérifier que le coach existe
    const { data: coach } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('id', coachId)
      .eq('role', 'coach')
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach introuvable.' }, { status: 404 })
    }

    // Dédupe : éviter une 2e demande avec le même email pour ce coach
    const { data: existing } = await admin
      .from('clients')
      .select('id, status')
      .eq('coach_id', coachId)
      .eq('email', resolvedEmail)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ success: true, alreadyPending: true })
      }
      return NextResponse.json({ error: 'Tu fais déjà partie des membres de ce coach.' }, { status: 409 })
    }

    // Créer la demande (status pending) avec son magic token permanent
    const magicToken = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 10 * 365 * 86400000).toISOString()

    const { error: insertError } = await admin
      .from('clients')
      .insert({
        coach_id: coachId,
        full_name: fullName,
        email: resolvedEmail,
        status: 'pending',
        magic_token: magicToken,
        token_expires_at: tokenExpiresAt,
      })

    if (insertError) {
      console.error('[join/request] insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de la demande.' }, { status: 500 })
    }

    // Notifier le coach (email non bloquant)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data: coachProfile } = await admin
        .from('profiles')
        .select('email')
        .eq('id', coachId)
        .single()
      const coachEmail = (coachProfile as { email: string | null } | null)?.email
      if (coachEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Evolyafit <noreply@evolyafit.fr>',
          to: coachEmail,
          subject: `Nouvelle demande de ${fullName}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <p style="font-size:15px;color:#0D1F3C;"><strong>${fullName}</strong> souhaite rejoindre ton coaching.</p>
            <p style="font-size:13px;color:#64748B;">Retrouve la demande dans l'onglet <strong>Demandes reçues</strong> de ton espace.</p>
            <a href="${appUrl}/clients" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#4E9B6F;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Voir la demande</a>
          </div>`,
        })
      }
    } catch (e) {
      console.error('[join/request] email (non-blocking):', e)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[join/request]', err)
    return NextResponse.json({ error: 'Erreur serveur. Réessaie.' }, { status: 500 })
  }
}
