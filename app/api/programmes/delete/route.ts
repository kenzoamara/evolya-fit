import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(req: Request) {
  try {
    const { programmeId } = await req.json()
    if (!programmeId) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('programmes')
      .delete()
      .eq('id', programmeId)
      .eq('coach_id', user.id)

    if (error) return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
