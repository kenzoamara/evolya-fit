import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/library/assign-nutrition
// Body: { item_id, client_id }
// Ajoute le modèle nutritionnel au programme actif du client (ou en crée un)
export async function POST(req: Request) {
  try {
    const { item_id, client_id } = await req.json()
    if (!item_id || !client_id) return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })

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

    // Récupérer le modèle nutritionnel
    const { data: item } = await supabase
      .from('nutrition_items')
      .select('name, description')
      .eq('id', item_id)
      .single()
    if (!item) return NextResponse.json({ error: 'Modèle introuvable.' }, { status: 404 })

    const admin = createAdminClient()
    const line = item.description
      ? `• ${item.name} : ${item.description}`
      : `• ${item.name}`

    // Récupérer ou créer le programme actif
    const { data: prog } = await admin
      .from('nutrition_programmes')
      .select('id, content')
      .eq('client_id', client_id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prog) {
      const updated = prog.content ? `${prog.content}\n${line}` : line
      await admin.from('nutrition_programmes').update({ content: updated }).eq('id', prog.id)
    } else {
      await admin.from('nutrition_programmes').insert({
        client_id,
        title: 'Programme nutritionnel',
        content: line,
        active: true,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
