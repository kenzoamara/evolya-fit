import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPlanLimits, isUnlimited } from '@/lib/plan-limits'
import { PLAN_LABELS } from '@/lib/plan-features'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { name, equipment } = await req.json()

    // Vérifier et réinitialiser le compteur mensuel si nécessaire
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, ai_exercises_used, usage_reset_month, usage_reset_year')
      .eq('id', user.id)
      .single()

    if (profile) {
      const needsReset = profile.usage_reset_month !== currentMonth || profile.usage_reset_year !== currentYear
      if (needsReset) {
        await supabase.from('profiles').update({
          ai_exercises_used: 0,
          ai_programmes_used: 0,
          usage_reset_month: currentMonth,
          usage_reset_year: currentYear,
        }).eq('id', user.id)
        profile.ai_exercises_used = 0
      }

      const limits = getPlanLimits(profile.plan)
      if (!isUnlimited(limits.ai_exercises) && profile.ai_exercises_used >= limits.ai_exercises) {
        return NextResponse.json({
          error: `Limite de ${limits.ai_exercises} générations IA atteinte ce mois-ci sur le plan ${PLAN_LABELS[profile.plan ?? 'free'] ?? profile.plan}. Réinitialisation le 1er du mois prochain.`
        }, { status: 429 })
      }
    }
    if (!name?.trim()) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })

    const equipmentList = (equipment ?? 'aucun').trim()
    const equipmentNote = equipmentList === 'aucun'
      ? 'Aucun équipement (exercice au poids du corps).'
      : `Équipement disponible : ${equipmentList}. Utilise TOUT cet équipement dans les instructions (position, installation, mouvement).`

    const prompt = `Tu es un expert en préparation physique. Génère les informations pour cet exercice en JSON.

Exercice : "${name.trim()}"
${equipmentNote}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "category": "force" | "cardio" | "mobilite" | "hiit" | "stretching",
  "muscle_group": "muscle principal travaillé (en français, ex: Pectoraux)",
  "muscles": ["muscle secondaire 1", "muscle secondaire 2"],
  "difficulty": "debutant" | "intermediaire" | "avance",
  "instructions": "Étape 1\\nÉtape 2\\nÉtape 3\\nÉtape 4\\nÉtape 5"
}

Règles :
- instructions : 4 à 5 étapes précises et courtes, séparées par \\n. Commence par décrire la position de départ (assis sur banc, debout, allongé…) et mentionne chaque équipement dès la première étape.
- muscle_group : UN seul muscle principal (ex: Pectoraux, Dos, Quadriceps...)
- muscles : 1 à 3 muscles secondaires maximum
- difficulty : basé sur la complexité technique de l'exercice avec cet équipement`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Extract JSON even if Claude wraps it in ```json blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Réponse IA invalide.' }, { status: 500 })

    const data = JSON.parse(jsonMatch[0])

    const VALID_CATS = ['force', 'cardio', 'mobilite', 'hiit', 'stretching']
    const VALID_DIFFS = ['debutant', 'intermediaire', 'avance']

    // Incrémenter le compteur
    if (profile) {
      await supabase.from('profiles').update({
        ai_exercises_used: (profile.ai_exercises_used ?? 0) + 1,
      }).eq('id', user.id)
    }

    return NextResponse.json({
      category:     VALID_CATS.includes(data.category) ? data.category : 'force',
      muscle_group: typeof data.muscle_group === 'string' ? data.muscle_group : '',
      muscles:      Array.isArray(data.muscles) ? data.muscles : [],
      difficulty:   VALID_DIFFS.includes(data.difficulty) ? data.difficulty : 'intermediaire',
      instructions: typeof data.instructions === 'string' ? data.instructions : '',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('generate exercise error:', msg)
    if (msg.includes('credit balance is too low') || msg.includes('insufficient') || msg.includes('402')) {
      return NextResponse.json({ error: 'Crédits IA épuisés. Remplis les champs manuellement.' }, { status: 402 })
    }
    return NextResponse.json({ error: 'Erreur lors de la génération IA.' }, { status: 500 })
  }
}
