import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(req: Request) {
  try {
    const { checkinId } = await req.json()
    if (!checkinId) {
      return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
    }

    // Vérifier l'authentification du coach
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const adminClient = createAdminClient()

    // Vérifier que le check-in appartient à un client de ce coach
    const { data: checkin } = await adminClient
      .from('checkins')
      .select('id, client_id')
      .eq('id', checkinId)
      .single()

    if (!checkin) return NextResponse.json({ error: 'Check-in introuvable.' }, { status: 404 })

    const { data: client } = await adminClient
      .from('clients')
      .select('id')
      .eq('id', checkin.client_id)
      .eq('coach_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

    const { error } = await adminClient
      .from('checkins')
      .delete()
      .eq('id', checkinId)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[checkin/delete]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
