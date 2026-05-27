import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { title, event_date, start_time, end_time } = await req.json()
    if (!title || !event_date) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.from('coach_events').insert({
      coach_id: user.id,
      title,
      event_date,
      start_time: start_time ?? null,
      end_time: end_time ?? null,
    }).select().single()

    if (error) {
      console.error('[api/events/create]', error)
      return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, event: data })
  } catch (err) {
    console.error('[api/events/create]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
