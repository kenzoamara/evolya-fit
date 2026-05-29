import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('connect_account_id')
      .eq('id', user.id)
      .single()

    const accountId = (profile as { connect_account_id: string | null } | null)?.connect_account_id
    if (!accountId) {
      return NextResponse.json({ status: 'none', chargesEnabled: false })
    }

    const account = await stripe.accounts.retrieve(accountId)
    const chargesEnabled = account.charges_enabled === true
    const status = chargesEnabled
      ? 'active'
      : account.requirements?.disabled_reason
        ? 'restricted'
        : 'pending'

    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({ connect_charges_enabled: chargesEnabled, connect_status: status } as never)
      .eq('id', user.id)

    return NextResponse.json({ status, chargesEnabled })
  } catch (err) {
    console.error('[stripe/connect/status]', err)
    return NextResponse.json({ error: 'Erreur Stripe.' }, { status: 500 })
  }
}
