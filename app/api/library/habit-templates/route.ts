import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = ['sport', 'nutrition', 'sommeil', 'bien-etre', 'mental']

// POST /api/library/habit-templates — créer un modèle
export async function POST(req: Request) {
  try {
    const { name, emoji, category, description } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
    if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Catégorie invalide.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: template, error } = await supabase
      .from('habit_templates')
      .insert({
        coach_id: user.id,
        name: name.trim(),
        emoji: emoji?.trim() || '✅',
        category,
        description: description?.trim() ?? '',
        is_global: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// DELETE /api/library/habit-templates?id=xxx — supprimer un modèle
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { error } = await supabase
      .from('habit_templates')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
