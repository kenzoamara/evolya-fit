export type PlanConfig = { plan: string; client_limit: number }

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  starter_monthly:   { plan: 'starter',   client_limit: 10   },
  starter_annual:    { plan: 'starter',   client_limit: 10   },
  growth_monthly:    { plan: 'growth',    client_limit: 25   },
  growth_annual:     { plan: 'growth',    client_limit: 25   },
  pro_monthly:       { plan: 'pro',       client_limit: 45   },
  pro_annual:        { plan: 'pro',       client_limit: 45   },
  scale_monthly:     { plan: 'scale',     client_limit: 100  },
  scale_annual:      { plan: 'scale',     client_limit: 100  },
  elite_monthly:     { plan: 'elite',     client_limit: 250  },
  elite_annual:      { plan: 'elite',     client_limit: 250  },
  unlimited_monthly: { plan: 'unlimited', client_limit: 9999 },
  unlimited_annual:  { plan: 'unlimited', client_limit: 9999 },
  // Legacy
  starter:  { plan: 'starter', client_limit: 10 },
  standard: { plan: 'growth',  client_limit: 25 },
  annual:   { plan: 'growth',  client_limit: 25 },
}

/** Retrouve la config depuis un price_id Stripe */
export function getPlanFromPriceId(priceId: string): PlanConfig | null {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER_MONTHLY!]:   'starter_monthly',
    [process.env.STRIPE_PRICE_STARTER_ANNUAL!]:    'starter_annual',
    [process.env.STRIPE_PRICE_GROWTH_MONTHLY!]:    'growth_monthly',
    [process.env.STRIPE_PRICE_GROWTH_ANNUAL!]:     'growth_annual',
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]:       'pro_monthly',
    [process.env.STRIPE_PRICE_PRO_ANNUAL!]:        'pro_annual',
    [process.env.STRIPE_PRICE_SCALE_MONTHLY!]:     'scale_monthly',
    [process.env.STRIPE_PRICE_SCALE_ANNUAL!]:      'scale_annual',
    [process.env.STRIPE_PRICE_ELITE_MONTHLY!]:     'elite_monthly',
    [process.env.STRIPE_PRICE_ELITE_ANNUAL!]:      'elite_annual',
    [process.env.STRIPE_PRICE_UNLIMITED_MONTHLY!]: 'unlimited_monthly',
    [process.env.STRIPE_PRICE_UNLIMITED_ANNUAL!]:  'unlimited_annual',
  }
  const key = map[priceId]
  return key ? (PLAN_CONFIG[key] ?? null) : null
}

/** Retrouve la config depuis les métadonnées ou le price_id (dans cet ordre) */
export function resolvePlanConfig(
  priceKey: string | undefined,
  priceId:  string | undefined,
): PlanConfig | null {
  if (priceKey) {
    const c = PLAN_CONFIG[priceKey]
    if (c) return c
  }
  if (priceId) return getPlanFromPriceId(priceId)
  return null
}
