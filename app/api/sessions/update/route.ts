import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request) {
  try {
    const { sessionId, session_date, session_time, notes, private_notes } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
    }

    // Vérifier l'authentification du coach
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Vérifier que la session appartient bien à ce coach
    const { data: session } = await admin
      .from('sessions')
      .select('id, coach_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.coach_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const updates: Record<string, string | null> = {}
    if (session_date !== undefined) updates.session_date = session_date
    if (session_time !== undefined) updates.session_time = session_time ?? null
    if (notes !== undefined) updates.notes = notes
    if (private_notes !== undefined) updates.private_notes = private_notes

    const { error } = await admin.from('sessions').update(updates).eq('id', sessionId)
    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/sessions/update]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
