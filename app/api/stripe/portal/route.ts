export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      return NextResponse.redirect(`${appUrl}/auth/login`)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      return NextResponse.redirect(`${appUrl}/plans`)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.redirect(portalSession.url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe/portal]', msg)

    // ID de test utilisé avec une clé live — on purge et on redirige vers les plans
    if (msg.includes('a similar object exists in test mode')) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({
          stripe_customer_id: null,
          stripe_subscription_id: null,
        }).eq('id', user.id)
      }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      return NextResponse.redirect(`${appUrl}/plans`)
    }

    return NextResponse.json({ error: `Erreur Stripe : ${msg}` }, { status: 500 })
  }
}
