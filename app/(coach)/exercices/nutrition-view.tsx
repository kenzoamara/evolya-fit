'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus, X, Trash2, ChevronDown, ChevronUp, Leaf, Users } from 'lucide-react'
import type { NutritionItem } from './page'

type Client = { id: string; first_name: string; last_name: string }

const OBJECTIF_FILTERS = [
  { id: 'tous',                    label: 'Tous',          color: '#64748B', bg: '#F1F5F9' },
  { id: 'prise de masse',          label: 'Prise de masse',color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'perte de poids',          label: 'Perte de poids',color: '#EF4444', bg: '#FEF2F2' },
  { id: 'recomposition corporelle',label: 'Recompo',       color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'maintien',                label: 'Maintien',      color: '#64748B', bg: '#F1F5F9' },
  { id: 'performance',             label: 'Performance',   color: '#8B5CF6', bg: '#F5F3FF' },
] as const

type ObjFilter = typeof OBJECTIF_FILTERS[number]['id']

const OBJECTIF_STYLE: Record<NonNullable<NutritionItem['objectif']>, { color: string; bg: string; label: string }> = {
  'prise de masse':          { color: '#3B82F6', bg: '#EFF6FF', label: 'Prise de masse' },
  'perte de poids':          { color: '#EF4444', bg: '#FEF2F2', label: 'Perte de poids' },
  'maintien':                { color: '#64748B', bg: '#F1F5F9', label: 'Maintien' },
  'performance':             { color: '#8B5CF6', bg: '#F5F3FF', label: 'Performance' },
  'recomposition corporelle':{ color: '#F59E0B', bg: '#FFFBEB', label: 'Recompo' },
}

const CAT_STYLE: Record<NutritionItem['category'], { color: string; bg: string; label: string }> = {
  repas:       { color: '#4E9B6F', bg: '#F0FDF4',  label: 'Repas' },
  proteines:   { color: '#F97316', bg: '#FFF7ED',  label: 'Protéines' },
  glucides:    { color: '#F59E0B', bg: '#FFFBEB',  label: 'Glucides' },
  lipides:     { color: '#8B5CF6', bg: '#F5F3FF',  label: 'Lipides' },
  hydratation: { color: '#0EA5E9', bg: '#F0F9FF',  label: 'Hydratation' },
  conseil:     { color: '#22C55E', bg: '#F0FDF4',  label: 'Conseil' },
  complements: { color: '#64748B', bg: '#F1F5F9',  label: 'Compléments' },
}

function NutritionCard({ item, isOwn, onDelete, onAssign }: {
  item: NutritionItem
  isOwn: boolean
  onDelete: () => void
  onAssign: (item: NutritionItem) => void
}) {
  const [open, setOpen] = useState(false)
  const s = CAT_STYLE[item.category]

  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden group">
      <button
        onClick={() => { if (item.calories_breakdown || item.description) setOpen(o => !o) }}
        className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${item.calories_breakdown || item.description ? 'hover:bg-[#FAFBFE] cursor-pointer' : 'cursor-default'}`}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: s.bg }}>
          <Leaf size={15} style={{ color: s.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0D1F3C]">{item.name}</span>
            {!item.is_global && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-bg text-brand">Perso</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
              {s.label}
            </span>
            {item.objectif && OBJECTIF_STYLE[item.objectif] && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: OBJECTIF_STYLE[item.objectif].bg, color: OBJECTIF_STYLE[item.objectif].color }}>
                {OBJECTIF_STYLE[item.objectif].label}
              </span>
            )}
            {item.calories_total && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                {item.calories_total} kcal
              </span>
            )}
            {item.description && !open && (
              <span className="text-[11px] text-[#94A3B8] truncate max-w-[200px]">{item.description}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span
            role="button" tabIndex={0}
            onClick={e => { e.stopPropagation(); onAssign(item) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onAssign(item) } }}
            title="Assigner au plan d'un client"
            className="p-1.5 text-[#CBD5E1] hover:text-[#4E9B6F] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Users size={13} />
          </span>
          {isOwn && (
            <span
              role="button" tabIndex={0}
              onClick={e => { e.stopPropagation(); onDelete() }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onDelete() } }}
              className="p-1.5 text-[#CBD5E1] hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </span>
          )}
          {(item.calories_breakdown || item.description) && (
            open ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />
          )}
        </div>
      </button>

      {open && (item.calories_breakdown || item.description) && (
        <div className="px-4 pb-4 border-t border-[#F8FAFC]">
          {item.calories_breakdown && (
            <div className="mt-3 space-y-1.5">
              {Object.entries(item.calories_breakdown).map(([ingredient, kcal]) => (
                <div key={ingredient} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#475569] capitalize">{ingredient}</span>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <div className="flex-1 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((kcal / (item.calories_total ?? 1)) * 100)}%`,
                          backgroundColor: s.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B] shrink-0">{kcal} kcal</span>
                </div>
              ))}
            </div>
          )}
          {item.description && (
            <p className="text-[12px] text-[#475569] leading-relaxed mt-3 whitespace-pre-line">{item.description}</p>
          )}
        </div>
      )}
    </div>
  )
}

type Props = {
  items: NutritionItem[]
  coachId: string
  showAddModal: boolean
  onCloseAddModal: () => void
}

export function NutritionView({ items: initialItems, coachId, showAddModal, onCloseAddModal }: Props) {
  const [items, setItems]       = useState<NutritionItem[]>(initialItems)
  const [search, setSearch]     = useState('')
  const [objFilter, setObjFilter] = useState<ObjFilter>('tous')
  const [showModal, setShowModal] = useState(false)

  // Assign modal
  const [assignTarget, setAssignTarget]   = useState<NutritionItem | null>(null)
  const [clients, setClients]             = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [assigning, setAssigning]         = useState(false)

  // Create form
  const [name, setName]             = useState('')
  const [cat, setCat]               = useState<NutritionItem['category']>('conseil')
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
    return items.filter(item => {
      if (objFilter !== 'tous' && (item.objectif ?? null) !== objFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [items, objFilter, search])

  const counts = useMemo(() => {
    const base = search
      ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
      : items
    return {
      'tous':                     base.length,
      'prise de masse':           base.filter(i => i.objectif === 'prise de masse').length,
      'perte de poids':           base.filter(i => i.objectif === 'perte de poids').length,
      'recomposition corporelle': base.filter(i => i.objectif === 'recomposition corporelle').length,
      'maintien':                 base.filter(i => i.objectif === 'maintien').length,
      'performance':              base.filter(i => i.objectif === 'performance').length,
    }
  }, [items, search])

  async function openAssign(item: NutritionItem) {
    setAssignTarget(item)
    const res = await fetch('/api/clients/list')
    const data = await res.json()
    const cl: Client[] = data.clients ?? []
    setClients(cl)
    setSelectedClient(cl[0]?.id ?? '')
  }

  async function handleAssign() {
    if (!assignTarget || !selectedClient) return
    setAssigning(true)
    const res = await fetch('/api/library/assign-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: assignTarget.id, client_id: selectedClient }),
    })
    const data = await res.json()
    setAssigning(false)
    if (data.error) { toast.error(data.error); return }
    const client = clients.find(c => c.id === selectedClient)
    toast.success(`"${assignTarget.name}" ajouté au plan de ${client?.first_name ?? 'client'}.`)
    setAssignTarget(null)
  }

  function closeCreate() {
    setShowModal(false)
    setName(''); setCat('conseil'); setDescription('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/library/nutrition-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), category: cat, description: description.trim() }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setItems(prev => [data.item, ...prev])
    closeCreate()
    toast.success('Modèle ajouté.')
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/library/nutrition-items?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Modèle supprimé.')
  }

  return (
    <>
      {/* Filtres */}
      <div className="px-6 pt-3 pb-3 space-y-3 shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Rechercher un modèle nutritionnel…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#0D1F3C] placeholder:text-[#CBD5E1] focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {OBJECTIF_FILTERS.map(c => {
            const count = counts[c.id]
            const active = objFilter === c.id
            if (c.id !== 'tous' && count === 0) return null
            return (
              <button
                key={c.id}
                onClick={() => setObjFilter(c.id)}
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
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mb-4">
              <Leaf size={20} className="text-[#22C55E]" />
            </div>
            <p className="text-[14px] font-semibold text-[#0D1F3C] mb-1">Aucun modèle nutritionnel</p>
            <p className="text-[13px] text-[#94A3B8] text-center max-w-xs">
              {search
                ? `Aucun résultat pour "${search}".`
                : 'Créez vos modèles nutritionnels pour les assigner rapidement à vos clients.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-white rounded-lg text-[13px] font-medium hover:bg-[#16a34a] transition-colors"
              >
                <Plus size={14} /> Créer un modèle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filtered.map(item => (
              <NutritionCard
                key={item.id}
                item={item}
                isOwn={item.coach_id === coachId}
                onDelete={() => handleDelete(item.id)}
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
              <h3 className="text-[15px] font-semibold text-[#0D1F3C]">Ajouter au plan nutritionnel</h3>
              <button onClick={() => setAssignTarget(null)} className="text-[#94A3B8] hover:text-[#64748B]">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2.5 bg-[#F0FDF4] rounded-xl px-3 py-2.5 mb-4 border border-[#BBF7D0]">
              <Leaf size={13} className="text-[#22C55E] shrink-0" />
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
                className="flex-1 py-2.5 bg-[#22C55E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50"
              >
                {assigning ? '…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Créer un modèle */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-xl overflow-y-auto max-h-[92vh]">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#0D1F3C] text-[15px]">Nouveau modèle nutritionnel</h3>
              <button onClick={closeCreate} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Nom</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex. Apport en protéines post-entraînement" required autoFocus
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Catégorie</label>
                <select
                  value={cat} onChange={e => setCat(e.target.value as NutritionItem['category'])}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors cursor-pointer"
                >
                  <option value="proteines">Protéines</option>
                  <option value="glucides">Glucides</option>
                  <option value="lipides">Lipides</option>
                  <option value="hydratation">Hydratation</option>
                  <option value="conseil">Conseil</option>
                  <option value="complements">Compléments</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">
                  Description <span className="text-[#94A3B8] font-normal">(règles, quantités, conseils…)</span>
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex. 1.6 à 2g de protéines par kg de poids corporel par jour. Favoriser les sources maigres."
                  rows={3}
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
