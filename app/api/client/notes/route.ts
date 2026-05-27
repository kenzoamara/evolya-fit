import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST — créer une note
export async function POST(req: Request) {
  try {
    const { clientId, magicToken, content, isPrivate } = await req.json()

    if (!clientId || !magicToken || !content?.trim()) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }
    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Note trop longue (max 1000 caractères).' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier le token
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('magic_token', magicToken)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const { data: note, error } = await admin
      .from('client_notes')
      .insert({ client_id: clientId, content: content.trim(), is_private: isPrivate ?? false })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })

    return NextResponse.json({ note })
  } catch (err) {
    console.error('[client/notes POST]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// DELETE — supprimer une note
export async function DELETE(req: Request) {
  try {
    const { noteId, clientId, magicToken } = await req.json()

    if (!noteId || !clientId || !magicToken) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier le token
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('magic_token', magicToken)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const { error } = await admin
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('client_id', clientId)

    if (error) return NextResponse.json({ error: 'Erreur suppression.' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[client/notes DELETE]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
