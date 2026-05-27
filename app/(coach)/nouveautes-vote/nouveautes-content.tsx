'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Profile, RoadmapItem, Suggestion, Vote } from '@/types/database'

type Props = {
  profile: Profile
  roadmapItems: RoadmapItem[]
  suggestions: Suggestion[]
  myVotes: Pick<Vote, 'item_id' | 'suggestion_id'>[]
}

function TypeBadge({ type }: { type: RoadmapItem['type'] }) {
  if (type === 'released') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
      ✓ Disponible
    </span>
  )
  if (type === 'in_progress') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
      ⚡ En cours
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
      ◷ Prévu
    </span>
  )
}

function StatusBadge({ status }: { status: Suggestion['status'] }) {
  if (status === 'planned') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
      ✅ Planifié par Evolya
    </span>
  )
  return null
}

function isNew(dateStr: string | null) {
  if (!dateStr) return false
  return (Date.now() - new Date(dateStr).getTime()) < 30 * 24 * 60 * 60 * 1000
}

export function NouveautesContent({ profile, roadmapItems, suggestions, myVotes }: Props) {
  const supabase = createClient()

  // IDs votés (item_id et suggestion_id)
  const [votedItemIds, setVotedItemIds] = useState<Set<string>>(
    () => new Set(myVotes.filter(v => v.item_id).map(v => v.item_id!))
  )
  const [votedSuggIds, setVotedSuggIds] = useState<Set<string>>(
    () => new Set(myVotes.filter(v => v.suggestion_id).map(v => v.suggestion_id!))
  )

  // Items avec vote_count optimiste
  const [itemCounts, setItemCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(roadmapItems.map(i => [i.id, i.vote_count]))
  )
  const [suggCounts, setSuggCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(suggestions.map(s => [s.id, s.vote_count]))
  )

  // Suggestion form
  const [suggTitle, setSuggTitle] = useState('')
  const [suggDesc, setSuggDesc] = useState('')
  const [submittingSugg, setSubmittingSugg] = useState(false)
  const [suggSent, setSuggSent] = useState(false)

  // Mise à jour last_visited_roadmap au chargement
  useEffect(() => {
    supabase
      .from('profiles')
      .update({ last_visited_roadmap: new Date().toISOString() })
      .eq('id', profile.id)
      .then(() => {})
  }, [profile.id])

  // Realtime: vote_count mis à jour par trigger DB → sync les compteurs
  useEffect(() => {
    const channel = supabase
      .channel('roadmap-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'roadmap_items' }, (p) => {
        const updated = p.new as { id: string; vote_count: number }
        setItemCounts(prev => ({ ...prev, [updated.id]: updated.vote_count }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'roadmap_items' }, (p) => {
        const item = p.new as RoadmapItem
        if (item.is_published) {
          setItemCounts(prev => ({ ...prev, [item.id]: item.vote_count }))
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'suggestions' }, (p) => {
        const updated = p.new as { id: string; vote_count: number }
        setSuggCounts(prev => ({ ...prev, [updated.id]: updated.vote_count }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const voteItem = useCallback(async (item: RoadmapItem) => {
    if (votedItemIds.has(item.id)) return

    // Optimistic
    setVotedItemIds(prev => { const s = new Set(prev); s.add(item.id); return s })
    setItemCounts(prev => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))

    const { error } = await supabase.from('votes').insert({
      coach_id: profile.id,
      item_id: item.id,
    })

    if (error) {
      // Rollback — le trigger DB s'occupe du vrai compte
      setVotedItemIds(prev => { const s = new Set(prev); s.delete(item.id); return s })
      setItemCounts(prev => ({ ...prev, [item.id]: (prev[item.id] ?? 1) - 1 }))
      if (error.code === '23505') {
        toast.error('Tu as déjà voté pour cette feature.')
      }
    }
  }, [votedItemIds, profile.id, supabase])

  const voteSuggestion = useCallback(async (sugg: Suggestion) => {
    if (votedSuggIds.has(sugg.id)) return

    // Optimistic
    setVotedSuggIds(prev => { const s = new Set(prev); s.add(sugg.id); return s })
    setSuggCounts(prev => ({ ...prev, [sugg.id]: (prev[sugg.id] ?? 0) + 1 }))

    const { error } = await supabase.from('votes').insert({
      coach_id: profile.id,
      suggestion_id: sugg.id,
    })

    if (error) {
      setVotedSuggIds(prev => { const s = new Set(prev); s.delete(sugg.id); return s })
      setSuggCounts(prev => ({ ...prev, [sugg.id]: (prev[sugg.id] ?? 1) - 1 }))
      if (error.code === '23505') {
        toast.error('Tu as déjà voté pour cette suggestion.')
      }
    }
  }, [votedSuggIds, profile.id, supabase])

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggTitle.trim()) return
    setSubmittingSugg(true)

    // Vérifier limite 3 suggestions/semaine
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', profile.id)
      .gt('created_at', weekAgo)

    if ((count ?? 0) >= 3) {
      toast.error('Tu as déjà envoyé 3 suggestions cette semaine. Reviens la semaine prochaine !')
      setSubmittingSugg(false)
      return
    }

    const { error } = await supabase.from('suggestions').insert({
      coach_id: profile.id,
      title: suggTitle.trim().slice(0, 80),
      description: suggDesc.trim().slice(0, 300) || null,
      status: 'pending',
    })

    if (error) {
      toast.error('Erreur lors de l\'envoi.')
    } else {
      setSuggSent(true)
      setSuggTitle('')
      setSuggDesc('')
    }
    setSubmittingSugg(false)
  }

  const released = roadmapItems.filter(i => i.type === 'released')
  const upcoming = roadmapItems.filter(i => i.type !== 'released')

  return (
    <main className="flex-1 px-4 pt-8 pb-24 md:px-8 md:py-10 max-w-3xl w-full mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0D1F3C]">Nouveautés & Vote</h1>
        <p className="text-sm text-[#64748B] mt-1">Suis les mises à jour, vote pour les prochaines features, suggère tes idées.</p>
      </div>

      {/* ─── BLOC 1 : Dernières mises à jour ─── */}
      {released.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-[#0D1F3C] mb-4">Dernières mises à jour</h2>
          <div className="space-y-3">
            {released.map(item => (
              <div key={item.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <TypeBadge type={item.type} />
                      {item.category && (
                        <span className="text-[11px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      )}
                      {isNew(item.released_at ?? item.created_at) && (
                        <span className="text-[11px] font-semibold text-white bg-[#4E9B6F] px-2 py-0.5 rounded-full">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-[#0D1F3C]">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{item.description}</p>
                    )}
                    {item.released_at && (
                      <p className="text-xs text-[#94A3B8] mt-2">
                        Sorti le {new Date(item.released_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── BLOC 2 : En cours / À venir ─── */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-[#0D1F3C] mb-4">Ce qu&apos;on prépare pour toi</h2>
          <div className="space-y-3">
            {upcoming.map(item => {
              const voted = votedItemIds.has(item.id)
              const count = itemCounts[item.id] ?? 0
              return (
                <div key={item.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <TypeBadge type={item.type} />
                        {item.category && (
                          <span className="text-[11px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-[#0D1F3C]">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {voted ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#4E9B6F]/10 text-[#4E9B6F] cursor-default">
                          ✅ Validé <span className="text-xs opacity-70">{count}</span>
                        </span>
                      ) : (
                        <button
                            onClick={() => voteItem(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium bg-[#4E9B6F]/10 text-[#4E9B6F] hover:bg-[#4E9B6F]/20 transition-colors"
                            title="Valider"
                          >
                            ✅ <span className="text-xs">{count}</span>
                          </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── BLOC 3 : Suggérer ─── */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-[#0D1F3C] mb-1">Tu voudrais voir arriver quelque chose ?</h2>
        <p className="text-sm text-[#64748B] mb-4">Envoie ta suggestion — on la lit et on la publie si elle est pertinente.</p>

        {suggSent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800">
            <p className="font-medium mb-1">Ta suggestion est bien reçue ✓</p>
            <p className="text-green-700">On la lit et on la publie si elle est pertinente.</p>
            <button
              onClick={() => setSuggSent(false)}
              className="mt-3 text-xs text-green-600 underline underline-offset-2"
            >
              Envoyer une autre suggestion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSuggestion} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">
                Titre de ta suggestion <span className="text-[#94A3B8] font-normal">({suggTitle.length}/80)</span>
              </label>
              <input
                type="text"
                value={suggTitle}
                onChange={e => setSuggTitle(e.target.value.slice(0, 80))}
                placeholder="Ex : Rappels automatiques pour les clients silencieux"
                required
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] focus:ring-1 focus:ring-[#4E9B6F]/20 transition-colors bg-[#F8FAFB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">
                Décris en 2 lignes ce que ça ferait <span className="text-[#94A3B8] font-normal">({suggDesc.length}/300)</span>
              </label>
              <textarea
                value={suggDesc}
                onChange={e => setSuggDesc(e.target.value.slice(0, 300))}
                placeholder="Ex : Quand un client n'a pas fait de check-in depuis 7 jours, m'envoyer un email automatiquement..."
                rows={3}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] focus:ring-1 focus:ring-[#4E9B6F]/20 transition-colors bg-[#F8FAFB] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingSugg || !suggTitle.trim()}
              className="w-full py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingSugg ? 'Envoi...' : 'Envoyer ma suggestion'}
            </button>
          </form>
        )}
      </section>

      {/* ─── BLOC 4 : Suggestions de la communauté ─── */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[#0D1F3C] mb-4">Vote des Nouveautés</h2>
          <div className="space-y-3">
            {suggestions.map(sugg => {
              const voted = votedSuggIds.has(sugg.id)
              const count = suggCounts[sugg.id] ?? 0
              return (
                <div key={sugg.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={sugg.status} />
                      </div>
                      <p className="font-medium text-sm text-[#0D1F3C]">{sugg.title}</p>
                      {sugg.description && (
                        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{sugg.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {voted ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#4E9B6F]/10 text-[#4E9B6F] cursor-default">
                          ✅ <span className="text-xs opacity-70">{count}</span>
                        </span>
                      ) : (
                        <button
                            onClick={() => voteSuggestion(sugg)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium bg-[#4E9B6F]/10 text-[#4E9B6F] hover:bg-[#4E9B6F]/20 transition-colors"
                            title="Valider"
                          >
                            ✅ <span className="text-xs">{count}</span>
                          </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {roadmapItems.length === 0 && suggestions.length === 0 && (
        <div className="text-center py-16 text-[#94A3B8]">
          <p className="text-4xl mb-3">🚀</p>
          <p className="text-sm">La roadmap arrive bientôt. Reviens dans quelques jours !</p>
        </div>
      )}
    </main>
  )
}

