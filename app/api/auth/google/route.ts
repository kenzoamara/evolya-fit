import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state:         user.id, // pour retrouver le coach dans le callback
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
