import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/messages/[id]
// actions : 'edit' | 'delete' | 'react' | 'pin' | 'unpin'
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { action, content, emoji, token } = body
    const messageId = params.id
    const admin = createAdminClient()

    // Résoudre l'identité
    let coachId: string | null = null
    let clientId: string | null = null

    if (token) {
      const { data: client } = await admin
        .from('clients')
        .select('id')
        .eq('magic_token', token)
        .gt('token_expires_at', new Date().toISOString())
        .single()
      if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
      clientId = client.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
      coachId = user.id
    }

    // Récupérer le message
    const { data: message } = await admin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (!message) return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 })

    // ── EDIT ──────────────────────────────────────────────────────────────────
    if (action === 'edit') {
      if (!content?.trim()) return NextResponse.json({ error: 'Contenu vide.' }, { status: 400 })
      const isOwner =
        (coachId && message.sender_role === 'coach' && message.coach_id === coachId) ||
        (clientId && message.sender_role === 'client' && message.client_id === clientId)
      if (!isOwner) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })

      const { data: updated } = await admin
        .from('messages')
        .update({ content: content.trim(), edited_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single()
      return NextResponse.json({ message: updated })
    }

    // ── DELETE (soft) ─────────────────────────────────────────────────────────
    if (action === 'delete') {
      const isOwner =
        (coachId && message.sender_role === 'coach' && message.coach_id === coachId) ||
        (clientId && message.sender_role === 'client' && message.client_id === clientId)
      if (!isOwner) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })

      const { data: updated } = await admin
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single()
      return NextResponse.json({ message: updated })
    }

    // ── REACT ─────────────────────────────────────────────────────────────────
    if (action === 'react') {
      if (!emoji) return NextResponse.json({ error: 'Emoji manquant.' }, { status: 400 })
      const reactions = (message.reactions as Record<string, string[]>) ?? {}
      const reactorId = coachId ?? clientId ?? 'unknown'
      const current = reactions[emoji] ?? []
      const alreadyReacted = current.includes(reactorId)

      if (alreadyReacted) {
        reactions[emoji] = current.filter((id: string) => id !== reactorId)
        if (reactions[emoji].length === 0) delete reactions[emoji]
      } else {
        reactions[emoji] = [...current, reactorId]
      }

      const { data: updated } = await admin
        .from('messages')
        .update({ reactions })
        .eq('id', messageId)
        .select()
        .single()
      return NextResponse.json({ message: updated })
    }

    // ── PIN / UNPIN ───────────────────────────────────────────────────────────
    if (action === 'pin' || action === 'unpin') {
      if (!coachId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })

      const { data: updated } = await admin
        .from('messages')
        .update({ pinned: action === 'pin' })
        .eq('id', messageId)
        .select()
        .single()
      return NextResponse.json({ message: updated })
    }

    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
  } catch (err) {
    console.error('[messages/[id]/PATCH]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
