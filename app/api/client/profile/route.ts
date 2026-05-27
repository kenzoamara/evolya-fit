import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const {
      clientId, magicToken, fullName,
      birthDate, gender, heightCm, weightKg,
      mainGoal, activityLevel, injuries, dietaryHabits,
      avgSleepHours, sportPerformances, dailyCalories,
    } = body

    if (!clientId || !magicToken) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }
    if (fullName !== undefined && !fullName?.trim()) {
      return NextResponse.json({ error: 'Nom invalide.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('magic_token', magicToken)
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (!client) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const updates: Record<string, unknown> = {}
    if (fullName !== undefined)           updates.full_name                = fullName.trim()
    if (birthDate !== undefined)          updates.birth_date               = birthDate || null
    if (gender !== undefined)             updates.gender                   = gender || null
    if (heightCm !== undefined)           updates.height_cm                = heightCm ? parseInt(heightCm, 10) : null
    if (weightKg !== undefined)           updates.weight_kg                = weightKg ? parseFloat(weightKg) : null
    if (mainGoal !== undefined)           updates.main_goal                = mainGoal || null
    if (activityLevel !== undefined)      updates.activity_level           = activityLevel || null
    if (injuries !== undefined)           updates.injuries                 = injuries?.trim() || null
    if (dietaryHabits !== undefined)      updates.dietary_habits           = dietaryHabits?.trim() || null
    if (avgSleepHours !== undefined)      updates.avg_sleep_hours          = avgSleepHours ? parseFloat(avgSleepHours) : null
    if (sportPerformances !== undefined)  updates.sport_performances       = sportPerformances?.trim() || null
    if (dailyCalories !== undefined)      updates.daily_calories_estimated = dailyCalories ? parseInt(dailyCalories, 10) : null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour.' }, { status: 400 })
    }

    const { error } = await admin.from('clients').update(updates).eq('id', clientId)
    if (error) return NextResponse.json({ error: 'Erreur mise à jour.' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[client/profile]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
