import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { title, type, description, start_date, duration_days, end_date, client_ids, frequency, level } = await req.json()

    if (!title?.trim()) return NextResponse.json({ error: 'Titre requis.' }, { status: 400 })
    if (!['sportif', 'nutritionnel', 'habitudes'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // 1. Create programme
    // Store ai_prompt, frequency, level as JSON in description field (no migration needed)
    const meta = JSON.stringify({ prompt: description?.trim() || '', frequency: frequency ?? 3, level: level ?? 'intermediaire' })

    const { data: programme, error: progError } = await supabase
      .from('programmes')
      .insert({
        coach_id: user.id,
        title: title.trim(),
        type,
        description: meta,
        status: 'active',
        start_date: start_date || null,
        duration_days: duration_days || null,
        end_date: end_date || null,
      })
      .select()
      .single()

    if (progError) return NextResponse.json({ error: progError.message }, { status: 500 })

    // 2. Assign to clients (multi)
    const ids: string[] = Array.isArray(client_ids) ? client_ids.filter(Boolean) : []
    if (ids.length > 0) {
      await supabase
        .from('programme_clients')
        .insert(ids.map(client_id => ({ programme_id: programme.id, client_id })))
    }

    // 3. Return programme with programme_clients populated for optimistic UI
    const { data: full } = await supabase
      .from('programmes')
      .select('*, programme_clients(client_id, clients(full_name))')
      .eq('id', programme.id)
      .single()

    return NextResponse.json({ success: true, programme: full ?? programme })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
