export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { StatistiquesView } from './statistiques-view'

export default async function StatistiquesPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { token } = await params
  const sp = await searchParams
  const coachView = sp.coach === '1'

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('magic_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (!client) redirect(`/c/${token}`)

  const admin = createAdminClient()

  const [
    { data: weightEntries },
    { data: workoutLogs },
    { data: checkins },
    { data: habitLogs },
    { data: nutritionLogs },
  ] = await Promise.all([
    admin.from('weight_entries').select('date, weight_kg').eq('client_id', client.id).order('date', { ascending: true }).limit(52),
    admin.from('workout_logs').select('log_date, completed').eq('client_id', client.id).order('log_date', { ascending: false }).limit(60),
    admin.from('checkins').select('week_number, year, submitted_at, energy_score').eq('client_id', client.id).order('submitted_at', { ascending: false }).limit(16),
    admin.from('habit_logs').select('habit_id, date, completed').eq('client_id', client.id).gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    admin.from('nutrition_logs').select('date, calories').eq('client_id', client.id).order('date', { ascending: false }).limit(30),
  ])

  return (
    <StatistiquesView
      token={token}
      coachView={coachView}
      weightEntries={(weightEntries ?? []) as { date: string; weight_kg: number }[]}
      workoutLogs={(workoutLogs ?? []) as { log_date: string; completed: boolean }[]}
      checkins={(checkins ?? []) as { week_number: number; year: number; submitted_at: string; energy_score: number | null }[]}
      habitLogs={(habitLogs ?? []) as { habit_id: string; date: string; completed: boolean }[]}
      nutritionLogs={(nutritionLogs ?? []) as { date: string; calories: number | null }[]}
    />
  )
}
