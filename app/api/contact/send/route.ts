import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { prenom, nom, email, sujet, message } = await req.json()

  if (!prenom?.trim() || !nom?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Sauvegarde en base
  const { error: dbError } = await admin.from('contact_messages').insert({
    prenom: prenom.trim(),
    nom: nom.trim(),
    email: email.trim(),
    sujet: sujet?.trim() || 'Sans sujet',
    message: message.trim(),
    read: false,
  })

  if (dbError) {
    console.error('contact insert error:', dbError)
    return NextResponse.json({ error: 'Erreur base de données.' }, { status: 500 })
  }

  // Notification email
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Evolya <noreply@evolya.fr>',
      to: 'contact.evolya.pro@gmail.com',
      subject: `[Contact] ${sujet || 'Nouvelle question'} — ${prenom} ${nom}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0D1F3C">
          <h2 style="margin-bottom:4px">Nouveau message de contact</h2>
          <p style="color:#6B7280;margin-top:0">Reçu via le formulaire Evolya</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#6B7280;width:100px">Nom</td><td style="padding:6px 0;font-weight:600">${prenom} ${nom}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Email</td><td style="padding:6px 0"><a href="mailto:${email}" style="color:#4E9B6F">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Sujet</td><td style="padding:6px 0">${sujet || '—'}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
          <p style="white-space:pre-wrap;color:#374151;line-height:1.6">${message}</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
          <p style="font-size:12px;color:#9CA3AF">Voir dans l'admin → /admin/contact</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('resend error:', e)
    // Ne bloque pas — le message est déjà en base
  }

  return NextResponse.json({ ok: true })
}
