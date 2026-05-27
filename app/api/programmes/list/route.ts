import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/programmes/list             → list coach's programmes
// GET /api/programmes/list?days=1&programme_id=xxx → list days for a programme
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wantDays = req.nextUrl.searchParams.get('days') === '1'
  const programmeId = req.nextUrl.searchParams.get('programme_id')

  if (wantDays && programmeId) {
    // Verify ownership
    const { data: prog } = await supabase
      .from('programmes')
      .select('id')
      .eq('id', programmeId)
      .eq('coach_id', user.id)
      .single()
    if (!prog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: days } = await supabase
      .from('programme_days')
      .select('id, day_number, title')
      .eq('programme_id', programmeId)
      .order('day_number', { ascending: true })

    return NextResponse.json({ days: days ?? [] })
  }

  // List all coach programmes
  const { data: programmes } = await supabase
    .from('programmes')
    .select('id, title, type')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ programmes: programmes ?? [] })
}
