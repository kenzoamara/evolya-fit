'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, ToggleLeft, AlignLeft, List, Hash } from 'lucide-react'

type QuestionType = 'text' | 'textarea' | 'yesno' | 'scale' | 'choice'

type Question = {
  id: string
  question: string
  type: QuestionType
  options: string[]
  required: boolean
}

type Props = {
  initialForm: { id: string; title: string; questions: (Question & { position: number })[] } | null
}

const TYPE_LABELS: Record<QuestionType, { label: string; icon: React.ReactNode }> = {
  text:     { label: 'Texte court',   icon: <AlignLeft size={13} /> },
  textarea: { label: 'Texte long',    icon: <AlignLeft size={13} /> },
  yesno:    { label: 'Oui / Non',     icon: <ToggleLeft size={13} /> },
  scale:    { label: 'Note 1 à 5',    icon: <Hash size={13} /> },
  choice:   { label: 'Choix multiple',icon: <List size={13} /> },
}

const SUGGESTIONS: { question: string; type: QuestionType }[] = [
  { question: 'Combien de fois par semaine pouvez-vous vous entraîner ?', type: 'choice' },
  { question: 'Avez-vous accès à une salle de sport ?', type: 'yesno' },
  { question: 'Quel est votre principal frein à la progression ?', type: 'textarea' },
  { question: 'Comment évaluez-vous votre motivation actuelle ?', type: 'scale' },
  { question: 'Avez-vous un équipement à domicile ?', type: 'yesno' },
  { question: 'Quels sont vos jours de disponibilité préférés ?', type: 'textarea' },
]

function uid() { return Math.random().toString(36).slice(2, 9) }

export function FormBuilder({ initialForm }: Props) {
  const [title, setTitle] = useState(initialForm?.title ?? 'Formulaire d\'accueil')
  const [questions, setQuestions] = useState<Question[]>(
    initialForm?.questions.map(q => ({
      id:       q.id,
      question: q.question,
      type:     q.type as QuestionType,
      options:  q.options ?? [],
      required: q.required,
    })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function addQuestion() {
    setQuestions(q => [...q, { id: uid(), question: '', type: 'text', options: [], required: false }])
  }

  function addSuggestion(s: typeof SUGGESTIONS[0]) {
    setQuestions(q => [...q, {
      id: uid(),
      question: s.question,
      type: s.type,
      options: s.type === 'choice' ? ['Option 1', 'Option 2'] : [],
      required: false,
    }])
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(q => q.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  function removeQuestion(id: string) {
    setQuestions(q => q.filter(item => item.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/intake-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    if (!confirm('Supprimer le formulaire ? Les réponses existantes seront conservées.')) return
    setDeleting(true)
    await fetch('/api/intake-forms', { method: 'DELETE' })
    setQuestions([])
    setTitle('Formulaire d\'accueil')
    setDeleting(false)
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#0D1F3C]">Formulaire d'accueil</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Vos clients le rempliront juste après l'onboarding.
            </p>
          </div>
          <div className="flex gap-2">
            {initialForm && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-sm text-[#EF4444] border border-[#FCA5A5] rounded-xl hover:bg-[#FEF2F2] transition-colors"
              >
                Supprimer
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || questions.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {saving ? 'Sauvegarde...' : saved ? 'Sauvegarde !' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Titre du formulaire */}
        <div>
          <label className="block text-sm font-medium text-[#0D1F3C] mb-2">Titre du formulaire</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-all"
            placeholder="Formulaire d'accueil"
          />
        </div>

        {/* Questions */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0D1F3C]">Questions ({questions.length})</p>

          {questions.length === 0 && (
            <div className="text-center py-10 bg-white border border-dashed border-[#E2E8F0] rounded-2xl">
              <p className="text-sm text-[#94A3B8]">Aucune question — ajoutez-en ci-dessous</p>
            </div>
          )}

          {questions.map((q, i) => (
            <div key={q.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <GripVertical size={16} className="text-[#CBD5E1] mt-2.5 shrink-0" />
                <div className="flex-1 space-y-3">
                  {/* Question text */}
                  <input
                    value={q.question}
                    onChange={e => updateQuestion(q.id, { question: e.target.value })}
                    placeholder={`Question ${i + 1}...`}
                    className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-all"
                  />

                  {/* Type + required */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(q.id, {
                        type: e.target.value as QuestionType,
                        options: e.target.value === 'choice' && !q.options.length ? ['Option 1', 'Option 2'] : q.options,
                      })}
                      className="text-xs px-3 py-1.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-[#475569] focus:outline-none"
                    >
                      {Object.entries(TYPE_LABELS).map(([val, { label }]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-[#64748B] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                        className="w-3.5 h-3.5 rounded"
                      />
                      Obligatoire
                    </label>
                  </div>

                  {/* Options pour 'choice' */}
                  {q.type === 'choice' && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            value={opt}
                            onChange={e => {
                              const opts = [...q.options]
                              opts[oi] = e.target.value
                              updateQuestion(q.id, { options: opts })
                            }}
                            className="flex-1 px-3 py-1.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none"
                            placeholder={`Option ${oi + 1}`}
                          />
                          <button
                            onClick={() => updateQuestion(q.id, { options: q.options.filter((_, j) => j !== oi) })}
                            className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateQuestion(q.id, { options: [...q.options, ''] })}
                        className="text-xs text-[var(--brand)] hover:opacity-80 transition-opacity"
                      >
                        + Ajouter une option
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeQuestion(q.id)}
                  className="mt-2 text-[#CBD5E1] hover:text-[#EF4444] transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-sm text-[#94A3B8] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            Ajouter une question
          </button>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-sm font-medium text-[#0D1F3C] mb-3">Suggestions de questions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => addSuggestion(s)}
                className="text-left px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#475569] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
              >
                <span className="block font-medium mb-0.5">{TYPE_LABELS[s.type].label}</span>
                {s.question}
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
