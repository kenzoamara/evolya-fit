import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { token, objectiveId, seriesCompleted, totalDurationSeconds } = await req.json()

    if (!token || !objectiveId) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('magic_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
    }

    const { data: objective } = await admin
      .from('objectives')
      .select('id')
      .eq('id', objectiveId)
      .eq('client_id', client.id)
      .single()

    if (!objective) {
      return NextResponse.json({ error: 'Objectif introuvable.' }, { status: 404 })
    }

    const { error: insertError } = await admin.from('exercise_sessions').insert({
      client_id: client.id,
      objective_id: objectiveId,
      series_completed: seriesCompleted ?? 0,
      total_duration_seconds: totalDurationSeconds ?? null,
    })

    if (insertError) {
      console.error('[api/exercise-sessions]', insertError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
    }

    await admin.from('objectives').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', objectiveId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/exercise-sessions]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
