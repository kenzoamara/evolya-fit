import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, clientName } = await req.json()
  if (!clientId || !clientName) {
    return NextResponse.json({ error: 'Missing clientId or clientName' }, { status: 400 })
  }

  // Check if already relanced this week (Monday to Sunday)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1))
  weekStart.setHours(0, 0, 0, 0)

  const weekStartIso = weekStart.toISOString()

  const { data: existingRelance } = await supabase
    .from('relances')
    .select('id, sent_at')
    .eq('client_id', clientId)
    .eq('coach_id', user.id)
    .gte('sent_at', weekStartIso)
    .single()

  if (existingRelance) {
    return NextResponse.json(
      { error: 'Relance already sent this week', lastRelanceDate: existingRelance.sent_at },
      { status: 409 }
    )
  }

  // Generate message and send via existing /api/messages endpoint
  const firstName = clientName.split(' ')[0]
  const messageContent = `Salut ${firstName} ! Je voulais prendre de tes nouvelles — ça fait quelques jours que je n'ai pas reçu de check-in de ta part. Tout va bien ? N'hésite pas à me dire si tu as besoin de quelque chose.`

  const messageRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, content: messageContent }),
  })

  if (!messageRes.ok) {
    const msgError = await messageRes.json()
    return NextResponse.json(
      { error: 'Failed to send message', details: msgError },
      { status: 500 }
    )
  }

  const messageData = await messageRes.json()
  const messageId = messageData.message?.id || null

  // Record relance in database
  const { data: relance, error: insertError } = await supabase
    .from('relances')
    .insert({
      client_id: clientId,
      coach_id: user.id,
      message_id: messageId,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to record relance', details: insertError },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    relance,
    message: 'Relance sent successfully',
  })
}
