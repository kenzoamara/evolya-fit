import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { PLAN_CONFIG, resolvePlanConfig } from '@/lib/stripe/plans'

// Idempotency: skip if stripe_event_id already processed
async function isEventProcessed(adminClient: ReturnType<typeof createAdminClient>, stripeEventId: string) {
  const { data } = await adminClient
    .from('stripe_events')
    .select('id')
    .eq('stripe_event_id', stripeEventId)
    .maybeSingle()
  return !!data
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Idempotency guard for payment events
  if (['invoice.payment_succeeded', 'invoice.payment_failed'].includes(event.type)) {
    if (await isEventProcessed(adminClient, event.id)) {
      console.log(`[webhook] Already processed: ${event.id}`)
      return NextResponse.json({ received: true })
    }
  }

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const coachId = session.metadata?.coach_id
      const priceKey = session.metadata?.price_key ?? 'standard'
      if (!coachId) break

      const config = resolvePlanConfig(priceKey, undefined) ?? PLAN_CONFIG.standard

      let planStatus: string = 'active'
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          if (sub.status === 'trialing') planStatus = 'trial'
        } catch {}
      }

      await adminClient.from('profiles').update({
        plan: config.plan, // toujours le vrai plan, même en période d'essai
        plan_status: planStatus,
        client_limit: config.client_limit,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        referral_discount_pending: false,
      } as never).eq('id', coachId)

      console.log(`[webhook] Plan activé pour coach ${coachId}: ${config.plan} (status: ${planStatus})`)
      break
    }

    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const coachId = sub.metadata?.coach_id

      if (coachId) {
        const priceId = sub.items.data[0]?.price?.id
        const config = resolvePlanConfig(sub.metadata?.price_key, priceId) ?? PLAN_CONFIG.standard

        await adminClient.from('profiles').update({
          plan: config.plan,
          plan_status: 'active',
          stripe_subscription_id: sub.id,
        } as never).eq('id', coachId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', sub.id)
        .maybeSingle()

      if (profile) {
        const config = resolvePlanConfig(
          sub.metadata?.price_key,
          sub.items.data[0]?.price?.id,
        ) ?? PLAN_CONFIG.standard

        // trialing → reste en trial jusqu'au premier paiement
        const planStatus = sub.status === 'active' ? 'active'
          : sub.status === 'trialing' ? 'trial'
          : sub.status === 'past_due' ? 'past_due'
          : 'cancelled'

        await adminClient.from('profiles').update({
          plan: config.plan, // toujours le vrai plan
          plan_status: planStatus,
        } as never).eq('stripe_subscription_id', sub.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await adminClient.from('profiles').update({
        plan_status: 'cancelled',
      } as never).eq('stripe_subscription_id', subscription.id)

      console.log(`[webhook] Abonnement annulé: ${subscription.id}`)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string; customer?: string; billing_reason?: string }
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
      const amountCents = invoice.amount_paid ?? 0

      // Find coach
      let coachId: string | null = null
      let coachProfile: { id: string; referred_by?: string | null; plan?: string | null } | null = null
      if (subscriptionId) {
        const { data: p } = await adminClient
          .from('profiles')
          .select('id, referred_by, plan')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()
        coachId = p?.id ?? null
        coachProfile = p ?? null
      }

      // Record payment event (idempotent via stripe_event_id unique constraint)
      await adminClient.from('stripe_events').insert({
        stripe_event_id: event.id,
        type: 'invoice.payment_succeeded',
        coach_id: coachId,
        amount: amountCents,
        currency: invoice.currency ?? 'eur',
      })

      // Ensure profile is back to active if it was past_due
      if (subscriptionId) {
        await adminClient.from('profiles').update({
          plan_status: 'active',
        } as never).eq('stripe_subscription_id', subscriptionId)
      }

      // Recompense parrain au PREMIER paiement du filleul uniquement
      if (
        invoice.billing_reason === 'subscription_create' &&
        coachProfile?.referred_by
      ) {
        await rewardReferrer(adminClient, stripe, coachProfile.referred_by)
      }

      console.log(`[webhook] Paiement réussi: ${amountCents / 100}€`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
      if (!subscriptionId) break

      const { data: profile } = await adminClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle()

      await adminClient.from('profiles').update({
        plan_status: 'past_due',
      } as never).eq('stripe_subscription_id', subscriptionId)

      // Record failed event
      await adminClient.from('stripe_events').insert({
        stripe_event_id: event.id,
        type: 'invoice.payment_failed',
        coach_id: profile?.id ?? null,
        amount: 0,
        currency: invoice.currency ?? 'eur',
      })

      // Notification admin temps réel
      if (profile) {
        await adminClient.from('notifications').insert({
          target: 'admin',
          message: `⚠️ Paiement échoué — ${profile.full_name ?? profile.email}`,
          type: 'warning',
          expires_at: null,
        })
      }

      // Email au coach
      if (profile?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Evolya <noreply@evolya.fr>',
          to: profile.email,
          subject: 'Problème avec votre abonnement Evolya',
          html: paymentFailedEmailHtml({
            coachName: profile.full_name ?? 'Coach',
            portalUrl: `${appUrl}/api/stripe/portal`,
          }),
        })
      }

      console.log(`[webhook] Paiement échoué: ${subscriptionId}`)
      break
    }

    default:
      console.log(`[webhook] Event non géré: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

/* ── Montant mensuel par plan (en centimes) ─────────────────── */
const PLAN_MONTHLY_CENTS: Record<string, number> = {
  starter:   1900,
  growth:    2900,
  pro:       4900,
  scale:     8900,
  elite:     13900,
  unlimited: 23900,
}

/* ── Récompense parrain : 1 mois offert ─────────────────────── */
async function rewardReferrer(
  adminClient: ReturnType<typeof createAdminClient>,
  stripe: Stripe,
  referralCode: string,
) {
  const { data: referrer } = await adminClient
    .from('profiles')
    .select('id, plan, stripe_customer_id, referral_count')
    .eq('referral_code', referralCode)
    .maybeSingle()

  if (!referrer) return

  const newCount = (referrer.referral_count ?? 0) + 1

  if (referrer.stripe_customer_id) {
    // Parrain abonné → crédit Stripe = 1 mois offert (valeur du plan actuel)
    const planBase = (referrer.plan ?? 'growth').replace(/_?(monthly|annual)$/, '')
    const creditCents = PLAN_MONTHLY_CENTS[planBase] ?? PLAN_MONTHLY_CENTS.growth

    try {
      await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
        amount: -creditCents,
        currency: 'eur',
        description: '1 mois offert — parrainage Evolya',
      })
      console.log(`[referral] Crédit Stripe ${creditCents / 100}€ appliqué au parrain ${referrer.id}`)
    } catch (err) {
      console.error('[referral] Erreur Stripe balance credit:', err)
      // Fallback : flag pending pour le prochain checkout
      await adminClient.from('profiles').update({
        referral_discount_pending: true,
      } as never).eq('id', referrer.id)
    }
  } else {
    // Parrain sans abonnement Stripe → coupon 1 mois offert au prochain checkout
    await adminClient.from('profiles').update({
      referral_discount_pending: true,
    } as never).eq('id', referrer.id)
  }

  // Incrémenter le compteur filleuls
  await adminClient.from('profiles').update({
    referral_count: newCount,
  } as never).eq('id', referrer.id)
}

function paymentFailedEmailHtml({ coachName, portalUrl }: { coachName: string; portalUrl: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
    <div style="background:#4E9B6F;padding:20px 32px;">
      <span style="color:#fff;font-weight:600;font-size:15px;">Evolya</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0D1F3C;">Problème de paiement</h1>
      <p style="margin:0 0 16px;color:#64748B;line-height:1.6;font-size:14px;">
        Bonjour ${coachName}, votre dernier paiement Evolya a échoué.
        Mettez à jour votre moyen de paiement pour continuer.
      </p>
      <a href="${portalUrl}" style="display:inline-block;background:#4E9B6F;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;">
        Mettre à jour mon moyen de paiement →
      </a>
    </div>
  </div>
</body>
</html>`
}
