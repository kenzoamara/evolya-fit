import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionStatus, getQRCode } from '@/lib/whatsapp'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('whatsapp_session_id, whatsapp_connected, whatsapp_phone')
      .eq('id', user.id)
      .single()

    if (!profile?.whatsapp_session_id) {
      return NextResponse.json({ status: 'DISCONNECTED', qr: null })
    }

    const status = await getSessionStatus(profile.whatsapp_session_id)

    // Si connecté, mettre à jour le flag en base
    if (status === 'CONNECTED' && !profile.whatsapp_connected) {
      await admin.from('profiles').update({ whatsapp_connected: true }).eq('id', user.id)
    }

    // Si pas encore connecté, retourner le QR code pour affichage
    let qr = null
    if (status === 'SCAN_QR_CODE' || status === 'LOADING') {
      const qrData = await getQRCode(profile.whatsapp_session_id)
      qr = qrData.qr
    }

    return NextResponse.json({ status, qr, phone: profile.whatsapp_phone })
  } catch (err) {
    console.error('[whatsapp/status]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
