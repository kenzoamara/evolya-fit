import { createAdminClient } from '@/lib/supabase/admin'
import { RevenusContent } from './revenus-content'
import { planMrr } from '@/lib/stripe/plans'

export const revalidate = 0

export default async function AdminRevenusPage() {
  const supabase = createAdminClient()

  const [{ data: coaches }, { data: stripeMonthly }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, plan, plan_status, suspended, created_at')
      .eq('role', 'coach')
      .order('created_at', { ascending: true }),
    // MRR réel depuis stripe_events — 12 mois
    supabase
      .from('stripe_events')
      .select('amount, created_at')
      .eq('type', 'invoice.payment_succeeded')
      .gte('created_at', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()),
  ])

  const active = (coaches ?? []).filter(c => !c.suspended && c.plan_status === 'active')

  // MRR source de vérité: stripe_events ce mois OU fallback profiles
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const mrrFromStripe = (stripeMonthly ?? [])
    .filter(e => e.created_at >= startOfMonth.toISOString())
    .reduce((acc, e) => acc + Math.round(e.amount / 100), 0)
  const mrrFromProfiles = active.reduce((acc, c) => acc + (planMrr(c.plan)), 0)
  // Utiliser stripe si données dispos, sinon profiles
  const mrr = mrrFromStripe > 0 ? mrrFromStripe : mrrFromProfiles

  const cancelledThisMonth = (coaches ?? []).filter(c =>
    c.plan_status === 'cancelled' && c.created_at >= startOfMonth.toISOString()
  ).length

  const newThisMonth = (coaches ?? []).filter(c =>
    c.plan !== 'trial' && c.created_at >= startOfMonth.toISOString()
  ).length

  const churnRate = active.length > 0 ? Math.round((cancelledThisMonth / active.length) * 100) : 0

  const planDist: Record<string, number> = {}
  ;(coaches ?? []).forEach(c => { planDist[c.plan] = (planDist[c.plan] ?? 0) + 1 })

  const arpu = active.length > 0 ? Math.round(mrr / active.length) : 0

  // MRR 12 mois — depuis stripe_events si dispos, sinon profiles
  const monthly: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly[key] = 0
  }

  if ((stripeMonthly ?? []).length > 0) {
    // Source réelle: paiements Stripe
    ;(stripeMonthly ?? []).forEach(e => {
      const key = e.created_at.slice(0, 7)
      if (monthly[key] !== undefined) monthly[key] += Math.round(e.amount / 100)
    })
  } else {
    // Fallback: estimation depuis inscriptions
    ;(coaches ?? []).forEach(c => {
      if (c.plan !== 'trial') {
        const key = c.created_at.slice(0, 7)
        if (monthly[key] !== undefined) monthly[key] += planMrr(c.plan)
      }
    })
  }

  const mrrMonthly = Object.entries(monthly).map(([k, v]) => ({
    month: k.slice(5) + '/' + k.slice(2, 4),
    mrr: v,
  }))

  return (
    <RevenusContent
      mrr={mrr}
      arr={mrr * 12}
      newThisMonth={newThisMonth}
      cancelledThisMonth={cancelledThisMonth}
      churnRate={churnRate}
      arpu={arpu}
      planDist={planDist}
      mrrMonthly={mrrMonthly}
      coaches={(coaches ?? []).map(c => ({
        ...c,
        mrr: planMrr(c.plan),
      }))}
    />
  )
}
