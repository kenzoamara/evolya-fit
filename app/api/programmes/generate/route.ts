import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPlanLimits, isUnlimited } from '@/lib/plan-limits'
import { PLAN_LABELS } from '@/lib/plan-features'

export const maxDuration = 60 // secondes — nécessaire pour les plans Vercel Pro

const SYSTEM_PROMPTS: Record<string, string> = {
  sportif: `Tu es un coach sportif expert. Génère un programme d'entraînement structuré en JSON.
Règles :
- Ne génère QUE les jours d'entraînement (pas les jours de repos)
- Chaque jour a un titre court (ex: "Push - Poitrine/Épaules", "Jambes", "Full Body")
- Chaque exercice a : exercise_name, sets (number), reps (number ou null si durée), weight_kg (null si débutant ou cardio), rest_seconds (number)
- Adapte la difficulté au niveau demandé
- Varie les exercices sur la semaine`,

  nutritionnel: `Tu es un nutritionniste expert. Génère un plan nutritionnel structuré en JSON.
Règles :
- Chaque "jour" représente un type de journée (ex: "Jour entraînement", "Jour repos", "Jour déficit")
- Chaque "exercice" représente un repas
- exercise_name = TOUJOURS au format "Type: Aliment spécifique" — exemples : "Petit-déjeuner: Flocons d'avoine banane", "Déjeuner: Poulet riz brocolis", "Dîner: Saumon patate douce épinards", "Collation: Yaourt grec amandes"
- sets = null, reps = null, weight_kg = null
- notes = macros estimées EXACTEMENT au format "XXX kcal · XXg prot · XXg gluc · XXg lip" sans texte supplémentaire
- Applique ce format de manière identique sur TOUS les jours générés`,

  habitudes: `Tu es un coach de vie expert. Génère un programme d'habitudes structuré en JSON.
Règles :
- Chaque "jour" représente une semaine ou une thématique (ex: "Semaine 1 - Fondations", "Semaine 2 - Énergie")
- Chaque "exercice" représente une habitude quotidienne
- exercise_name = nom court et précis de l'habitude (ex: "Méditation 10 min", "Marche 30 min", "Journaling le soir")
- sets = null, reps = null, weight_kg = null
- notes = instruction concrète en une phrase courte (max 80 caractères)
- Applique ce format de manière identique sur TOUS les jours générés`,
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquante sur le serveur' }, { status: 500 })

  const anthropic = new Anthropic({ apiKey })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Vérifier et réinitialiser le compteur mensuel si nécessaire
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data: usageProfile } = await supabase
    .from('profiles')
    .select('plan, ai_programmes_used, usage_reset_month, usage_reset_year')
    .eq('id', user.id)
    .single()

  if (usageProfile) {
    const needsReset = usageProfile.usage_reset_month !== currentMonth || usageProfile.usage_reset_year !== currentYear
    if (needsReset) {
      await supabase.from('profiles').update({
        ai_exercises_used: 0,
        ai_programmes_used: 0,
        usage_reset_month: currentMonth,
        usage_reset_year: currentYear,
      }).eq('id', user.id)
      usageProfile.ai_programmes_used = 0
    }

    const limits = getPlanLimits(usageProfile.plan)
    if (!isUnlimited(limits.ai_programmes) && usageProfile.ai_programmes_used >= limits.ai_programmes) {
      return NextResponse.json({
        error: `Limite de ${limits.ai_programmes} programmes IA atteinte ce mois-ci sur le plan ${PLAN_LABELS[usageProfile.plan ?? 'free'] ?? usageProfile.plan}. Réinitialisation le 1er du mois prochain.`
      }, { status: 429 })
    }
  }

  const { programme_id, title, type, duration_days, description, batch_from, batch_to, total_days } = await req.json()

  // Parse metadata stored as JSON in description
  let frequency = 3, level = 'intermediaire', prompt = ''
  try {
    const meta = JSON.parse(description ?? '{}')
    frequency = meta.frequency ?? 3
    level = meta.level ?? 'intermediaire'
    prompt = meta.prompt ?? ''
  } catch { prompt = description ?? '' }

  // Verify ownership
  const { data: prog } = await supabase
    .from('programmes')
    .select('id')
    .eq('id', programme_id)
    .eq('coach_id', user.id)
    .single()
  if (!prog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Total days for this programme type
  const trainingDaysTotal: number = total_days ?? (
    type === 'sportif'
      ? Math.round((duration_days / 7) * (frequency ?? 3))
      : Math.min(duration_days, 28)
  )

  // Batch range — if not provided, generate all (legacy single-call mode)
  const from: number = batch_from ?? 1
  const to: number = batch_to ?? trainingDaysTotal

  const systemPrompt = SYSTEM_PROMPTS[type] ?? SYSTEM_PROMPTS.sportif

  const userPrompt = `
Programme : "${title}"
Type : ${type}
Durée totale : ${trainingDaysTotal} jours
Niveau : ${level ?? 'intermédiaire'}
Instructions du coach : ${prompt || 'Aucune instruction supplémentaire'}

Génère les jours ${from} à ${to} (day_number de ${from} à ${to}).
Ne génère QUE ces jours, sans intro ni commentaire.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, au format :
{
  "days": [
    {
      "day_number": ${from},
      "title": "...",
      "exercises": [
        {
          "exercise_name": "...",
          "sets": 3,
          "reps": 10,
          "weight_kg": null,
          "rest_seconds": 60,
          "notes": null
        }
      ]
    }
  ]
}
`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json(
        { error: `Batch ${from}-${to} trop long. Réduis la durée ou le nombre de séances.` },
        { status: 422 }
      )
    }

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(json)

    // Enrichir avec les instructions de la bibliothèque si le nom correspond
    // (uniquement si l'IA n'a pas déjà rempli le champ notes)
    if (type === 'sportif') {
      const { data: libExercises } = await supabase
        .from('exercises')
        .select('name, instructions')
        .or(`coach_id.eq.${user.id},is_global.eq.true`)

      if (libExercises?.length) {
        const libMap = new Map<string, string>()
        for (const ex of libExercises) {
          if (ex.name && ex.instructions) {
            libMap.set(ex.name.toLowerCase().trim(), ex.instructions)
          }
        }
        for (const day of parsed.days ?? []) {
          for (const ex of day.exercises ?? []) {
            if (!ex.notes && ex.exercise_name) {
              const instructions = libMap.get(ex.exercise_name.toLowerCase().trim())
              if (instructions) ex.notes = instructions
            }
          }
        }
      }
    }

    // Incrémenter le compteur (uniquement au premier batch pour éviter les doublons)
    if (usageProfile && (batch_from === undefined || batch_from === 1)) {
      await supabase.from('profiles').update({
        ai_programmes_used: (usageProfile.ai_programmes_used ?? 0) + 1,
      }).eq('id', user.id)
    }

    return NextResponse.json({ days: parsed.days ?? [], total_days: trainingDaysTotal })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('AI generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
