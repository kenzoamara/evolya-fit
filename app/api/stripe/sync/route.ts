export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolvePlanConfig } from '@/lib/stripe/plans'

export async function GET(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const { searchParams } = new URL(req.url)
  const sessionId  = searchParams.get('session_id')
  const redirectTo = searchParams.get('redirect') || '/clients'
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.evolyafit.fr'

  if (!sessionId) return NextResponse.redirect(`${appUrl}${redirectTo}?upgraded=1`)

  try {
    const adminClient = createAdminClient()

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price'],
    })

    const coachId = session.metadata?.coach_id
    if (!coachId) {
      console.error('[sync] Pas de coach_id dans la session:', sessionId)
      return NextResponse.redirect(`${appUrl}${redirectTo}?upgraded=1`)
    }

    const sub      = typeof session.subscription !== 'string' ? session.subscription : null
    const priceId  = sub?.items.data[0]?.price?.id
    const priceKey = session.metadata?.price_key

    const config = resolvePlanConfig(priceKey, priceId)
    if (!config) {
      console.error('[sync] Plan introuvable pour priceKey:', priceKey)
      return NextResponse.redirect(`${appUrl}${redirectTo}?upgraded=1`)
    }

    const planStatus       = sub?.status === 'trialing' ? 'trial' : 'active'
    const newSubscriptionId = sub?.id ?? (typeof session.subscription === 'string' ? session.subscription : null)

    // Ancienne subscription avant écrasement
    const { data: oldProfile } = await adminClient
      .from('profiles').select('stripe_subscription_id').eq('id', coachId).single()
    const oldSubId = oldProfile?.stripe_subscription_id as string | null

    await adminClient.from('profiles').update({
      plan:                      config.plan,
      plan_status:               planStatus,
      client_limit:              config.client_limit,
      stripe_customer_id:        session.customer as string,
      stripe_subscription_id:    newSubscriptionId,
      referral_discount_pending: false,
    } as never).eq('id', coachId)

    // Annule l'ancienne sub seulement après confirmation du nouveau paiement
    if (oldSubId && oldSubId !== newSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(oldSubId, { prorate: true })
      } catch (e) {
        console.error('[sync] Erreur annulation ancienne sub:', e)
      }
    }

    console.log(`[sync] Coach ${coachId} → ${config.plan} (${config.client_limit} clients, ${planStatus})`)
  } catch (err) {
    console.error('[sync] Erreur:', err)
  }

  return NextResponse.redirect(`${appUrl}${redirectTo}?upgraded=1`)
}
