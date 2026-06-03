import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanLimits } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

const VALID_PLANS = ['free', 'starter', 'growth', 'pro']

export async function POST(req: Request) {
  try {
    const { planId } = await req.json()

    if (!planId || !VALID_PLANS.includes(planId)) {
      return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const limits = getPlanLimits(planId)
    const clientLimit = limits.clients === -1 ? 9999 : limits.clients

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        plan: planId,
        client_limit: clientLimit,
        plan_status: planId === 'free' ? 'active' : 'trial',
        trial_ends_at: planId === 'free' ? null : trialEndsAt,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du plan.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/select-plan]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
