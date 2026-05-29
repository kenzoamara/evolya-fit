import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[connect/webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    // ── Statut du compte connecté ──
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      const chargesEnabled = account.charges_enabled === true
      const status = chargesEnabled
        ? 'active'
        : account.requirements?.disabled_reason ? 'restricted' : 'pending'
      await admin
        .from('profiles')
        .update({ connect_charges_enabled: chargesEnabled, connect_status: status } as never)
        .eq('connect_account_id', account.id)
      break
    }

    // ── Paiement d'un pack réussi ──
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const m = session.metadata ?? {}
      const coachId = m.coach_id
      const clientId = m.client_id
      const offerId = m.offer_id || null
      const sessions = parseInt(m.sessions_count ?? '0', 10)
      if (!coachId || !clientId) break

      // Idempotence : stripe_session_id unique
      const { data: existing } = await admin
        .from('transactions').select('id').eq('stripe_session_id', session.id).maybeSingle()
      if (existing) break

      await admin.from('transactions').insert({
        coach_id: coachId,
        client_id: clientId,
        offer_id: offerId,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        type: 'pack',
        status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      } as never)

      if (sessions > 0) {
        await admin.from('client_entitlements').insert({
          client_id: clientId,
          coach_id: coachId,
          offer_id: offerId,
          type: 'pack',
          status: 'active',
          sessions_remaining: sessions,
        } as never)
      }
      break
    }

    // ── Remboursement ──
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
      if (pi) {
        await admin.from('transactions')
          .update({ status: 'refunded' } as never)
          .eq('stripe_payment_intent_id', pi)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
