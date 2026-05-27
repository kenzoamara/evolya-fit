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

  const { target, message, type, expiresAt } = await req.json()
  if (!message?.trim() || !target) return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
  if (!['info', 'success', 'warning'].includes(type)) return NextResponse.json({ error: 'Type invalide.' }, { status: 400 })

  const admin = createAdminClient()

  const { data: notification, error } = await admin.from('notifications').insert({
    target,
    message: message.slice(0, 120),
    type,
    expires_at: expiresAt || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    admin_id: user.id,
    action: 'notification_sent',
    target_type: 'notification',
    target_id: notification.id,
    payload: { target, type, message: message.slice(0, 120) },
  })

  return NextResponse.json({ ok: true, notification })
}
