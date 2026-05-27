'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus, X, Trash2, Users, CheckCircle2 } from 'lucide-react'
import type { HabitTemplate } from './page'

type Client = { id: string; first_name: string; last_name: string }

const HABIT_CATS = [
  { id: 'tous',      label: 'Tous',      color: '#64748B', bg: '#F1F5F9' },
  { id: 'sport',     label: 'Sport',     color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'nutrition', label: 'Nutrition', color: '#22C55E', bg: '#F0FDF4' },
  { id: 'sommeil',   label: 'Sommeil',   color: '#6366F1', bg: '#EEF2FF' },
  { id: 'bien-etre', label: 'Bien-être', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'mental',    label: 'Mental',    color: '#8B5CF6', bg: '#F5F3FF' },
] as const

type CatFilter = typeof HABIT_CATS[number]['id']

const CAT_STYLE: Record<HabitTemplate['category'], { color: string; bg: string; label: string }> = {
  sport:     { color: '#3B82F6', bg: '#EFF6FF', label: 'Sport' },
  nutrition: { color: '#22C55E', bg: '#F0FDF4', label: 'Nutrition' },
  sommeil:   { color: '#6366F1', bg: '#EEF2FF', label: 'Sommeil' },
  'bien-etre': { color: '#F59E0B', bg: '#FFFBEB', label: 'Bien-être' },
  mental:    { color: '#8B5CF6', bg: '#F5F3FF', label: 'Mental' },
}

function HabitCard({ template, isOwn, onDelete, onAssign }: {
  template: HabitTemplate
  isOwn: boolean
  onDelete: () => void
  onAssign: (t: HabitTemplate) => void
}) {
  const s = CAT_STYLE[template.category]

  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] group">
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ backgroundColor: s.bg }}>
          {template.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0D1F3C]">{template.name}</span>
            {!template.is_global && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-bg text-brand">Perso</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
              {s.label}
            </span>
            {template.objectif && (
              <span className="text-[11px] text-[#64748B] truncate max-w-[220px]">{template.objectif}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            role="button" tabIndex={0}
            onClick={() => onAssign(template)}
            onKeyDown={e => { if (e.key === 'Enter') onAssign(template) }}
            title="Assigner à un client"
            className="p-1.5 text-[#CBD5E1] hover:text-[#4E9B6F] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Users size={13} />
          </span>
          {isOwn && (
            <span
              role="button" tabIndex={0}
              onClick={onDelete}
              onKeyDown={e => { if (e.key === 'Enter') onDelete() }}
              className="p-1.5 text-[#CBD5E1] hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

type Props = {
  templates: HabitTemplate[]
  coachId: string
  showAddModal: boolean
  onCloseAddModal: () => void
}

export function HabitudesView({ templates: initialTemplates, coachId, showAddModal, onCloseAddModal }: Props) {
  const [templates, setTemplates] = useState<HabitTemplate[]>(initialTemplates)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState<CatFilter>('tous')
  const [showModal, setShowModal] = useState(false)

  // Assign modal
  const [assignTarget, setAssignTarget]     = useState<HabitTemplate | null>(null)
  const [clients, setClients]               = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [assigning, setAssigning]           = useState(false)

  // Create form
  const [name, setName]             = useState('')
  const [emoji, setEmoji]           = useState('✅')
  const [cat, setCat]               = useState<HabitTemplate['category']>('bien-etre')
  const [description, setDescription] = useState('')
  const [saving, setSaving]         = useState(false)

  // Déclenché depuis le bouton parent dans PageHeader
  useEffect(() => {
    if (showAddModal) {
      setShowModal(true)
      onCloseAddModal()
    }
  }, [showAddModal, onCloseAddModal])

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (catFilter !== 'tous' && t.category !== catFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [templates, catFilter, search])

  const counts = useMemo(() => {
    const base = search
      ? templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
      : templates
    return {
      tous:      base.length,
      sport:     base.filter(t => t.category === 'sport').length,
      nutrition: base.filter(t => t.category === 'nutrition').length,
      sommeil:   base.filter(t => t.category === 'sommeil').length,
      'bien-etre': base.filter(t => t.category === 'bien-etre').length,
      mental:    base.filter(t => t.category === 'mental').length,
    }
  }, [templates, search])

  async function openAssign(template: HabitTemplate) {
    setAssignTarget(template)
    const res = await fetch('/api/clients/list')
    const data = await res.json()
    const cl: Client[] = data.clients ?? []
    setClients(cl)
    setSelectedClient(cl[0]?.id ?? '')
  }

  async function handleAssign() {
    if (!assignTarget || !selectedClient) return
    setAssigning(true)
    const res = await fetch('/api/library/assign-habit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: assignTarget.id, client_id: selectedClient }),
    })
    const data = await res.json()
    setAssigning(false)
    if (data.error) { toast.error(data.error); return }
    const client = clients.find(c => c.id === selectedClient)
    toast.success(`"${assignTarget.name}" assigné à ${client?.first_name ?? 'client'}.`)
    setAssignTarget(null)
  }

  function closeCreate() {
    setShowModal(false)
    setName(''); setEmoji('✅'); setCat('bien-etre'); setDescription('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/library/habit-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), emoji: emoji.trim() || '✅', category: cat, description: description.trim() }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setTemplates(prev => [data.template, ...prev])
    closeCreate()
    toast.success('Habitude ajoutée.')
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/library/habit-templates?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success('Habitude supprimée.')
  }

  return (
    <>
      {/* Filtres */}
      <div className="px-6 pt-3 pb-3 space-y-3 shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Rechercher une habitude…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#0D1F3C] placeholder:text-[#CBD5E1] focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {HABIT_CATS.map(c => {
            const count = counts[c.id]
            const active = catFilter === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border"
                style={active
                  ? { backgroundColor: c.bg, color: c.color, borderColor: c.color + '40' }
                  : { backgroundColor: '#F8FAFB', color: '#64748B', borderColor: '#E2E8F0' }
                }
              >
                {c.label}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={active
                    ? { backgroundColor: c.color + '20', color: c.color }
                    : { backgroundColor: '#E2E8F0', color: '#94A3B8' }
                  }>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mb-4">
              <CheckCircle2 size={20} className="text-[#8B5CF6]" />
            </div>
            <p className="text-[14px] font-semibold text-[#0D1F3C] mb-1">Aucune habitude</p>
            <p className="text-[13px] text-[#94A3B8] text-center max-w-xs">
              {search
                ? `Aucun résultat pour "${search}".`
                : 'Créez vos modèles d\'habitudes pour les assigner rapidement à vos clients.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-[13px] font-medium hover:bg-[#7c3aed] transition-colors"
              >
                <Plus size={14} /> Créer une habitude
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filtered.map(t => (
              <HabitCard
                key={t.id}
                template={t}
                isOwn={t.coach_id === coachId}
                onDelete={() => handleDelete(t.id)}
                onAssign={openAssign}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal — Assigner à un client */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAssignTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[#0D1F3C]">Assigner à un client</h3>
              <button onClick={() => setAssignTarget(null)} className="text-[#94A3B8] hover:text-[#64748B]">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2.5 bg-[#F5F3FF] rounded-xl px-3 py-2.5 mb-4 border border-[#DDD6FE]">
              <span className="text-lg">{assignTarget.emoji}</span>
              <p className="text-[13px] font-semibold text-[#0D1F3C]">{assignTarget.name}</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Client</label>
              {clients.length === 0 ? (
                <p className="text-[12px] text-[#94A3B8]">Aucun client trouvé.</p>
              ) : (
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-brand"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAssignTarget(null)}
                className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
                Annuler
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedClient}
                className="flex-1 py-2.5 bg-[#8B5CF6] text-white rounded-xl text-[13px] font-semibold hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
              >
                {assigning ? '…' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Créer une habitude */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-xl overflow-y-auto max-h-[92vh]">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#0D1F3C] text-[15px]">Nouvelle habitude</h3>
              <button onClick={closeCreate} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-[64px_1fr] gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Emoji</label>
                  <input
                    type="text" value={emoji} onChange={e => setEmoji(e.target.value)}
                    maxLength={4}
                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[20px] text-center focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Nom</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex. 30 min de marche" required autoFocus
                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Catégorie</label>
                <select
                  value={cat} onChange={e => setCat(e.target.value as HabitTemplate['category'])}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="sport">Sport</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="sommeil">Sommeil</option>
                  <option value="bien-etre">Bien-être</option>
                  <option value="mental">Mental</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">
                  Description <span className="text-[#94A3B8] font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex. Marcher 30 minutes à jeun chaque matin avant le petit-déjeuner."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeCreate}
                  className="flex-1 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 btn-brand rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50">
                  {saving ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
