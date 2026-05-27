import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Vérifie que l'appelant a le droit d'accéder aux données du client.
 * - token fourni → magic token client
 * - pas de token → session Supabase coach
 * Retourne { allowed, isCoach } ou { allowed: false }
 */
export async function verifyMetabolicAccess(
  clientId: string,
  token?: string | null
): Promise<{ allowed: boolean; isCoach: boolean }> {
  const admin = createAdminClient()

  if (token) {
    const { data } = await admin
      .from('clients')
      .select('id, token_expires_at')
      .eq('magic_token', token)
      .eq('id', clientId)
      .single()

    if (!data) return { allowed: false, isCoach: false }

    // Verifier expiration du token si la colonne existe
    if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
      return { allowed: false, isCoach: false }
    }

    return { allowed: true, isCoach: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, isCoach: false }

  const { data } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  return { allowed: !!data, isCoach: true }
}
