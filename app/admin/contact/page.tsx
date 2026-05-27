import { createAdminClient } from '@/lib/supabase/admin'
import { ContactContent } from './contact-content'

export const revalidate = 0

export default async function AdminContactPage() {
  const admin = createAdminClient()

  const { data: messages } = await admin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  return <ContactContent messages={messages ?? []} />
}
