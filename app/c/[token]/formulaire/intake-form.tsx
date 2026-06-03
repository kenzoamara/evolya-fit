'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

type Question = {
  id: string
  question: string
  type: 'text' | 'textarea' | 'yesno' | 'scale' | 'choice'
  options: string[] | null
  required: boolean
}

type Props = {
  token: string
  formId: string
  formTitle: string
  questions: Question[]
  clientName: string
}

const BRAND = 'var(--brand)'

export function IntakeForm({ token, formId, formTitle, questions, clientName }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function setAnswer(questionId: string, value: string) {
    setAnswers(a => ({ ...a, [questionId]: value }))
  }

  function canSubmit() {
    return questions.every(q => !q.required || !!answers[q.id]?.trim())
  }

  async function handleSubmit() {
    setSubmitting(true)
    await fetch('/api/intake-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, formId, answers }),
    })
    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#F8FAFB] flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full space-y-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
            style={{ backgroundColor: BRAND }}
          >
            <Check size={36} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0D1F3C] mb-2">Merci !</h1>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Vos réponses ont bien été transmises à votre coach.
              Vous pouvez maintenant accéder à votre espace.
            </p>
          </div>
          <button
            onClick={() => router.push(`/c/${token}/dashboard`)}
            className="w-full py-3.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
            style={{ backgroundColor: BRAND }}
          >
            Accéder à mon espace →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8FAFB] overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 sm:px-10 py-8 min-h-full flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <Logo height={26} variant="default" />
          <span className="text-xs text-[#94A3B8]">{questions.length} question{questions.length > 1 ? 's' : ''}</span>
        </div>

        {/* Titre */}
        <div className="mb-8 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: BRAND }}>
            Questionnaire
          </p>
          <h1 className="text-[26px] font-semibold text-[#0D1F3C] leading-tight mb-2">
            {formTitle}
          </h1>
          <p className="text-sm text-[#64748B]">
            Ces informations aident votre coach à mieux vous accompagner.
          </p>
        </div>

        {/* Questions */}
        <div className="flex-1 space-y-5">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
              <label className="block text-sm font-medium text-[#0D1F3C]">
                {i + 1}. {q.question}
                {q.required && <span className="text-[#EF4444] ml-1">*</span>}
              </label>

              {/* Text */}
              {q.type === 'text' && (
                <input
                  value={answers[q.id] ?? ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Votre réponse..."
                  className="w-full px-4 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-all"
                />
              )}

              {/* Textarea */}
              {q.type === 'textarea' && (
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder="Votre réponse..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-all resize-none"
                />
              )}

              {/* Oui / Non */}
              {q.type === 'yesno' && (
                <div className="flex gap-3">
                  {['Oui', 'Non'].map(val => {
                    const sel = answers[q.id] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAnswer(q.id, val)}
                        className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={sel ? { borderColor: BRAND, backgroundColor: 'color-mix(in srgb, var(--brand) 10%, white)', color: BRAND } : { borderColor: '#E2E8F0', backgroundColor: 'white', color: '#64748B' }}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Echelle 1-5 */}
              {q.type === 'scale' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => {
                    const sel = answers[q.id] === String(n)
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, String(n))}
                        className="flex-1 aspect-square rounded-xl border-2 text-sm font-bold transition-all"
                        style={sel ? { borderColor: BRAND, backgroundColor: BRAND, color: 'white' } : { borderColor: '#E2E8F0', backgroundColor: 'white', color: '#64748B' }}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Choix multiple */}
              {q.type === 'choice' && (
                <div className="space-y-2">
                  {(q.options ?? []).map(opt => {
                    const sel = answers[q.id] === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(q.id, opt)}
                        className="w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all"
                        style={sel ? { borderColor: BRAND, backgroundColor: 'color-mix(in srgb, var(--brand) 10%, white)', color: BRAND } : { borderColor: '#E2E8F0', backgroundColor: 'white', color: '#475569' }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="shrink-0 pt-8 pb-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className="w-full py-3.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
            style={{ backgroundColor: BRAND }}
          >
            {submitting ? 'Envoi...' : 'Envoyer mes réponses →'}
          </button>
          <p className="text-center text-xs text-[#94A3B8] mt-3">
            Vos réponses sont confidentielles et partagées uniquement avec votre coach.
          </p>
        </div>

      </div>
    </div>
  )
}
