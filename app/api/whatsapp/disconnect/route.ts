import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteSession } from '@/lib/whatsapp'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('whatsapp_session_id')
      .eq('id', user.id)
      .single()

    if (profile?.whatsapp_session_id) {
      await deleteSession(profile.whatsapp_session_id)
    }

    await admin.from('profiles').update({
      whatsapp_session_id: null,
      whatsapp_connected: false,
      whatsapp_phone: null,
    }).eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp/disconnect]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
