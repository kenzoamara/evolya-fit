import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/client/find
// Appelé après signInWithPassword — retourne le magic_token du client connecté
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: client, error } = await adminClient
      .from('clients')
      .select('magic_token')
      .eq('auth_user_id', user.id)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Espace client introuvable. Contactez votre coach.' }, { status: 404 })
    }

    return NextResponse.json({ magic_token: client.magic_token })
  } catch (err) {
    console.error('[client/find]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
