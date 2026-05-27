import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { token, title, description, targetDate } = await req.json()
    if (!token || !title?.trim()) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id, coach_id')
      .eq('magic_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 403 })

    const { data: objective, error } = await admin
      .from('objectives')
      .insert({
        client_id: client.id,
        coach_id: client.coach_id,
        title: title.trim(),
        description: description?.trim() || null,
        target_date: targetDate || null,
        status: 'todo',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ objective })
  } catch (err) {
    console.error('[api/objectives/client-add]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
