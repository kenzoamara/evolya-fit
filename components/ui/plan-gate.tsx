import Link from 'next/link'
import { Lock } from 'lucide-react'
import { hasAccess, FEATURE_PLANS, PLAN_LABELS, type FeatureKey } from '@/lib/plan-features'

interface PlanGateProps {
  featureKey: FeatureKey
  userPlan: string | null | undefined
  children: React.ReactNode
  fullPage?: boolean
}

export function PlanGate({ featureKey, userPlan, children, fullPage }: PlanGateProps) {
  if (hasAccess(userPlan, featureKey)) return <>{children}</>

  const feature = FEATURE_PLANS[featureKey]
  const planLabel = PLAN_LABELS[feature.requiredPlan]

  if (fullPage) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-[#94A3B8]" />
        </div>
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#94A3B8] mb-2">
          Fonctionnalite verrouillee
        </p>
        <h2 className="text-[20px] font-bold text-[#0D1F3C] mb-2">{feature.label}</h2>
        <p className="text-[13px] text-[#64748B] mb-7 max-w-xs leading-relaxed">
          Cette fonctionnalite est disponible a partir du plan{' '}
          <strong className="text-[#0D1F3C]">{planLabel}</strong>.
        </p>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D1F3C] text-white text-[13.5px] font-semibold hover:bg-[#152E55] transition-colors"
        >
          Passer au plan {planLabel}
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
            <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden min-h-[120px]">
      <div className="absolute inset-0 z-10 backdrop-blur-[3px] bg-white/80 flex flex-col items-center justify-center gap-3 p-4 rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#64748B]" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">{feature.label}</p>
          <p className="text-[11px] text-[#64748B]">
            Disponible avec le plan <strong>{planLabel}</strong>
          </p>
        </div>
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D1F3C] text-white text-[12px] font-semibold hover:bg-[#152E55] transition-colors"
        >
          Passer au plan {planLabel}
        </Link>
      </div>
      <div className="pointer-events-none select-none opacity-20 blur-[2px]" aria-hidden>
        {children}
      </div>
    </div>
  )
}
