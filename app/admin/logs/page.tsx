import { createAdminClient } from '@/lib/supabase/admin'
import { LogsContent } from './logs-content'

export const revalidate = 0

export default async function AdminLogsPage() {
  const supabase = createAdminClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return <LogsContent logs={logs ?? []} />
}
