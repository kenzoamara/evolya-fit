import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolvePlanConfig } from '@/lib/stripe/plans'

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  try {
    const adminClient = createAdminClient()
    let customerId = profile.stripe_customer_id

    // Si pas de customer_id, cherche par email
    if (!customerId) {
      const customers = await stripe.customers.list({ email: profile.email, limit: 1 })
      customerId = customers.data[0]?.id ?? null
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé pour ce compte.' }, { status: 404 })
    }

    // Cherche la subscription active ou en trial
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
      expand: ['data.items.data.price'],
    })

    const activeSub = subscriptions.data.find(s =>
      ['active', 'trialing'].includes(s.status)
    )

    if (!activeSub) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé.' }, { status: 404 })
    }

    const priceId  = activeSub.items.data[0]?.price?.id
    const priceKey = activeSub.metadata?.price_key as string | undefined

    const config = resolvePlanConfig(priceKey, priceId)

    if (!config) {
      return NextResponse.json({ error: 'Plan Stripe non reconnu.' }, { status: 400 })
    }

    const planStatus = activeSub.status === 'trialing' ? 'trial' : 'active'

    await adminClient.from('profiles').update({
      plan:                   config.plan,
      plan_status:            planStatus,
      client_limit:           config.client_limit,
      stripe_customer_id:     customerId,
      stripe_subscription_id: activeSub.id,
    } as never).eq('id', user.id)

    return NextResponse.json({
      success: true,
      plan: config.plan,
      client_limit: config.client_limit,
      plan_status: planStatus,
    })

  } catch (err) {
    console.error('[resync]', err)
    return NextResponse.json({ error: 'Erreur Stripe.' }, { status: 500 })
  }
}
