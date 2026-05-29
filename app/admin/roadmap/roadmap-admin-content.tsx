'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { RoadmapItem, Suggestion } from '@/types/database'

type Props = {
  adminName: string
  roadmapItems: RoadmapItem[]
  suggestions: Suggestion[]
  votesThisMonth: number
  suggestionsThisMonth: number
}

type Tab = 'roadmap' | 'suggestions' | 'analytics'

const CATEGORIES = ['Suivi', 'Automatisation', 'Interface', 'Clients', 'Rapports', 'Autre']
const ITEM_TYPES: { value: RoadmapItem['type']; label: string }[] = [
  { value: 'coming_soon', label: 'Prévu' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'released', label: 'Disponible' },
]
const STATUS_FILTERS: { value: Suggestion['status'] | 'all'; label: string }[] = [
  { value: 'all',         label: 'Toutes' },
  { value: 'pending',     label: 'En attente' },
  { value: 'approved',    label: 'Approuvées' },
  { value: 'planned',     label: 'Planifiées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'delivered',   label: 'Livrées' },
  { value: 'rejected',    label: 'Refusées' },
]

function TypeBadge({ type }: { type: RoadmapItem['type'] }) {
  if (type === 'released') return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">✓ Disponible</span>
  if (type === 'in_progress') return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">⚡ En cours</span>
  return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">◷ Prévu</span>
}

function SuggStatusBadge({ status }: { status: Suggestion['status'] }) {
  const map: Record<string, string> = {
    pending:     'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved:    'bg-green-50 text-green-700 border-green-200',
    planned:     'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
    delivered:   'bg-teal-50 text-teal-700 border-teal-200',
    rejected:    'bg-red-50 text-red-700 border-red-200',
  }
  const labels: Record<string, string> = {
    pending: 'En attente', approved: 'Approuvée', planned: 'Planifiée',
    in_progress: 'En cours', delivered: 'Livrée', rejected: 'Refusée',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

const emptyItem = {
  title: '',
  description: '',
  type: 'coming_soon' as RoadmapItem['type'],
  category: '',
  released_at: '',
  is_published: true,
}

export function RoadmapAdminContent({ adminName, roadmapItems: initial, suggestions: initialSuggs, votesThisMonth, suggestionsThisMonth }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('roadmap')

  // ─── Roadmap state ───
  const [items, setItems] = useState<RoadmapItem[]>(initial)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [savingItem, setSavingItem] = useState(false)

  // ─── Suggestions state ───
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggs)
  const [suggFilter, setSuggFilter] = useState<Suggestion['status'] | 'all'>('pending')
  const [moderating, setModerating] = useState<string | null>(null)

  // ─── Roadmap CRUD ───
  const openAddModal = () => {
    setEditingItem(null)
    setItemForm(emptyItem)
    setShowItemModal(true)
  }

  const openEditModal = (item: RoadmapItem) => {
    setEditingItem(item)
    setItemForm({
      title: item.title,
      description: item.description ?? '',
      type: item.type,
      category: item.category ?? '',
      released_at: item.released_at ?? '',
      is_published: item.is_published,
    })
    setShowItemModal(true)
  }

  const saveItem = async () => {
    if (!itemForm.title.trim()) return
    setSavingItem(true)

    const payload = {
      title: itemForm.title.trim(),
      description: itemForm.description.trim() || null,
      type: itemForm.type,
      category: itemForm.category.trim() || null,
      released_at: itemForm.released_at || null,
      is_published: itemForm.is_published,
    }

    if (editingItem) {
      const { data, error } = await supabase
        .from('roadmap_items')
        .update(payload)
        .eq('id', editingItem.id)
        .select()
        .single()

      if (error) { toast.error('Erreur lors de la mise à jour.'); setSavingItem(false); return }
      setItems(prev => prev.map(i => i.id === editingItem.id ? (data as RoadmapItem) : i))
      toast.success('Item mis à jour.')
    } else {
      const { data, error } = await supabase
        .from('roadmap_items')
        .insert(payload)
        .select()
        .single()

      if (error) { toast.error('Erreur lors de la création.'); setSavingItem(false); return }
      setItems(prev => [data as RoadmapItem, ...prev])
      toast.success('Item ajouté à la roadmap.')
    }

    setSavingItem(false)
    setShowItemModal(false)
  }

  const togglePublished = async (item: RoadmapItem) => {
    const newVal = !item.is_published
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: newVal } : i))
    await supabase.from('roadmap_items').update({ is_published: newVal }).eq('id', item.id)
    toast.success(newVal ? 'Item publié.' : 'Item masqué.')
  }

  const changeType = async (item: RoadmapItem, type: RoadmapItem['type']) => {
    const extra = type === 'released' && !item.released_at
      ? { released_at: new Date().toISOString().split('T')[0] }
      : {}
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, type, ...extra } : i))
    await supabase.from('roadmap_items').update({ type, ...extra }).eq('id', item.id)
    toast.success('Statut mis à jour.')
  }

  // ─── Suggestions modération ───
  const moderateSugg = async (sugg: Suggestion, status: Suggestion['status']) => {
    setModerating(sugg.id)
    const { error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', sugg.id)

    if (error) {
      toast.error('Erreur.')
    } else {
      setSuggestions(prev => prev.map(s => s.id === sugg.id ? { ...s, status } : s))
      toast.success(status === 'approved' ? 'Suggestion approuvée.' : status === 'rejected' ? 'Suggestion refusée.' : 'Marquée comme planifiée.')
    }
    setModerating(null)
  }

  const filteredSuggs = suggFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.status === suggFilter)

  // Analytics
  const topItems = [...items].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5)
  const topSuggs = [...suggestions].filter(s => s.status !== 'rejected').sort((a, b) => b.vote_count - a.vote_count).slice(0, 5)
  const totalVotes = items.reduce((acc, i) => acc + i.vote_count, 0) + suggestions.reduce((acc, s) => acc + s.vote_count, 0)

  return (
    <div className="min-h-screen bg-[#F8FAFB]">

      {/* Top nav admin */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#0D1F3C] font-serif">Evolya</span>
          <span className="text-xs bg-[#0D1F3C] text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-[#64748B] hover:text-[#0D1F3C] transition-colors">
            ← Retour à l&apos;app
          </a>
          <span className="text-sm text-[#64748B]">{adminName}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Roadmap & Suggestions</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Gère les nouveautés, modère les suggestions, suis les votes.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#F1F5F9] p-1 rounded-xl w-fit">
          {([
            { key: 'roadmap', label: `Roadmap (${items.length})` },
            { key: 'suggestions', label: `Suggestions (${suggestions.filter(s => s.status === 'pending').length} en attente)` },
            { key: 'analytics', label: 'Analytics' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-white text-[#0D1F3C] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0D1F3C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── TAB ROADMAP ─── */}
        {tab === 'roadmap' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-[#64748B]">{items.length} items au total</p>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Ajouter une nouveauté
              </button>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className={`bg-white border rounded-xl p-4 ${!item.is_published ? 'opacity-60' : ''} border-[#E2E8F0]`}>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <TypeBadge type={item.type} />
                        {!item.is_published && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                            Brouillon
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[11px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">{item.category}</span>
                        )}
                        <span className="text-[11px] text-[#64748B]">👍 {item.vote_count} votes</span>
                      </div>
                      <p className="font-medium text-sm text-[#0D1F3C]">{item.title}</p>
                      {item.description && <p className="text-sm text-[#64748B] mt-1">{item.description}</p>}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* Changer statut */}
                      <select
                        value={item.type}
                        onChange={e => changeType(item, e.target.value as RoadmapItem['type'])}
                        className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[#64748B] bg-white focus:outline-none focus:border-[#4E9B6F]"
                      >
                        {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>

                      <button
                        onClick={() => togglePublished(item)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                          item.is_published
                            ? 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                            : 'border-[#4E9B6F] text-[#4E9B6F] bg-[#4E9B6F]/5 hover:bg-[#4E9B6F]/10'
                        }`}
                      >
                        {item.is_published ? 'Masquer' : 'Publier'}
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-12 text-[#94A3B8]">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">Aucun item. Commence par en ajouter un.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB SUGGESTIONS ─── */}
        {tab === 'suggestions' && (
          <div>
            {/* Filtres */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setSuggFilter(f.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    suggFilter === f.value
                      ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                      : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0D1F3C]'
                  }`}
                >
                  {f.label}
                  {f.value !== 'all' && (
                    <span className="ml-1 opacity-60">({suggestions.filter(s => s.status === f.value).length})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredSuggs.map(sugg => (
                <div key={sugg.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <SuggStatusBadge status={sugg.status} />
                        <span className="text-[11px] text-[#64748B]">👍 {sugg.vote_count}</span>
                        <span className="text-[11px] text-[#94A3B8]">
                          {new Date(sugg.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-[#0D1F3C]">{sugg.title}</p>
                      {sugg.description && <p className="text-sm text-[#64748B] mt-1">{sugg.description}</p>}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {sugg.status !== 'approved' && (
                        <button
                          onClick={() => moderateSugg(sugg, 'approved')}
                          disabled={moderating === sugg.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          Approuver
                        </button>
                      )}
                      {sugg.status !== 'planned' && (
                        <button
                          onClick={() => moderateSugg(sugg, 'planned')}
                          disabled={moderating === sugg.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          Planifier
                        </button>
                      )}
                      {sugg.status !== 'in_progress' && (
                        <button
                          onClick={() => moderateSugg(sugg, 'in_progress')}
                          disabled={moderating === sugg.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50"
                        >
                          En cours
                        </button>
                      )}
                      {sugg.status !== 'delivered' && (
                        <button
                          onClick={() => moderateSugg(sugg, 'delivered')}
                          disabled={moderating === sugg.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
                        >
                          Livrer
                        </button>
                      )}
                      {sugg.status !== 'rejected' && (
                        <button
                          onClick={() => moderateSugg(sugg, 'rejected')}
                          disabled={moderating === sugg.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredSuggs.length === 0 && (
                <div className="text-center py-12 text-[#94A3B8]">
                  <p className="text-3xl mb-2">✨</p>
                  <p className="text-sm">Aucune suggestion dans cette catégorie.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB ANALYTICS ─── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Votes ce mois', value: votesThisMonth },
                { label: 'Suggestions ce mois', value: suggestionsThisMonth },
                { label: 'Votes totaux', value: totalVotes },
                { label: 'Items publiés', value: items.filter(i => i.is_published).length },
              ].map((kpi, i) => (
                <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-2xl font-semibold text-[#0D1F3C]">{kpi.value}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top features votées */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#0D1F3C] mb-4">Top 5 features les plus votées</h3>
                {topItems.length > 0 ? (
                  <div className="space-y-3">
                    {topItems.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#94A3B8] w-4">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0D1F3C] truncate">{item.title}</p>
                        </div>
                        <span className="text-sm font-semibold text-[#4E9B6F]">{item.vote_count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8]">Aucun vote pour l&apos;instant.</p>
                )}
              </div>

              {/* Top suggestions votées */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#0D1F3C] mb-4">Top 5 suggestions les plus votées</h3>
                {topSuggs.length > 0 ? (
                  <div className="space-y-3">
                    {topSuggs.map((sugg, i) => (
                      <div key={sugg.id} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[#94A3B8] w-4">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0D1F3C] truncate">{sugg.title}</p>
                          <SuggStatusBadge status={sugg.status} />
                        </div>
                        <span className="text-sm font-semibold text-[#4E9B6F]">{sugg.vote_count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8]">Aucune suggestion approuvée.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL ITEM ROADMAP ─── */}
      {showItemModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowItemModal(false) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-[#0D1F3C] mb-5">
              {editingItem ? 'Modifier l\'item' : 'Ajouter une nouveauté'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">Titre</label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={e => setItemForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex : Rappels automatiques client"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Décris ce que ça fait..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">Type</label>
                  <select
                    value={itemForm.type}
                    onChange={e => setItemForm(p => ({ ...p, type: e.target.value as RoadmapItem['type'] }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors bg-white"
                  >
                    {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">Catégorie</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors bg-white"
                  >
                    <option value="">Aucune</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {itemForm.type === 'released' && (
                <div>
                  <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">Date de sortie</label>
                  <input
                    type="date"
                    value={itemForm.released_at}
                    onChange={e => setItemForm(p => ({ ...p, released_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.is_published}
                  onChange={e => setItemForm(p => ({ ...p, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#4E9B6F]"
                />
                <span className="text-sm text-[#0D1F3C]">Publier immédiatement</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowItemModal(false)}
                className="flex-1 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm hover:bg-[#F1F5F9] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveItem}
                disabled={savingItem || !itemForm.title.trim()}
                className="flex-1 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {savingItem ? 'Sauvegarde...' : editingItem ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
