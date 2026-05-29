import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/suggestions/comment — poster un commentaire
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { suggestion_id, content } = await req.json()

  if (!suggestion_id || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const trimmed = content.trim().slice(0, 500)
  if (trimmed.length === 0) return NextResponse.json({ error: 'Contenu vide' }, { status: 400 })

  // Vérifier que la suggestion existe et est visible
  const { data: sugg } = await supabase
    .from('suggestions')
    .select('id, status, coach_id')
    .eq('id', suggestion_id)
    .single()

  if (!sugg) return NextResponse.json({ error: 'Suggestion introuvable' }, { status: 404 })

  // Rate limit : 10 commentaires/jour par coach
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('suggestion_comments')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)
    .gt('created_at', dayAgo)

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'Limite de commentaires atteinte (10/jour).' }, { status: 429 })
  }

  const { data, error } = await supabase
    .from('suggestion_comments')
    .insert({ suggestion_id, coach_id: user.id, content: trimmed })
    .select('*, coach:profiles(full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}

// DELETE /api/suggestions/comment?id=xxx — supprimer son commentaire
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabase
    .from('suggestion_comments')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
