export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientNav } from '@/components/shared/client-nav'
import { ClientThemeProvider } from '@/components/shared/client-theme-provider'
import { PushSubscribeButton } from '@/components/shared/push-subscribe-button'

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date().toISOString()
  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, coach_id, status')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round">
              <rect x="4" y="9" width="12" height="9" rx="1.5"/>
              <path d="M7 9V6a3 3 0 016 0v3"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[#0D1F3C] mb-2">Lien expiré</h1>
          <p className="text-sm text-[#64748B]">
            Ce lien n&apos;est plus valide. Contactez votre coach pour recevoir un nouveau lien d&apos;accès.
          </p>
        </div>
      </div>
    )
  }

  // Mettre à jour last_seen de l'athlète
  const adminEarly = createAdminClient()
  await adminEarly
    .from('clients')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', client.id)

  // Fetch coach brand settings via admin client (profiles has RLS)
  const admin = createAdminClient()
  const [{ data: coachProfile }, { count: pendingPayments }] = await Promise.all([
    admin
      .from('profiles')
      .select('full_name, brand_color_primary, brand_font')
      .eq('id', client.coach_id)
      .single(),
    admin
      .from('client_payments')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .is('paid_date', null)
      .is('claimed_at', null),
  ])

  const brand = (coachProfile as { brand_color_primary: string | null } | null)?.brand_color_primary ?? '#4E9B6F'
  const font  = (coachProfile as { brand_font: string | null } | null)?.brand_font ?? 'Inter'
  const coachName = (coachProfile as { full_name: string | null } | null)?.full_name ?? 'Votre coach'

  return (
    <ClientThemeProvider brand={brand} font={font}>
      <div className="flex min-h-screen bg-[#F8FAFB]">
        <ClientNav
          clientName={client.full_name}
          coachName={coachName}
          token={token}
          paymentBadge={pendingPayments ?? 0}
        />
        <div className="flex-1 flex flex-col min-w-0 pb-[72px] md:pb-0">
          {children}
        </div>
        <div className="fixed bottom-[80px] right-4 z-40 md:bottom-4">
          <PushSubscribeButton token={token} />
        </div>
      </div>
    </ClientThemeProvider>
  )
}
