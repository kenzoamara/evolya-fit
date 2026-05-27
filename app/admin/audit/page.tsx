export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { AuditContent } from './audit-content'

export default async function AuditPage() {
  const admin = createAdminClient()

  // 7 derniers jours par défaut
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: logs } = await admin
    .from('audit_logs')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500)

  return <AuditContent logs={logs ?? []} />
}
