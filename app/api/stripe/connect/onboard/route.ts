import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.evolyafit.fr'

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('connect_account_id, email, full_name')
      .eq('id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

    const admin = createAdminClient()
    let accountId = (profile as { connect_account_id: string | null }).connect_account_id

    // Crée le compte Express si absent
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email: (profile as { email: string | null }).email ?? user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          product_description: 'Coaching sportif',
        },
        metadata: { coach_id: user.id },
      })
      accountId = account.id
      await admin
        .from('profiles')
        .update({ connect_account_id: accountId, connect_status: 'pending' } as never)
        .eq('id', user.id)
    }

    // Lien d'onboarding hébergé par Stripe
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/parametres?connect=refresh`,
      return_url: `${appUrl}/parametres?connect=done`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('[stripe/connect/onboard]', err)
    const msg = err instanceof Error ? err.message : 'Erreur Stripe.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
