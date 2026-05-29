import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.evolyafit.fr'

  try {
    const { token, offerId } = await req.json()
    if (!token || !offerId) return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })

    const admin = createAdminClient()

    // Client via magic token
    const now = new Date().toISOString()
    const { data: client } = await admin
      .from('clients')
      .select('id, full_name, email, coach_id, magic_token, token_expires_at')
      .eq('magic_token', token)
      .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
      .single()
    if (!client) return NextResponse.json({ error: 'Accès invalide.' }, { status: 404 })

    // Offre
    const { data: offer } = await admin
      .from('payment_offers')
      .select('*')
      .eq('id', offerId)
      .eq('coach_id', client.coach_id)
      .eq('is_active', true)
      .single()
    if (!offer) return NextResponse.json({ error: 'Offre indisponible.' }, { status: 404 })

    // Compte connecté du coach
    const { data: coach } = await admin
      .from('profiles')
      .select('connect_account_id, connect_charges_enabled')
      .eq('id', client.coach_id)
      .single()
    const connectId = (coach as { connect_account_id: string | null } | null)?.connect_account_id
    const enabled = (coach as { connect_charges_enabled: boolean } | null)?.connect_charges_enabled
    if (!connectId || !enabled) {
      return NextResponse.json({ error: "Le coach n'a pas encore activé les paiements." }, { status: 409 })
    }

    const metadata = {
      coach_id: client.coach_id,
      client_id: client.id,
      offer_id: offer.id,
      sessions_count: String(offer.sessions_count ?? 0),
    }

    // Charge directe : la session est créée SUR le compte du coach (Stripe-Account).
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: offer.currency ?? 'eur',
            unit_amount: offer.price_cents,
            product_data: { name: offer.name },
          },
          quantity: 1,
        }],
        customer_email: client.email && !client.email.includes('@evolya.internal') ? client.email : undefined,
        metadata,
        payment_intent_data: { metadata },
        success_url: `${appUrl}/c/${token}/paiement?paid=1`,
        cancel_url: `${appUrl}/c/${token}/paiement?canceled=1`,
      },
      { stripeAccount: connectId },
    )

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[payments/checkout]', err)
    const msg = err instanceof Error ? err.message : 'Erreur Stripe.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
