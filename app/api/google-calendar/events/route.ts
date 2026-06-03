import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: string } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) return null
  return {
    access_token: data.access_token,
    expires_at:   new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tokenRow } = await admin
    .from('google_tokens')
    .select('*')
    .eq('coach_id', user.id)
    .single()

  if (!tokenRow) return NextResponse.json({ connected: false, events: [] })

  let accessToken = (tokenRow as any).access_token
  const expiresAt = new Date((tokenRow as any).expires_at ?? 0)

  // Rafraîchir le token si expiré
  if (expiresAt <= new Date() && (tokenRow as any).refresh_token) {
    const refreshed = await refreshAccessToken((tokenRow as any).refresh_token)
    if (refreshed) {
      accessToken = refreshed.access_token
      await admin.from('google_tokens').update({
        access_token: refreshed.access_token,
        expires_at:   refreshed.expires_at,
      } as never).eq('coach_id', user.id)
    }
  }

  // Récupérer les événements des 3 prochains mois
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const gcalRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy:      'startTime',
      maxResults:   '250',
    }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!gcalRes.ok) {
    console.error('[gcal/events] error:', await gcalRes.text())
    return NextResponse.json({ connected: true, events: [] })
  }

  const gcalData = await gcalRes.json()
  const events = (gcalData.items ?? []).map((e: any) => ({
    id:       e.id,
    title:    e.summary ?? '(Sans titre)',
    start:    e.start?.dateTime ?? e.start?.date,
    end:      e.end?.dateTime   ?? e.end?.date,
    isAllDay: !e.start?.dateTime,
    color:    e.colorId ?? null,
    htmlLink: e.htmlLink,
  }))

  return NextResponse.json({ connected: true, events })
}

// DELETE — déconnecter Google Calendar
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const admin = createAdminClient()
  await admin.from('google_tokens').delete().eq('coach_id', user.id)
  return NextResponse.json({ success: true })
}
