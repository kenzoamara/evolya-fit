import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanLimits, isUnlimited } from '@/lib/plan-limits'

// POST /api/clients/import-csv
// Body: { clients: { nom: string; email: string }[] }
// Returns: { created: number; skipped: number; errors: string[] }
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

  const { clients: rows } = await req.json() as { clients: { nom: string; email: string }[] }
  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: 'Aucun athlète à importer.' }, { status: 400 })
  if (rows.length > 100) return NextResponse.json({ error: 'Maximum 100 athlètes par import.' }, { status: 400 })

  const admin = createAdminClient()

  // Check capacity
  const limits = getPlanLimits(profile.plan)
  const { count: currentCount } = await admin.from('clients').select('id', { count: 'exact', head: true }).eq('coach_id', user.id).eq('status', 'active')
  const available = isUnlimited(limits.clients) ? 9999 : limits.clients - (currentCount ?? 0)
  if (available <= 0) return NextResponse.json({ error: `Limite athlètes atteinte sur votre plan. Passez au plan supérieur pour importer.` }, { status: 403 })

  // Fetch existing emails to detect duplicates
  const { data: existingClients } = await admin.from('clients').select('email').eq('coach_id', user.id)
  const existingEmails = new Set((existingClients ?? []).map(c => c.email.toLowerCase()))

  let created = 0; let skipped = 0
  const errors: string[] = []
  const toInsert = rows.slice(0, available)

  for (const row of toInsert) {
    const email = row.email.trim().toLowerCase()
    const nom = row.nom.trim()
    if (!nom || !email || !email.includes('@')) { errors.push(`Ligne ignorée : "${nom}" / "${email}"`); skipped++; continue }
    if (existingEmails.has(email)) { skipped++; continue }

    const magicToken = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 10 * 365 * 86400000).toISOString()

    const { error: insertError } = await admin.from('clients').insert({
      coach_id: user.id,
      full_name: nom,
      email,
      magic_token: magicToken,
      token_expires_at: tokenExpiresAt,
      status: 'active',
    })

    if (insertError) {
      if (insertError.code === '23505') { skipped++ } // duplicate key
      else { errors.push(`Erreur pour "${nom}" : ${insertError.message}`); skipped++ }
    } else {
      created++
      existingEmails.add(email)
    }
  }

  const totalSkippedCapacity = rows.length - toInsert.length
  const finalSkipped = skipped + totalSkippedCapacity

  return NextResponse.json({ created, skipped: finalSkipped, errors })
}
