import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createAdminClient()

  const [coachesRes, clientsRes, checkinsRes] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coach'),
    admin.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('checkins').select('id', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    coaches: coachesRes.count ?? 0,
    activeClients: clientsRes.count ?? 0,
    checkins: checkinsRes.count ?? 0,
  })
}
