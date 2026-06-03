import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { fullName, email, password, coachingType, referralCode, marketingConsent, cguAccepted, privacyAccepted, brandColorPrimary, brandColorAccent, brandFont, brandIcon } = await req.json()

    if (!fullName || !email || !password || !coachingType) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caracteres.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Cree l'utilisateur avec email deja confirme (bypass email confirmation)
    const { data: { user }, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, coaching_type: coachingType },
    })

    if (createError) {
      const msg = createError.message.includes('already registered') || createError.message.includes('already been registered')
        ? 'Un compte existe deja avec cet email.'
        : createError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }

    // Generer un code referral unique (prefix EV-)
    const code = 'EV-' + user.id.replace(/-/g, '').slice(0, 6).toUpperCase()

    const now = new Date()
    // Trial standard : 14 jours
    const trialEndsAt = new Date(now.getTime() + 14 * 86400000).toISOString()

    // Mettre a jour le profil (le trigger SQL l'a deja cree)
    const consentAt = new Date().toISOString()
    await admin
      .from('profiles')
      .update({
        full_name: fullName,
        coaching_type: coachingType,
        referral_code: code,
        trial_ends_at: trialEndsAt,
        marketing_consent: marketingConsent === true,
        marketing_consent_at: marketingConsent === true ? consentAt : null,
        cgu_accepted_at: cguAccepted === true ? consentAt : null,
        privacy_accepted_at: privacyAccepted === true ? consentAt : null,
        ...(brandColorPrimary ? { brand_color_primary: brandColorPrimary } : {}),
        ...(brandColorAccent ? { brand_color_accent: brandColorAccent } : {}),
        ...(brandFont ? { brand_font: brandFont } : {}),
        ...(brandIcon ? { brand_icon: brandIcon } : {}),
      } as never)
      .eq('id', user.id)

    // Appliquer le parrainage si code fourni
    if (referralCode && referralCode.trim()) {
      const code_clean = referralCode.trim().toUpperCase()

      const { data: referrer } = await admin
        .from('profiles')
        .select('id, trial_ends_at, referral_count')
        .eq('referral_code', code_clean)
        .single()

      if (referrer && referrer.id !== user.id) {
        // Filleul : +7 jours d'essai supplementaires (21j total)
        const filleulEnd = new Date(now.getTime() + 21 * 86400000)

        await admin.from('profiles').update({
          referred_by: code_clean,
          trial_ends_at: filleulEnd.toISOString(),
        }).eq('id', user.id)
        // Le parrain est recompense au PREMIER PAIEMENT du filleul (voir webhook invoice.payment_succeeded)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/auth/signup]', err)
    return NextResponse.json({ error: 'Erreur serveur. Reessayez.' }, { status: 500 })
  }
}
