'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Plus, Trash2, Clock, Settings2, Sparkles, Copy } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/coach/page-header'
import { InnerTabs } from '@/components/coach/inner-tabs'
import type { Profile } from '@/types/database'

type Programme = {
  id: string
  title: string
  type: 'sportif' | 'nutritionnel' | 'habitudes'
  description: string | null
  status: 'active' | 'draft' | 'archived'
  duration_days: number | null
  created_at: string
}

type ClientRow = { id: string; full_name: string }
type Props = { profile: Profile; clients: ClientRow[]; programmes: Programme[] }
type TabId = 'sportif' | 'nutritionnel' | 'habitudes'

const TABS = [
  { id: 'sportif',      label: '🦾 Sportif' },
  { id: 'nutritionnel', label: '🥗 Nutritionnel' },
  { id: 'habitudes',    label: '💤 Habitudes' },
]

const TYPE_EMOJI: Record<TabId, string> = {
  sportif:      '🦾',
  nutritionnel: '🥗',
  habitudes:    '💤',
}

const TYPE_LABELS: Record<TabId, string> = {
  sportif:      'Sportif',
  nutritionnel: 'Nutritionnel',
  habitudes:    'Habitudes',
}

const TYPE_COLORS: Record<TabId, { bg: string }> = {
  sportif:      { bg: '#EFF6FF' },
  nutritionnel: { bg: '#F0FDF4' },
  habitudes:    { bg: '#F5F3FF' },
}

const PROMPT_PLACEHOLDERS: Record<TabId, string> = {
  sportif:      'Ex. "Programme prise de masse, focus push/pull/legs, pas d\'équipement cardio, tractions obligatoires chaque séance"',
  nutritionnel: 'Ex. "Plan prise de masse pour ectomorphe, 3000 kcal/jour, intolérant au lactose"',
  habitudes:    'Ex. "Routine matinale anti-stress, lever 6h, méditation + sport + lecture, durée progressive"',
}

const LEVEL_OPTIONS = [
  { value: 'debutant',      label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance',        label: 'Avancé' },
]

export function ProgrammesContent({ profile: _profile, clients: _clients, programmes: initialProgrammes }: Props) {
  const router = useRouter()
  const [tab, setTab]               = useState<TabId>('sportif')
  const [programmes, setProgrammes] = useState<Programme[]>(initialProgrammes)
  const [showModal, setShowModal]   = useState(false)
  const [title, setTitle]           = useState('')
  const [aiPrompt, setAiPrompt]     = useState('')
  const [durationValue, setDurationValue] = useState(4)
  const [durationUnit, setDurationUnit]   = useState<'semaines' | 'mois'>('semaines')
  const [frequency, setFrequency]   = useState(3)
  const [level, setLevel]           = useState('intermediaire')
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const pendingDeletes = useRef<Map<string, { programme: Programme; timerId: ReturnType<typeof setTimeout> }>>(new Map())

  const durationDays = durationUnit === 'semaines' ? durationValue * 7 : durationValue * 30

  const tabCounts = {
    sportif:      programmes.filter(p => p.type === 'sportif').length,
    nutritionnel: programmes.filter(p => p.type === 'nutritionnel').length,
    habitudes:    programmes.filter(p => p.type === 'habitudes').length,
  }

  function openModal() {
    setTitle(''); setAiPrompt('')
    setDurationValue(4); setDurationUnit('semaines')
    setFrequency(3); setLevel('intermediaire')
    setShowModal(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch('/api/programmes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        type: tab,
        description: aiPrompt,
        duration_days: durationDays,
        frequency,
        level,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setProgrammes(prev => [data.programme, ...prev])
    setShowModal(false)
    toast.success('Programme créé — construction du contenu...')
    router.push(`/programmes/${data.programme.id}`)
  }

  function handleDelete(programmeId: string) {
    const prog = programmes.find(p => p.id === programmeId)
    if (!prog) return
    setProgrammes(prev => prev.filter(p => p.id !== programmeId))
    const timerId = setTimeout(async () => {
      pendingDeletes.current.delete(programmeId)
      setDeletingId(programmeId)
      await fetch('/api/programmes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programmeId }),
      })
      setDeletingId(null)
    }, 5000)
    pendingDeletes.current.set(programmeId, { programme: prog, timerId })
    toast('Programme supprimé', {
      action: {
        label: 'Annuler',
        onClick: () => {
          const p = pendingDeletes.current.get(programmeId)
          if (p) {
            clearTimeout(p.timerId)
            pendingDeletes.current.delete(programmeId)
            setProgrammes(prev => [p.programme, ...prev])
          }
        },
      },
      duration: 5000,
    })
  }

  async function handleDuplicate(programmeId: string) {
    setDuplicatingId(programmeId)
    const res = await fetch('/api/programmes/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme_id: programmeId }),
    })
    const data = await res.json()
    setDuplicatingId(null)
    if (data.error) { toast.error(data.error); return }
    setProgrammes(prev => [data.programme, ...prev])
    toast.success('Programme dupliqué')
    router.push(`/programmes/${data.programme.id}`)
  }

  const filtered = programmes.filter(p => p.type === tab)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="📋 Programmes"
        description="Créez et assignez des programmes à vos clients"
        action={
          <button onClick={openModal} className="flex items-center gap-1.5 px-3 py-2 btn-brand rounded-lg text-[13px] font-medium transition-colors">
            <Plus size={14} /> Nouveau programme
          </button>
        }
      />

      <div className="px-6 pt-4 shrink-0">
        <InnerTabs
          tabs={TABS.map(t => ({ ...t, count: tabCounts[t.id as TabId] }))}
          active={tab}
          onChange={(id) => setTab(id as TabId)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center mb-4">
              <BookOpen size={20} className="text-brand" />
            </div>
            <p className="text-[14px] font-semibold text-[#0D1F3C] mb-1">Aucun programme {TYPE_LABELS[tab].toLowerCase()}</p>
            <p className="text-[13px] text-[#94A3B8] text-center max-w-xs mb-5">
              {tab === 'sportif'      && "Créez un programme et laissez l'IA générer le contenu automatiquement."}
              {tab === 'nutritionnel' && "Planifiez les apports nutritionnels adaptés aux objectifs de vos clients."}
              {tab === 'habitudes'    && "Construisez des routines durables : sommeil, hydratation, gestion du stress."}
            </p>
            <button onClick={openModal} className="flex items-center gap-1.5 px-4 py-2 btn-brand rounded-lg text-[13px] font-medium transition-colors">
              <Sparkles size={14} /> Créer avec l'IA
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#F1F5F9] p-4 flex items-start gap-3 group hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-lg"
                  style={{ backgroundColor: TYPE_COLORS[p.type as TabId]?.bg ?? '#F1F5F9' }}>
                  {TYPE_EMOJI[p.type as TabId] ?? '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0D1F3C] truncate">{p.title}</p>
                  {p.description && (() => {
                    try { const m = JSON.parse(p.description ?? ''); return m.prompt ? <p className="text-[12px] text-[#94A3B8] mt-0.5 line-clamp-1">{m.prompt}</p> : null }
                    catch { return <p className="text-[12px] text-[#94A3B8] mt-0.5 line-clamp-1">{p.description}</p> }
                  })()}
                  {p.duration_days && (
                    <span className="flex items-center gap-1 text-[11px] text-[#64748B] mt-1.5">
                      <Clock size={10} /> {p.duration_days} jours
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/programmes/${p.id}`}
                    className="p-1.5 text-[#94A3B8] hover:text-[#4E9B6F] rounded-lg transition-colors"
                    title="Modifier / construire"
                  >
                    <Settings2 size={14} />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(p.id)}
                    disabled={duplicatingId === p.id}
                    className="p-1.5 text-[#94A3B8] hover:text-[#4E9B6F] rounded-lg transition-colors disabled:opacity-30"
                    title="Dupliquer"
                  >
                    {duplicatingId === p.id ? <span className="text-[11px]">…</span> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="p-1.5 text-[#CBD5E1] hover:text-red-400 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal création ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-xl overflow-y-auto max-h-[92vh]">

            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-[#0D1F3C] text-[15px] flex items-center gap-2">
                  <Sparkles size={15} className="text-[#4E9B6F]" /> Nouveau programme {TYPE_LABELS[tab].toLowerCase()}
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">L'IA génère les séances automatiquement</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] text-xl transition-colors">×</button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">

              {/* Titre */}
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Titre du programme</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={tab === 'sportif' ? 'Ex. Plan muscu 3j/sem.' : tab === 'nutritionnel' ? 'Ex. Programme prise de masse' : 'Ex. Routine matinale 30 jours'}
                  required autoFocus
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              {/* Durée + Fréquence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5 flex items-center gap-1">
                    <Clock size={11} /> Durée
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number" min={1} max={52} value={durationValue}
                      onChange={e => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-center focus:outline-none focus:border-brand"
                    />
                    <select
                      value={durationUnit} onChange={e => setDurationUnit(e.target.value as typeof durationUnit)}
                      className="flex-1 px-2 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand"
                    >
                      <option value="semaines">semaines</option>
                      <option value="mois">mois</option>
                    </select>
                  </div>
                </div>

                {tab === 'sportif' ? (
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Séances / semaine</label>
                    <div className="flex gap-1.5">
                      {[2, 3, 4, 5].map(n => (
                        <button
                          key={n} type="button"
                          onClick={() => setFrequency(n)}
                          className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors ${
                            frequency === n ? 'bg-[#EEF9F3] border-[#4E9B6F] text-[#4E9B6F]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFB]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Niveau</label>
                    <select
                      value={level} onChange={e => setLevel(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand"
                    >
                      {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Niveau (si sportif) */}
              {tab === 'sportif' && (
                <div>
                  <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Niveau</label>
                  <div className="flex gap-2">
                    {LEVEL_OPTIONS.map(o => (
                      <button
                        key={o.value} type="button"
                        onClick={() => setLevel(o.value)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
                          level === o.value ? 'bg-[#EEF9F3] border-[#4E9B6F] text-[#4E9B6F]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFB]'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt IA */}
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#4E9B6F]" />
                  Instructions pour l'IA
                  <span className="text-[#94A3B8] font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder={PROMPT_PLACEHOLDERS[tab]}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors resize-none"
                />
                <p className="text-[11px] text-[#94A3B8] mt-1">Plus tu détailles, plus le programme sera précis.</p>
              </div>

              {/* Résumé */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F0FAF4] border border-[#C6EDD8] rounded-lg">
                <Sparkles size={12} className="text-[#4E9B6F] shrink-0" />
                <p className="text-[12px] text-[#2d6e4e]">
                  L'IA va générer{' '}
                  <strong>
                    {tab === 'sportif'
                      ? `${Math.round((durationDays / 7) * frequency)} séances`
                      : `${Math.min(durationDays, 14)} jours`}
                  </strong>
                  {' '}sur {durationDays} jours
                  {tab === 'sportif' && ` · ${frequency}j/sem · ${LEVEL_OPTIONS.find(o => o.value === level)?.label}`}
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[#E2E8F0] text-[13px] text-[#64748B] rounded-lg hover:bg-[#F8FAFB] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={!title.trim() || saving}
                  className="flex-1 py-2.5 btn-brand text-[13px] font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? 'Création...' : <><Sparkles size={13} /> Créer et générer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
