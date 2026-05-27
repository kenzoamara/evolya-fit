import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { name, equipment } = await req.json()
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
