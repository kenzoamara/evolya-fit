export type PlanId = 'free' | 'trial' | 'starter' | 'growth' | 'pro'

const PLAN_ORDER: Record<string, number> = {
  free:    0,
  trial:   0,
  starter: 1,
  growth:  2,
  pro:     3,
}

export const PLAN_LABELS: Record<string, string> = {
  free:    'Découverte',
  trial:   'Découverte',
  starter: 'Lancement',
  growth:  'Croissance',
  pro:     'Pro',
}

export type FeatureKey =
  | 'notes_seance'
  | 'suivi_direct'
  | 'mensurations'
  | 'stats_perf'
  | 'habitudes'
  | 'relance_inactifs'
  | 'messagerie'
  | 'rappels_checkin'
  | 'rappels_paiement'
  | 'rapports_hebdo'
  | 'stats_croissance'
  | 'photo_profil'
  | 'blog'
  | 'calculatrice'

export const FEATURE_PLANS: Record<FeatureKey, { label: string; requiredPlan: PlanId }> = {
  notes_seance:     { label: 'Notes de séance',                     requiredPlan: 'starter' },
  suivi_direct:     { label: 'Suivi des séances en direct',         requiredPlan: 'starter' },
  mensurations:     { label: 'Suivi des mensurations',              requiredPlan: 'growth'  },
  stats_perf:       { label: 'Statistiques de performance & PR',    requiredPlan: 'starter' },
  habitudes:        { label: 'Suivi des habitudes',                 requiredPlan: 'growth'  },
  relance_inactifs: { label: 'Relance des membres inactifs',        requiredPlan: 'starter' },
  messagerie:       { label: 'Messagerie intégrée',                 requiredPlan: 'starter' },
  rappels_checkin:  { label: 'Rappels automatiques de check-in',    requiredPlan: 'growth'  },
  rappels_paiement: { label: 'Rappels automatiques de paiement',    requiredPlan: 'starter' },
  rapports_hebdo:   { label: 'Rapports hebdomadaires automatiques', requiredPlan: 'starter' },
  stats_croissance: { label: 'Statistiques de croissance',          requiredPlan: 'growth'  },
  photo_profil:     { label: 'Photo de profil',                     requiredPlan: 'growth'  },
  blog:             { label: 'Blog',                                requiredPlan: 'growth'  },
  calculatrice:     { label: 'Calculatrice intégrée',               requiredPlan: 'growth'  },
}

export function hasAccess(userPlan: string | null | undefined, featureKey: FeatureKey): boolean {
  const plan = (userPlan ?? 'free') as string
  const userLevel = PLAN_ORDER[plan] ?? 0
  const requiredLevel = PLAN_ORDER[FEATURE_PLANS[featureKey].requiredPlan]
  return userLevel >= requiredLevel
}
