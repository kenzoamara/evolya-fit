import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code    = searchParams.get('code')
  const coachId = searchParams.get('state')
  const error   = searchParams.get('error')
  const appUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.evolyafit.fr'

  if (error || !code || !coachId) {
    return NextResponse.redirect(`${appUrl}/agenda?gcal=error`)
  }

  // Échanger le code contre les tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${appUrl}/api/auth/google/callback`,
      grant_type:    'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokenRes.ok || !tokens.access_token) {
    console.error('[google/callback] token error:', tokens)
    return NextResponse.redirect(`${appUrl}/agenda?gcal=error`)
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()

  // Sauvegarder les tokens en DB
  const admin = createAdminClient()
  await admin.from('google_tokens').upsert({
    coach_id:      coachId,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at:    expiresAt,
  } as never, { onConflict: 'coach_id' })

  return NextResponse.redirect(`${appUrl}/agenda?gcal=success`)
}
