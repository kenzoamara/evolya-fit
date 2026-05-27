import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(req: Request) {
  try {
    const { eventId } = await req.json()
    if (!eventId) {
      return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('coach_events')
      .delete()
      .eq('id', eventId)
      .eq('coach_id', user.id)

    if (error) {
      console.error('[api/events/delete]', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/events/delete]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
