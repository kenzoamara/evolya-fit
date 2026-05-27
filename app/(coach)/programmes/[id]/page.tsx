export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProgrammeBuilder } from './programme-builder'

export default async function ProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: programme } = await supabase
    .from('programmes')
    .select('*')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()
  if (!programme) redirect('/programmes')

  const admin = createAdminClient()

  const [
    { data: days },
    { data: clients },
    { data: assignments },
    { data: libraryExercises },
    { data: nutritionLibraryItems },
    { data: habitLibraryItems },
  ] = await Promise.all([
    supabase
      .from('programme_days')
      .select('id, day_number, title, notes, programme_day_exercises(id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, position)')
      .eq('programme_id', id)
      .order('day_number', { ascending: true }),

    supabase
      .from('clients')
      .select('id, full_name')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('full_name'),

    admin
      .from('programme_assignments')
      .select('id, client_id, start_date, active, clients(full_name)')
      .eq('programme_id', id)
      .eq('coach_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('exercises')
      .select('id, name, instructions, category, muscle_group, difficulty, equipment')
      .or(`coach_id.eq.${user.id},is_global.eq.true`)
      .order('name'),

    supabase
      .from('nutrition_items')
      .select('id, name, description, category')
      .or(`coach_id.eq.${user.id},is_global.eq.true`)
      .order('name'),

    supabase
      .from('habit_templates')
      .select('id, name, emoji, description, category')
      .or(`coach_id.eq.${user.id},is_global.eq.true`)
      .order('name'),
  ])

  return (
    <ProgrammeBuilder
      programme={programme}
      initialDays={(days ?? []) as Parameters<typeof ProgrammeBuilder>[0]['initialDays']}
      clients={clients ?? []}
      assignments={(assignments ?? []) as unknown as Parameters<typeof ProgrammeBuilder>[0]['assignments']}
      libraryExercises={(libraryExercises ?? []) as Parameters<typeof ProgrammeBuilder>[0]['libraryExercises']}
      nutritionLibraryItems={(nutritionLibraryItems ?? []) as Parameters<typeof ProgrammeBuilder>[0]['nutritionLibraryItems']}
      habitLibraryItems={(habitLibraryItems ?? []) as Parameters<typeof ProgrammeBuilder>[0]['habitLibraryItems']}
    />
  )
}
