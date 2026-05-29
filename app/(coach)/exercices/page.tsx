import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExercicesContent } from './exercices-content'
import type { Profile } from '@/types/database'
import { getPlanLimits, isUnlimited } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

export type Exercise = {
  id: string
  coach_id: string | null
  name: string
  category: 'force' | 'cardio' | 'mobilite' | 'hiit' | 'stretching'
  muscle_group: string
  muscles: string[]
  equipment: string
  difficulty: 'debutant' | 'intermediaire' | 'avance'
  instructions: string
  youtube_url: string | null
  is_global: boolean
  created_at: string
}

export type NutritionItem = {
  id: string
  coach_id: string | null
  name: string
  category: 'proteines' | 'glucides' | 'lipides' | 'hydratation' | 'conseil' | 'complements' | 'repas'
  objectif: 'prise de masse' | 'perte de poids' | 'maintien' | 'performance' | 'recomposition corporelle' | null
  description: string
  calories_total: number | null
  calories_breakdown: Record<string, number> | null
  is_global: boolean
  created_at: string
}

export type HabitTemplate = {
  id: string
  coach_id: string | null
  name: string
  emoji: string
  category: 'sport' | 'nutrition' | 'sommeil' | 'bien-etre' | 'mental'
  description: string
  objectif: string | null
  is_global: boolean
  created_at: string
}

export default async function ExercicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const limits = getPlanLimits((profile as Profile).plan)
  const exerciseMax = isUnlimited(limits.exercises) ? 4999 : limits.exercises - 1

  // Compteur usage IA mensuel (reset si nouveau mois)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const typedProfile = profile as Profile
  const aiExercisesUsed = (typedProfile.usage_reset_month === currentMonth && typedProfile.usage_reset_year === currentYear)
    ? (typedProfile.ai_exercises_used ?? 0)
    : 0

  const [
    { data: exercises },
    { data: nutritionItems },
    { data: habitTemplates },
  ] = await Promise.all([
    supabase.from('exercises').select('*').order('name').range(0, exerciseMax),
    supabase.from('nutrition_items').select('*').order('name').range(0, 4999),
    supabase.from('habit_templates').select('*').order('name').range(0, 4999),
  ])

  return (
    <ExercicesContent
      profile={profile as Profile}
      exercises={(exercises ?? []) as Exercise[]}
      nutritionItems={(nutritionItems ?? []) as NutritionItem[]}
      habitTemplates={(habitTemplates ?? []) as HabitTemplate[]}
      coachId={user.id}
      exerciseLimit={limits.exercises}
      aiExercisesUsed={aiExercisesUsed}
      aiExercisesLimit={limits.ai_exercises}
    />
  )
}
