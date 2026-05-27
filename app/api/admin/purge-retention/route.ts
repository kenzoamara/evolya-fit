import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Purge stripe_events > 6 ans (obligation légale comptable)
  const { count: stripeCount } = await admin
    .from('stripe_events')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 6 * 365.25 * 24 * 3600 * 1000).toISOString())

  // Purge audit_logs > 13 mois (politique de confidentialité)
  const { count: auditCount } = await admin
    .from('audit_logs')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 13 * 30 * 24 * 3600 * 1000).toISOString())

  console.log(`[purge-retention] stripe_events: ${stripeCount ?? 0}, audit_logs: ${auditCount ?? 0}`)

  return NextResponse.json({
    ok: true,
    purged: {
      stripe_events: stripeCount ?? 0,
      audit_logs: auditCount ?? 0,
    },
    executed_at: new Date().toISOString(),
  })
}
