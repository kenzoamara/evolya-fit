import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Limites de membres alignées sur les vrais plans (lib/plan-limits.ts)
const PLAN_LIMITS: Record<string, number> = {
  trial: 1,
  starter: 10,
  growth: 25,
  pro: 45,
  // Legacy
  standard: 25,
}

const VALID_PLANS = ['trial', 'starter', 'growth', 'pro']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { coachId, plan } = await req.json()
  if (!coachId || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: prev } = await admin.from('profiles').select('plan').eq('id', coachId).single()

  const { error } = await admin.from('profiles').update({
    plan,
    client_limit: PLAN_LIMITS[plan] ?? 1,
  }).eq('id', coachId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    admin_id: user.id,
    action: 'plan_changed',
    target_type: 'coach',
    target_id: coachId,
    payload: { from: prev?.plan, to: plan },
  })

  return NextResponse.json({ ok: true })
}
