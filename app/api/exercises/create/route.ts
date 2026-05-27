import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = ['force', 'cardio', 'mobilite', 'hiit', 'stretching']
const VALID_DIFFICULTIES = ['debutant', 'intermediaire', 'avance']

export async function POST(req: Request) {
  try {
    const { name, category, muscle_group, muscles, equipment, difficulty, instructions } = await req.json()

    if (!name?.trim()) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
    if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Catégorie invalide.' }, { status: 400 })
    if (!VALID_DIFFICULTIES.includes(difficulty)) return NextResponse.json({ error: 'Niveau invalide.' }, { status: 400 })
    if (!muscle_group?.trim()) return NextResponse.json({ error: 'Muscle principal requis.' }, { status: 400 })
    if (!instructions?.trim()) return NextResponse.json({ error: 'Instructions requises.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert({
        coach_id: user.id,
        name: name.trim(),
        category,
        muscle_group: muscle_group.trim(),
        muscles: Array.isArray(muscles) ? muscles : [],
        equipment: equipment ?? 'aucun',
        difficulty,
        instructions: instructions.trim(),
        is_global: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ exercise })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
