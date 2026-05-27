import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/library/assign-habit
// Body: { template_id, client_id }
// Crée une habitude pour le client à partir du modèle
export async function POST(req: Request) {
  try {
    const { template_id, client_id } = await req.json()
    if (!template_id || !client_id) return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // Vérifier que le client appartient au coach
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('coach_id', user.id)
      .single()
    if (!client) return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })

    // Récupérer le modèle
    const { data: template } = await supabase
      .from('habit_templates')
      .select('name, emoji')
      .eq('id', template_id)
      .single()
    if (!template) return NextResponse.json({ error: 'Modèle introuvable.' }, { status: 404 })

    const admin = createAdminClient()

    // Position suivante
    const { data: last } = await admin
      .from('habits')
      .select('position')
      .eq('client_id', client_id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const position = (last?.position ?? -1) + 1

    const { data: habit, error } = await admin
      .from('habits')
      .insert({ client_id, name: template.name, emoji: template.emoji, position })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ habit })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
