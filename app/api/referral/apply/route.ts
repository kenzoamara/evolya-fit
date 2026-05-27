import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { referralCode } = await req.json()
    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'Code invalide.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const admin = createAdminClient()

    // Vérifier que le nouvel inscrit n'a pas déjà un parrain
    const { data: myProfile } = await admin
      .from('profiles')
      .select('id, referred_by, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (!myProfile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })
    if (myProfile.referred_by) return NextResponse.json({ error: 'Parrainage déjà appliqué.' }, { status: 400 })

    // Trouver le parrain par son code
    const { data: referrer } = await admin
      .from('profiles')
      .select('id, trial_ends_at, referral_count')
      .eq('referral_code', referralCode.toUpperCase().trim())
      .single()

    if (!referrer) return NextResponse.json({ error: 'Code de parrainage introuvable.' }, { status: 404 })
    if (referrer.id === user.id) return NextResponse.json({ error: 'Vous ne pouvez pas vous parrainer vous-même.' }, { status: 400 })

    const now = new Date()

    // Filleul : +30 jours offerts
    const myCurrentEnd = myProfile.trial_ends_at ? new Date(myProfile.trial_ends_at) : now
    const myNewEnd = new Date(Math.max(myCurrentEnd.getTime(), now.getTime()))
    myNewEnd.setDate(myNewEnd.getDate() + 30)

    // Parrain : -50% sur son prochain renouvellement Stripe
    await Promise.all([
      admin.from('profiles').update({
        referred_by: referralCode.toUpperCase().trim(),
        trial_ends_at: myNewEnd.toISOString(),
      }).eq('id', user.id),

      admin.from('profiles').update({
        referral_discount_pending: true,
        referral_count: (referrer.referral_count ?? 0) + 1,
      } as never).eq('id', referrer.id),
    ])

    return NextResponse.json({ success: true, bonusDays: 30 })
  } catch (err) {
    console.error('[referral/apply]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
