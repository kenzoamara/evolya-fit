import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignore signOut errors — redirect to login regardless
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
  return NextResponse.redirect(new URL('/auth/login', base))
}
