export type PlanLimits = {
  clients: number        // -1 = illimité
  exercises: number      // exercices visibles dans la bibliothèque
  ai_exercises: number   // générations IA exercices / mois
  ai_programmes: number  // générations IA programmes / mois
  themes: number         // -1 = illimité
  habitudes: boolean     // accès à la bibliothèque habitudes
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free:    { clients: 1,   exercises: 100,  ai_exercises: 10,  ai_programmes: 1,   themes: 2,  habitudes: false },
  trial:   { clients: 1,   exercises: 100,  ai_exercises: 10,  ai_programmes: 1,   themes: 2,  habitudes: false },
  starter: { clients: 10,  exercises: 500,  ai_exercises: 150, ai_programmes: 100, themes: 5,  habitudes: false },
  growth:  { clients: 25,  exercises: 1000, ai_exercises: 300, ai_programmes: 200, themes: -1, habitudes: true  },
  pro:     { clients: 45,  exercises: -1,   ai_exercises: -1,  ai_programmes: -1,  themes: -1, habitudes: true  },
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? 'free'] ?? PLAN_LIMITS.free
}

export function isUnlimited(value: number): boolean {
  return value === -1
}

export function formatLimit(value: number, unit?: string): string {
  if (value === -1) return 'Illimité'
  return unit ? `${value} ${unit}` : String(value)
}
