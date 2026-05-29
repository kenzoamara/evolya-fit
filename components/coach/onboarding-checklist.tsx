'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

type Step = {
  id: string
  label: string
  href: string
  done: boolean
}

type Props = {
  coachId: string
  hasBranding: boolean
  hasClients: boolean
  hasProgrammes: boolean
  hasMessage: boolean
}

const LS_KEY_PREFIX = 'onboarding_checklist_dismissed_'

export function OnboardingChecklist({ coachId, hasBranding, hasClients, hasProgrammes, hasMessage }: Props) {
  const [dismissed, setDismissed] = useState(true) // start hidden — reveal after mount
  const [mounted, setMounted] = useState(false)

  const steps: Step[] = [
    { id: 'branding',   label: 'Personnalise ton espace',      href: '/personnalisation',   done: hasBranding },
    { id: 'client',     label: 'Ajoute un athlète',            href: '/clients',             done: hasClients },
    { id: 'programme',  label: 'Crée un programme',            href: '/programmes',          done: hasProgrammes },
    { id: 'message',    label: 'Envoie ton premier message',   href: '/messagerie',          done: hasMessage },
  ]

  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length
  const lsKey = `${LS_KEY_PREFIX}${coachId}`

  useEffect(() => {
    setMounted(true)
    const isDismissed = !!localStorage.getItem(lsKey)
    setDismissed(isDismissed)
  }, [lsKey])

  function dismiss() {
    localStorage.setItem(lsKey, '1')
    setDismissed(true)
  }

  if (!mounted || dismissed) return null

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[14px] font-bold text-[#0D1F3C] whitespace-nowrap">
              {allDone ? 'Configuration terminée' : "Bienvenue sur Evolya'Fit"}
            </p>
            {/* Progress blocks */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-[3px]">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="h-[6px] w-6 rounded-full transition-all duration-500"
                    style={{ backgroundColor: s.done ? 'var(--brand)' : '#E2E8F0' }}
                  />
                ))}
              </div>
              <span className="text-[12px] font-semibold tabular-nums" style={{ color: allDone ? 'var(--brand)' : '#94A3B8' }}>
                {doneCount}/{steps.length}
              </span>
            </div>
          </div>
          {!allDone && (
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              {steps.length - doneCount} étape{steps.length - doneCount > 1 ? 's' : ''} restante{steps.length - doneCount > 1 ? 's' : ''} pour finaliser ton espace.
            </p>
          )}
        </div>

        <button
          onClick={dismiss}
          className="flex-shrink-0 text-[#CBD5E1] hover:text-[#94A3B8] transition-colors p-0.5"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-0 divide-y divide-[#F1F5F9]">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            {/* Status icon */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={step.done
                ? { backgroundColor: 'var(--brand)' }
                : { border: '2px solid #E2E8F0', backgroundColor: 'transparent' }
              }
            >
              {step.done && <Check size={10} strokeWidth={3} className="text-white" />}
            </div>

            {/* Label */}
            <p
              className="flex-1 text-[13px] transition-colors"
              style={{ color: step.done ? '#94A3B8' : '#0D1F3C', textDecoration: step.done ? 'line-through' : 'none' }}
            >
              {step.label}
            </p>

            {/* CTA */}
            {!step.done && (
              <Link
                href={step.href}
                className="flex-shrink-0 text-[12px] font-semibold hover:underline transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                Commencer →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* All done message */}
      {allDone && (
        <div
          className="mt-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: 'var(--brand-bg)' }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Check size={10} strokeWidth={3} className="text-white" />
          </div>
          <p className="text-[12px] font-medium" style={{ color: 'var(--brand)' }}>
            Tout est prêt — ton espace est opérationnel.
          </p>
          <button
            onClick={dismiss}
            className="ml-auto text-[11px] font-semibold hover:underline"
            style={{ color: 'var(--brand)' }}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}
