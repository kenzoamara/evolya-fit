import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupportContent } from './support-content'

export const revalidate = 0

export default async function AdminSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()
  const { data: tickets } = await adminClient
    .from('support_tickets')
    .select('*, profiles(full_name, email, plan)')
    .order('last_activity_at', { ascending: false })

  return (
    <SupportContent
      tickets={(tickets ?? []) as any[]}
      adminId={user!.id}
    />
  )
}
