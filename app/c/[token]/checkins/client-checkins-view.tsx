'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWeekNumber } from '@/lib/utils'
import { formatDateShort } from '@/lib/utils'
import type { Client, Checkin } from '@/types/database'
import { useIsCoachView } from '@/hooks/use-coach-view'

type Props = {
  client: Client
  checkins: Checkin[]
}

function isInsideCheckinWindow(now: Date): boolean {
  const dow = now.getDay()
  const hour = now.getHours()
  if (dow === 6 && hour >= 8) return true
  if (dow === 0) return true
  return false
}

const STEPS = [
  {
    key: 'q1' as const,
    question: 'Comment vous sentez-vous cette semaine ?',
    hint: 'Physiquement, mentalement, niveau d\'énergie...',
    placeholder: 'Ex : Je me sens bien, un peu fatigué mais motivé...',
  },
  {
    key: 'q2' as const,
    question: 'Avez-vous progressé sur vos objectifs ?',
    hint: 'Ce que vous avez accompli, vos efforts, vos victoires',
    placeholder: 'Ex : J\'ai respecté mes 3 entraînements...',
  },
  {
    key: 'q3' as const,
    question: 'Qu\'est-ce qui vous a bloqué ?',
    hint: 'Obstacles rencontrés et ce dont vous avez besoin',
    placeholder: 'Ex : J\'ai du mal avec la récupération...',
  },
]

export function ClientCheckinsView({ client, checkins }: Props) {
  const router = useRouter()
  const isCoachView = useIsCoachView()
  const now = new Date()
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()
  const hasCheckinThisWeek = checkins.some(c => c.week_number === currentWeek && c.year === currentYear)

  const insideWindow = isInsideCheckinWindow(now)

  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(5)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          weekNumber: currentWeek,
          year: currentYear,
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setSuccess(true)
      setTimeout(() => router.refresh(), 1500)
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#0D1F3C] tracking-tight">Check-ins</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Tenez votre coach informé chaque semaine</p>
      </div>

      {/* Note soumission en retard */}
      {!insideWindow && !hasCheckinThisWeek && (
        <div className="bg-[#FFF7ED] border border-[#FDE68A] rounded-xl px-4 py-3 flex items-start gap-3 mb-5">
          <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 9.5v.3"/></svg>
          <p className="text-xs text-[#92400E] leading-relaxed">
            Le créneau habituel (sam. 8h – dim. 23h59) est passé, mais vous pouvez encore soumettre votre check-in de la semaine.
          </p>
        </div>
      )}

      {/* Bandeau mode spectateur */}
      {isCoachView && (
        <div className="mb-5 px-4 py-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 9.5v.3"/></svg>
          <p className="text-[12px] text-[#92400E] font-medium">Mode spectateur — soumission du check-in désactivée.</p>
        </div>
      )}

      {/* Formulaire */}
      {!isCoachView && !hasCheckinThisWeek && !success && (
        <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden mb-6">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
            <div>
              <h2 className="text-sm font-semibold text-[#0D1F3C]">Check-in · Semaine {currentWeek}</h2>
              <p className="text-xs text-[#64748B]">3 questions · ~2 minutes</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-[#E2E8F0]">
            {STEPS.map((step, index) => (
              <div key={step.key} className="px-5 py-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--brand-bg)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--brand)' }}>{index + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-[#0D1F3C] leading-snug">
                      {step.question}
                    </label>
                    <p className="text-xs text-[#64748B] mt-0.5">{step.hint}</p>
                  </div>
                </div>
                <textarea
                  value={answers[step.key]}
                  onChange={e => setAnswers(prev => ({ ...prev, [step.key]: e.target.value }))}
                  rows={3}
                  placeholder={step.placeholder}
                  className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[var(--brand)] transition-all resize-none"
                />
              </div>
            ))}

            <div className="px-5 py-4 bg-[#F8FAFB]">
              {error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-brand text-sm font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ boxShadow: '0 1px 2px rgba(97,128,112,0.2)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : 'Envoyer mon check-in →'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Succès */}
      {success && (
        <div className="rounded-xl px-5 py-5 flex items-center gap-4 mb-6 border" style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'color-mix(in srgb, var(--brand) 30%, transparent)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l3.5 3.5L14 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0D1F3C]">Check-in envoyé !</p>
            <p className="text-xs text-[#64748B] mt-0.5">Votre coach a été notifié. À la semaine prochaine !</p>
          </div>
        </div>
      )}

      {hasCheckinThisWeek && !success && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-3 mb-6 border" style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'color-mix(in srgb, var(--brand) 30%, transparent)' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm text-[#4A7A4E] font-medium">
            Check-in de la semaine {currentWeek} déjà complété. À la semaine prochaine !
          </p>
        </div>
      )}

      {/* Historique */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#0D1F3C] tracking-tight">Historique</h2>
          {checkins.length > 0 && (
            <span className="text-xs text-[#64748B]">{checkins.length} check-in{checkins.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {checkins.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-10 text-center text-sm text-[#64748B]">
            Aucun check-in pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-1.5">
            {checkins.slice(0, visibleCount).map(c => (
              <div key={c.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F8FAFB] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }} />
                    <span className="text-sm font-medium text-[#0D1F3C]">Semaine {c.week_number}</span>
                    <span className="text-xs text-[#94A3B8]">{formatDateShort(c.submitted_at)}</span>
                  </div>
                  <span className={`text-[#94A3B8] text-xs transition-transform duration-200 ${expandedId === c.id ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {expandedId === c.id && (
                  <div className="border-t border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                    {c.q1_answer && (
                      <div className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Ressenti</p>
                        <p className="text-sm text-[#0D1F3C] leading-relaxed">{c.q1_answer}</p>
                      </div>
                    )}
                    {c.q2_answer && (
                      <div className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Progression</p>
                        <p className="text-sm text-[#0D1F3C] leading-relaxed">{c.q2_answer}</p>
                      </div>
                    )}
                    {c.q3_answer && (
                      <div className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Blocages</p>
                        <p className="text-sm text-[#0D1F3C] leading-relaxed">{c.q3_answer}</p>
                      </div>
                    )}
                    {!c.q1_answer && !c.q2_answer && !c.q3_answer && (
                      <div className="px-4 py-3.5">
                        <p className="text-sm text-[#94A3B8] italic">Aucun contenu pour ce check-in.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {checkins.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(v => v + 10)}
                className="w-full py-3 text-sm text-[#64748B] hover:text-[#4E9B6F] transition-colors"
              >
                Voir {Math.min(checkins.length - visibleCount, 10)} de plus
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
