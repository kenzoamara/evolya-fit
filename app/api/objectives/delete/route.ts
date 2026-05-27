import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(req: Request) {
  try {
    const { objectiveId } = await req.json()
    if (!objectiveId) {
      return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
    }

    // Vérifier l'authentification du coach
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Vérifier que l'objectif appartient bien à un client de ce coach
    const { data: objective } = await admin
      .from('objectives')
      .select('id, coach_id')
      .eq('id', objectiveId)
      .single()

    if (!objective || objective.coach_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const { error } = await admin.from('objectives').delete().eq('id', objectiveId)
    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/objectives/delete]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
