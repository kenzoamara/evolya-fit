import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { clientId, content } = await req.json()
    if (!clientId || !content?.trim()) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Note trop longue (max 2000 caractères).' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // Vérifier que le client appartient bien à ce coach
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })

    const admin = createAdminClient()
    const { data: note, error } = await admin
      .from('client_notes')
      .insert({
        client_id: clientId,
        content: content.trim(),
        is_private: true,
        author_role: 'coach',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ note })
  } catch (err) {
    console.error('[api/coach/notes POST]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { noteId, clientId } = await req.json()
    if (!noteId || !clientId) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // Vérifier ownership via le client
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('client_id', clientId)
      .eq('author_role', 'coach')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/coach/notes DELETE]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
