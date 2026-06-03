import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/relances/recent
// Returns the most recent relance for each client (for the current coach)
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get latest relance per client for this coach
  // Using DISTINCT ON to get only the most recent one per client
  const { data, error } = await supabase
    .from('relances')
    .select('client_id, sent_at, created_at')
    .eq('coach_id', user.id)
    .order('sent_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by client_id and keep only the latest per client
  const latestByClient = new Map()
  for (const relance of data || []) {
    if (!latestByClient.has(relance.client_id)) {
      latestByClient.set(relance.client_id, relance)
    }
  }

  const relances = Array.from(latestByClient.values())

  return NextResponse.json({ relances })
}
