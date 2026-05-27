import { createAdminClient } from '@/lib/supabase/admin'
import { EmailsContent } from './emails-content'

export const revalidate = 0

export default async function AdminEmailsPage() {
  const supabase = createAdminClient()

  const { data: history } = await supabase
    .from('email_scheduled')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  return <EmailsContent history={history ?? []} notifications={notifications ?? []} />
}
