import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function buildOnboardingUpdate(body: Record<string, string | undefined>, includeComplete: boolean): Record<string, unknown> {
  const { firstName, lastName, birthDate, gender, heightCm, weightKg, mainGoal, activityLevel, injuries, dietaryHabits, avgSleepHours, sportPerformances, dailyCalories } = body
  const update: Record<string, unknown> = {}
  const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ')
  if (fullName)                   update.full_name                = fullName
  if (birthDate)                  update.birth_date               = birthDate
  if (gender)                     update.gender                   = gender
  if (heightCm)                   update.height_cm                = parseInt(heightCm, 10)
  if (weightKg)                   update.weight_kg                = parseFloat(weightKg)
  if (mainGoal)                   update.main_goal                = mainGoal
  if (activityLevel)              update.activity_level           = activityLevel
  if (injuries?.trim())           update.injuries                 = injuries.trim()
  if (dietaryHabits?.trim())      update.dietary_habits           = dietaryHabits.trim()
  if (avgSleepHours)              update.avg_sleep_hours          = parseFloat(avgSleepHours)
  if (sportPerformances?.trim())  update.sport_performances       = sportPerformances.trim()
  if (dailyCalories)              update.daily_calories_estimated = parseInt(dailyCalories, 10)
  if (includeComplete)            update.onboarding_completed_at  = new Date().toISOString()
  return update
}

/* Partial save — called after each step, does NOT complete onboarding */
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { token } = body
    if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
    const admin = createAdminClient()
    const { data: client, error } = await admin
      .from('clients').select('id')
      .eq('magic_token', token).gt('token_expires_at', new Date().toISOString()).single()
    if (error || !client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
    const update = buildOnboardingUpdate(body, false)
    if (Object.keys(update).length === 0) return NextResponse.json({ success: true })
    const { error: updateError } = await admin.from('clients').update(update as never).eq('id', client.id)
    if (updateError) return NextResponse.json({ error: 'Erreur sauvegarde.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 }) }
}

function parsePerformances(text: string): { label: string; value: number; unit: string }[] {
  const entries: { label: string; value: number; unit: string }[] = []
  const lines = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
  const pattern = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|g|km|m|min|s|rep|reps|%)?$/i
  for (const line of lines) {
    const match = line.match(pattern)
    if (!match) continue
    const label = match[1].trim()
    const value = parseFloat(match[2].replace(',', '.'))
    const unit  = match[3]?.toLowerCase() ?? 'kg'
    if (label && !isNaN(value)) entries.push({ label, value, unit })
  }
  return entries
}

/* Final submit — saves everything and marks onboarding as completed */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, sportPerformances, privacyAccepted } = body
    if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
    const admin = createAdminClient()
    const { data: client, error } = await admin
      .from('clients').select('id')
      .eq('magic_token', token).gt('token_expires_at', new Date().toISOString()).single()
    if (error || !client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
    const update = buildOnboardingUpdate(body, true)
    if (privacyAccepted === true) {
      (update as Record<string, unknown>).privacy_accepted_at = new Date().toISOString()
    }
    const { error: updateError } = await admin.from('clients').update(update as never).eq('id', client.id)
    if (updateError) {
      console.error('[onboarding] update error:', updateError.message)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
    }

    // Convertir sportPerformances texte libre → performance_entries structurées
    if (sportPerformances?.trim()) {
      const parsed = parsePerformances(sportPerformances)
      if (parsed.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        await admin.from('performance_entries').insert(
          parsed.map(p => ({
            client_id: client.id,
            date: today,
            label: p.label,
            value: p.value,
            unit: p.unit,
          }))
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
