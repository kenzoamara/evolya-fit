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

  const { coachId, confirmEmail } = await req.json()
  if (!coachId || !confirmEmail) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const admin = createAdminClient()

  // Verify email matches
  const { data: coach } = await admin.from('profiles').select('email, full_name').eq('id', coachId).single()
  if (!coach || coach.email !== confirmEmail) {
    return NextResponse.json({ error: 'Email de confirmation incorrect.' }, { status: 400 })
  }

  // Delete auth user (cascades to profiles via trigger)
  const { error: deleteError } = await admin.auth.admin.deleteUser(coachId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    admin_id: user.id,
    action: 'coach_deleted',
    target_type: 'coach',
    target_id: coachId,
    payload: { email: confirmEmail, full_name: coach.full_name },
  })

  return NextResponse.json({ ok: true })
}
