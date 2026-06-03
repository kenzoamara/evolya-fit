import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Bloque les coaches dont l'abonnement est cancelled ou past_due.
 *
 * plan_status | Comportement
 * ------------|---------------------------------------------------
 * null        | Plan free sans Stripe → OK (limité par quotas)
 * 'active'    | Abonnement actif → OK
 * 'trial'     | Période d'essai → OK
 * 'past_due'  | Paiement en échec → BLOQUÉ
 * 'cancelled' | Abonnement résilié → BLOQUÉ
 */
export async function checkPlanActive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<{ blocked: true; response: ReturnType<typeof NextResponse.json> } | { blocked: false }> {
  const { data } = await supabase
    .from('profiles')
    .select('plan_status')
    .eq('id', userId)
    .single()

  const status = data?.plan_status as string | null

  if (status === 'cancelled') {
    return {
      blocked: true,
      response: NextResponse.json(
        { error: 'Votre abonnement a été résilié. Réabonnez-vous depuis la page Plans pour continuer.' },
        { status: 403 },
      ),
    }
  }

  if (status === 'past_due') {
    return {
      blocked: true,
      response: NextResponse.json(
        { error: 'Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement depuis la page Plans.' },
        { status: 403 },
      ),
    }
  }

  return { blocked: false }
}
