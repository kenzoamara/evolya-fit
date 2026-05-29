import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const PRICE_MAP: Record<string, string> = {
  starter_monthly:   process.env.STRIPE_PRICE_STARTER_MONTHLY!,
  starter_annual:    process.env.STRIPE_PRICE_STARTER_ANNUAL!,
  growth_monthly:    process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
  growth_annual:     process.env.STRIPE_PRICE_GROWTH_ANNUAL!,
  pro_monthly:       process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_annual:        process.env.STRIPE_PRICE_PRO_ANNUAL!,
  scale_monthly:     process.env.STRIPE_PRICE_SCALE_MONTHLY!,
  scale_annual:      process.env.STRIPE_PRICE_SCALE_ANNUAL!,
  elite_monthly:     process.env.STRIPE_PRICE_ELITE_MONTHLY!,
  elite_annual:      process.env.STRIPE_PRICE_ELITE_ANNUAL!,
  unlimited_monthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY!,
  unlimited_annual:  process.env.STRIPE_PRICE_UNLIMITED_ANNUAL!,
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  try {
    const { priceKey } = await req.json()

    const priceId = PRICE_MAP[priceKey]
    if (!priceId) {
      return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name, email, referral_discount_pending, plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.evolyafit.fr'

    // Plans sans essai gratuit : carte bancaire requise immédiatement
    const NO_TRIAL_PLANS = ['unlimited']
    const planBase = priceKey.split('_')[0]

    // Jours d'essai restants — on se base sur trial_ends_at (fiable même si plan a changé)
    let trialDays: number | undefined
    if (!NO_TRIAL_PLANS.includes(planBase) && profile?.trial_ends_at) {
      const remainingMs = new Date(profile.trial_ends_at).getTime() - Date.now()
      if (remainingMs > 0) {
        trialDays = Math.ceil(remainingMs / 86400000)
      }
    }

    // Montant mensuel par plan en centimes (pour coupon annuel)
    const PLAN_MONTHLY_CENTS: Record<string, number> = {
      starter: 1900, growth: 2900, pro: 4900,
      scale: 8900, elite: 13900, unlimited: 23900,
    }

    // Si le parrain a 1 mois offert en attente, créer un coupon Stripe one-shot
    let discounts: { coupon: string }[] | undefined
    if (profile?.referral_discount_pending) {
      const isAnnual = priceKey.endsWith('_annual')
      const coupon = isAnnual
        // Annuel : on offre l'équivalent d'1 mois en montant fixe
        ? await stripe.coupons.create({
            amount_off: PLAN_MONTHLY_CENTS[planBase] ?? 2900,
            currency: 'eur',
            duration: 'once',
            name: '1 mois offert — parrainage Evolya',
            metadata: { coach_id: user.id },
          })
        // Mensuel : 100% off premier mois
        : await stripe.coupons.create({
            percent_off: 100,
            duration: 'once',
            name: '1 mois offert — parrainage Evolya',
            metadata: { coach_id: user.id },
          })
      discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : (profile?.email ?? user.email),
      discounts,
      // Pas de carte requise pendant l'essai gratuit
      payment_method_collection: trialDays ? 'if_required' : 'always',
      metadata: {
        coach_id: user.id,
        price_key: priceKey,
      },
      subscription_data: {
        metadata: {
          coach_id: user.id,
          price_key: priceKey,
        },
        ...(trialDays ? {
          trial_period_days: trialDays,
          trial_settings: {
            end_behavior: { missing_payment_method: 'cancel' },
          },
        } : {}),
      },
      success_url: `${appUrl}/api/stripe/sync?redirect=/clients&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/clients`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: `Erreur Stripe: ${msg}` }, { status: 500 })
  }
}
