import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/push/coach-subscribe
// Body: { subscription: { endpoint, keys: { p256dh, auth } } }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { subscription } = await req.json()
    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const admin = createAdminClient()
    await admin.from('coach_push_subscriptions').upsert(
      {
        coach_id: user.id,
        endpoint: subscription.endpoint,
        p256dh:   subscription.keys.p256dh,
        auth:     subscription.keys.auth,
      },
      { onConflict: 'coach_id,endpoint' }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/coach-subscribe POST]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// DELETE /api/push/coach-subscribe
// Body: { endpoint }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'endpoint manquant.' }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('coach_push_subscriptions')
      .delete()
      .eq('coach_id', user.id)
      .eq('endpoint', endpoint)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/coach-subscribe DELETE]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
