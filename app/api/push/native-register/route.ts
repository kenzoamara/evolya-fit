import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/push/native-register
// Enregistre le token push natif (APNs/FCM) de l'appareil pour le coach connecté.
export async function POST(req: Request) {
  try {
    const { token, platform } = await req.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token requis.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Pas de session coach (ex. espace client par magic link) → on ignore proprement.
    if (!user) return NextResponse.json({ ok: true, stored: false })

    const admin = createAdminClient()
    const { error } = await admin
      .from('native_push_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform: platform === 'ios' || platform === 'android' ? platform : 'unknown',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      )

    if (error) {
      console.error('[push/native-register]', error)
      return NextResponse.json({ error: 'Erreur enregistrement.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, stored: true })
  } catch (err) {
    console.error('[push/native-register]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
