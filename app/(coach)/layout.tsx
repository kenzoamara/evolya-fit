import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/coach/sidebar'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import type { Profile } from '@/types/database'
import type { CSSProperties } from 'react'

const FONT_MAP: Record<string, string> = {
  'Inter':      'var(--font-inter), system-ui, sans-serif',
  'Poppins':    'var(--font-poppins), sans-serif',
  'Montserrat': 'var(--font-montserrat), sans-serif',
  'Raleway':    'var(--font-raleway), sans-serif',
}

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')
  if ((profile as Profile).suspended) redirect('/auth/suspended')

  const typedProfile = profile as Profile
  const brand = typedProfile.brand_color_primary ?? '#4E9B6F'
  const font  = typedProfile.brand_font ?? 'Inter'

  const rootStyle = {
    '--brand':      brand,
    '--brand-bg':   `color-mix(in srgb, ${brand} 12%, white)`,
    '--brand-dark': `color-mix(in srgb, ${brand} 80%, black)`,
    backgroundColor: 'var(--evolya-bg)',
    fontFamily: FONT_MAP[font] ?? FONT_MAP['Inter'],
  } as CSSProperties

  return (
    <div className="flex min-h-dvh md:h-dvh md:overflow-hidden" style={rootStyle}>
      <NotificationProvider coachId={typedProfile.id} plan={typedProfile.plan} />
      <Sidebar profile={typedProfile} />
      <main className="flex-1 flex flex-col min-w-0 md:overflow-y-auto pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  )
}
