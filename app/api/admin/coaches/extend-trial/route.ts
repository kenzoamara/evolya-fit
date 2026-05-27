import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { coachId, days } = await req.json()
  if (!coachId || !days || days < 1 || days > 90) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  const admin = createAdminClient()

  // Get current trial_ends_at
  const { data: coach } = await admin.from('profiles').select('trial_ends_at').eq('id', coachId).single()
  const base = coach?.trial_ends_at ? new Date(coach.trial_ends_at) : new Date()
  if (base < new Date()) base.setTime(new Date().getTime())
  base.setDate(base.getDate() + days)

  const { error } = await admin.from('profiles').update({ trial_ends_at: base.toISOString() }).eq('id', coachId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    admin_id: user.id,
    action: 'trial_extended',
    target_type: 'coach',
    target_id: coachId,
    payload: { days, new_trial_ends_at: base.toISOString() },
  })

  return NextResponse.json({ ok: true, trial_ends_at: base.toISOString() })
}
