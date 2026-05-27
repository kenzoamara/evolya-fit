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

  const { coachId, suspend } = await req.json()
  if (!coachId) return NextResponse.json({ error: 'Missing coachId' }, { status: 400 })

  const admin = createAdminClient()

  const { error } = await admin.from('profiles').update({ suspended: suspend }).eq('id', coachId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await admin.from('audit_logs').insert({
    admin_id: user.id,
    action: suspend ? 'coach_suspended' : 'coach_reactivated',
    target_type: 'coach',
    target_id: coachId,
    payload: { suspend },
  })

  return NextResponse.json({ ok: true })
}
