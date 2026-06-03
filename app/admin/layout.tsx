import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminNav } from './admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()

  const [{ count: openTickets }, { count: unreadContact }] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    adminClient
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('read', false),
  ])

  return (
    <div className="flex min-h-dvh bg-[#F1F5F9]">
      <AdminNav
        adminName={profile.full_name ?? 'Admin'}
        openTickets={openTickets ?? 0}
        unreadContact={unreadContact ?? 0}
      />
      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0">
        {children}
      </div>
    </div>
  )
}
