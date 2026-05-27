'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Profile, RoadmapItem, Suggestion, Vote } from '@/types/database'

type Tab = 'blog' | 'updates' | 'vote'

type Props = {
  profile: Profile
  roadmapItems: RoadmapItem[]
  suggestions: Suggestion[]
  myVotes: Pick<Vote, 'item_id' | 'suggestion_id'>[]
}

const BLOG_POSTS = [
  {
    id: '1',
    title: 'Comment structurer un programme d\'entraînement efficace',
    excerpt: 'Découvrez les principes clés pour créer des programmes qui obtiennent des résultats durables pour vos clients, quelle que soit leur condition physique de départ.',
    category: 'Coaching',
    readTime: '4 min',
    date: '2025-05-10',
  },
  {
    id: '2',
    title: '5 questions essentielles pour votre check-in hebdomadaire',
    excerpt: 'Les check-ins réguliers sont la base d\'un suivi client réussi. Voici les questions qui font vraiment la différence entre un client qui progresse et un client qui décroche.',
    category: 'Relation client',
    readTime: '3 min',
    date: '2025-04-28',
  },
  {
    id: '3',
    title: 'Gérer la motivation de vos clients sur le long terme',
    excerpt: 'La motivation fluctue, c\'est normal. Apprenez à anticiper les baisses et à maintenir l\'engagement de vos clients même dans les moments difficiles.',
    category: 'Psychologie',
    readTime: '5 min',
    date: '2025-04-15',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Coaching': 'bg-blue-50 text-blue-700',
  'Relation client': 'bg-purple-50 text-purple-700',
  'Psychologie': 'bg-orange-50 text-orange-700',
  'Nutrition': 'bg-green-50 text-green-700',
  'Business': 'bg-yellow-50 text-yellow-700',
}

function formatBlogDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatChangelogDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function TypeBadge({ type }: { type: RoadmapItem['type'] }) {
  if (type === 'released') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
      Disponible
    </span>
  )
  if (type === 'in_progress') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
      En cours
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
      Prévu
    </span>
  )
}

// ─── TAB BLOG ────────────────────────────────────────────────────────────────

function BlogTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#0D1F3C]">Articles & ressources</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Conseils, méthodes et bonnes pratiques pour améliorer votre coaching.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map(post => (
          <article
            key={post.id}
            className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col hover:shadow-sm transition-shadow"
          >
            {/* Illustration placeholder */}
            <div
              className="h-32 w-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-30">
                <path d="M6 8h20M6 14h20M6 20h12" stroke="#0D1F3C" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {post.category}
                </span>
                <span className="text-[11px] text-[#94A3B8]">{post.readTime} de lecture</span>
              </div>
              <h3 className="text-sm font-semibold text-[#0D1F3C] leading-snug mb-2">{post.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F1F5F9]">
                <span className="text-[11px] text-[#94A3B8]">{formatBlogDate(post.date)}</span>
                <span className="text-xs font-medium text-[#64748B] cursor-default select-none">
                  Bientôt disponible
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl px-5 py-4 text-center">
        <p className="text-sm text-[#64748B]">D&apos;autres articles arrivent prochainement. Revenez régulièrement !</p>
      </div>
    </div>
  )
}

// ─── TAB MISES À JOUR ─────────────────────────────────────────────────────────

function UpdatesTab({ roadmapItems }: { roadmapItems: RoadmapItem[] }) {
  const released = [...roadmapItems]
    .filter(i => i.type === 'released')
    .sort((a, b) => {
      const da = a.released_at ?? a.created_at
      const db = b.released_at ?? b.created_at
      return new Date(db).getTime() - new Date(da).getTime()
    })

  const inProgress = roadmapItems.filter(i => i.type === 'in_progress')
  const comingSoon = roadmapItems.filter(i => i.type === 'coming_soon')

  function isNew(dateStr: string | null) {
    if (!dateStr) return false
    return (Date.now() - new Date(dateStr).getTime()) < 30 * 24 * 60 * 60 * 1000
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#0D1F3C]">Historique des mises à jour</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Tout ce qui a été livré, ce qui est en cours et ce qui arrive bientôt.</p>
      </div>

      {/* En cours */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">En développement</h3>
          </div>
          <div className="space-y-2">
            {inProgress.map(item => (
              <div key={item.id} className="bg-white border border-orange-100 rounded-xl px-4 py-3.5 flex items-start gap-3">
                <TypeBadge type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0D1F3C]">{item.title}</p>
                  {item.description && <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{item.description}</p>}
                </div>
                {item.category && (
                  <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* À venir */}
      {comingSoon.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">À venir</h3>
          </div>
          <div className="space-y-2">
            {comingSoon.map(item => (
              <div key={item.id} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 flex items-start gap-3">
                <TypeBadge type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0D1F3C]">{item.title}</p>
                  {item.description && <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{item.description}</p>}
                </div>
                {item.category && (
                  <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline des sorties */}
      {released.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Disponible</h3>
          </div>
          <div className="relative pl-5">
            {/* Ligne verticale */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E2E8F0]" />

            <div className="space-y-3">
              {released.map(item => {
                const dateStr = item.released_at ?? item.created_at
                const fresh = isNew(dateStr)
                return (
                  <div key={item.id} className="relative">
                    {/* Dot sur la timeline */}
                    <div
                      className="absolute -left-5 top-4 w-2 h-2 rounded-full border-2 border-white"
                      style={{ backgroundColor: '#22c55e', marginLeft: '-1px' }}
                    />
                    <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        {fresh && (
                          <span className="text-[11px] font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">Nouveau</span>
                        )}
                        {item.category && (
                          <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full">{item.category}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[#0D1F3C]">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{item.description}</p>
                      )}
                      <p className="text-[11px] text-[#94A3B8] mt-2">{formatChangelogDate(dateStr)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : (
        inProgress.length === 0 && comingSoon.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                <path d="M10 3v7l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="8"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[#0D1F3C] mb-1">Aucune mise à jour pour l&apos;instant</p>
            <p className="text-xs text-[#94A3B8]">Revenez bientôt !</p>
          </div>
        )
      )}
    </div>
  )
}

// ─── TAB VOTE ─────────────────────────────────────────────────────────────────

function VoteTab({
  profile,
  roadmapItems,
  suggestions,
  myVotes,
}: Props) {
  const supabase = createClient()

  const [votedItemIds, setVotedItemIds] = useState<Set<string>>(
    () => new Set(myVotes.filter(v => v.item_id).map(v => v.item_id!))
  )
  const [votedSuggIds, setVotedSuggIds] = useState<Set<string>>(
    () => new Set(myVotes.filter(v => v.suggestion_id).map(v => v.suggestion_id!))
  )
  const [itemCounts, setItemCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(roadmapItems.map(i => [i.id, i.vote_count]))
  )
  const [suggCounts, setSuggCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(suggestions.map(s => [s.id, s.vote_count]))
  )

  const [suggTitle, setSuggTitle] = useState('')
  const [suggDesc, setSuggDesc] = useState('')
  const [submittingSugg, setSubmittingSugg] = useState(false)
  const [suggSent, setSuggSent] = useState(false)

  useEffect(() => {
    supabase.from('profiles').update({ last_visited_roadmap: new Date().toISOString() }).eq('id', profile.id).then(() => {})
  }, [profile.id])

  useEffect(() => {
    const channel = supabase
      .channel('vote-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'roadmap_items' }, (p) => {
        const u = p.new as { id: string; vote_count: number }
        setItemCounts(prev => ({ ...prev, [u.id]: u.vote_count }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'suggestions' }, (p) => {
        const u = p.new as { id: string; vote_count: number }
        setSuggCounts(prev => ({ ...prev, [u.id]: u.vote_count }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const voteItem = useCallback(async (item: RoadmapItem) => {
    if (votedItemIds.has(item.id)) return
    setVotedItemIds(prev => { const s = new Set(prev); s.add(item.id); return s })
    setItemCounts(prev => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))
    const { error } = await supabase.from('votes').insert({ coach_id: profile.id, item_id: item.id })
    if (error) {
      setVotedItemIds(prev => { const s = new Set(prev); s.delete(item.id); return s })
      setItemCounts(prev => ({ ...prev, [item.id]: (prev[item.id] ?? 1) - 1 }))
      if (error.code !== '23505') toast.error('Erreur lors du vote.')
    }
  }, [votedItemIds, profile.id, supabase])

  const voteSugg = useCallback(async (sugg: Suggestion) => {
    if (votedSuggIds.has(sugg.id)) return
    setVotedSuggIds(prev => { const s = new Set(prev); s.add(sugg.id); return s })
    setSuggCounts(prev => ({ ...prev, [sugg.id]: (prev[sugg.id] ?? 0) + 1 }))
    const { error } = await supabase.from('votes').insert({ coach_id: profile.id, suggestion_id: sugg.id })
    if (error) {
      setVotedSuggIds(prev => { const s = new Set(prev); s.delete(sugg.id); return s })
      setSuggCounts(prev => ({ ...prev, [sugg.id]: (prev[sugg.id] ?? 1) - 1 }))
      if (error.code !== '23505') toast.error('Erreur lors du vote.')
    }
  }, [votedSuggIds, profile.id, supabase])

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggTitle.trim()) return
    setSubmittingSugg(true)

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', profile.id)
      .gt('created_at', weekAgo)

    if ((count ?? 0) >= 3) {
      toast.error('Limite de 3 suggestions par semaine atteinte.')
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

  const upcoming = roadmapItems.filter(i => i.type !== 'released')
  const approvedSuggs = suggestions.filter(s => s.status === 'approved' || s.status === 'planned')

  const maxItemVotes = Math.max(1, ...upcoming.map(i => itemCounts[i.id] ?? 0))
  const maxSuggVotes = Math.max(1, ...approvedSuggs.map(s => suggCounts[s.id] ?? 0))

  return (
    <div className="space-y-8">

      {/* Features à voter */}
      {upcoming.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#0D1F3C]">Vote pour les prochaines features</h2>
            <p className="text-sm text-[#64748B] mt-0.5">Dis-nous ce que tu veux voir en priorité. Chaque vote compte.</p>
          </div>
          <div className="space-y-2.5">
            {upcoming
              .sort((a, b) => (itemCounts[b.id] ?? 0) - (itemCounts[a.id] ?? 0))
              .map(item => {
                const voted = votedItemIds.has(item.id)
                const count = itemCounts[item.id] ?? 0
                const pct = Math.round((count / maxItemVotes) * 100)
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-4 hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Vote button */}
                      <button
                        onClick={() => voteItem(item)}
                        disabled={voted}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 transition-all ${
                          voted
                            ? 'cursor-default'
                            : 'hover:scale-105 active:scale-95 cursor-pointer'
                        }`}
                        style={voted
                          ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 10%, white)' }
                          : { borderColor: '#E2E8F0', backgroundColor: 'white' }
                        }
                        title={voted ? 'Déjà voté' : 'Voter'}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                          style={{ color: voted ? 'var(--brand)' : '#94A3B8' }}
                        >
                          <path d="M7 2L7 9M7 2L4 5M7 2L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span
                          className="text-xs font-semibold mt-0.5"
                          style={{ color: voted ? 'var(--brand)' : '#64748B' }}
                        >
                          {count}
                        </span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <TypeBadge type={item.type} />
                          {item.category && (
                            <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full">{item.category}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#0D1F3C]">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{item.description}</p>
                        )}
                        {/* Progress bar */}
                        <div className="mt-2.5 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: voted ? 'var(--brand)' : '#CBD5E1' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* Suggestions de la communauté */}
      {approvedSuggs.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#0D1F3C]">Suggestions de la communauté</h2>
            <p className="text-sm text-[#64748B] mt-0.5">Les idées de vos confrères coaches — votez pour celles qui vous parlent.</p>
          </div>
          <div className="space-y-2.5">
            {approvedSuggs
              .sort((a, b) => (suggCounts[b.id] ?? 0) - (suggCounts[a.id] ?? 0))
              .map(sugg => {
                const voted = votedSuggIds.has(sugg.id)
                const count = suggCounts[sugg.id] ?? 0
                const pct = Math.round((count / maxSuggVotes) * 100)
                return (
                  <div
                    key={sugg.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-4 hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => voteSugg(sugg)}
                        disabled={voted}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 transition-all ${
                          voted ? 'cursor-default' : 'hover:scale-105 active:scale-95 cursor-pointer'
                        }`}
                        style={voted
                          ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 10%, white)' }
                          : { borderColor: '#E2E8F0', backgroundColor: 'white' }
                        }
                        title={voted ? 'Déjà voté' : 'Voter'}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                          style={{ color: voted ? 'var(--brand)' : '#94A3B8' }}
                        >
                          <path d="M7 2L7 9M7 2L4 5M7 2L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="text-xs font-semibold mt-0.5" style={{ color: voted ? 'var(--brand)' : '#64748B' }}>{count}</span>
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {sugg.status === 'planned' && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                              Planifié
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#0D1F3C]">{sugg.title}</p>
                        {sugg.description && (
                          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{sugg.description}</p>
                        )}
                        <div className="mt-2.5 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: voted ? 'var(--brand)' : '#CBD5E1' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* Formulaire suggestion */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#0D1F3C]">Propose une idée</h2>
          <p className="text-sm text-[#64748B] mt-0.5">On lit chaque suggestion. Les meilleures sont publiées et soumises au vote.</p>
        </div>

        {suggSent ? (
          <div
            className="rounded-xl px-5 py-5 border flex items-start gap-4"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)', borderColor: 'color-mix(in srgb, var(--brand) 25%, transparent)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9l3.5 3.5L14 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1F3C]">Suggestion envoyée !</p>
              <p className="text-xs text-[#64748B] mt-0.5">On la lit et on la publie si elle est pertinente.</p>
              <button
                onClick={() => setSuggSent(false)}
                className="mt-2.5 text-xs font-medium underline underline-offset-2"
                style={{ color: 'var(--brand)' }}
              >
                Envoyer une autre suggestion
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSuggestion} className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">
                Titre <span className="text-[#94A3B8] font-normal">({suggTitle.length}/80)</span>
              </label>
              <input
                type="text"
                value={suggTitle}
                onChange={e => setSuggTitle(e.target.value.slice(0, 80))}
                placeholder="Ex : Rappels automatiques pour les clients silencieux"
                required
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[var(--brand)] transition-colors bg-[#F8FAFB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0D1F3C] mb-1.5">
                Description <span className="text-[#94A3B8] font-normal">optionnelle · {suggDesc.length}/300</span>
              </label>
              <textarea
                value={suggDesc}
                onChange={e => setSuggDesc(e.target.value.slice(0, 300))}
                placeholder="Décris en 2 lignes ce que ça ferait..."
                rows={3}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[var(--brand)] transition-colors bg-[#F8FAFB] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingSugg || !suggTitle.trim()}
              className="w-full py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submittingSugg ? 'Envoi...' : 'Envoyer ma suggestion'}
            </button>
          </form>
        )}
      </section>

      {upcoming.length === 0 && approvedSuggs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4v6l3 3M10 18a8 8 0 100-16 8 8 0 000 16z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-[#0D1F3C] mb-1">Aucun vote disponible pour l&apos;instant</p>
          <p className="text-xs text-[#94A3B8]">Proposez votre première idée ci-dessous.</p>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'blog', label: 'Blog' },
  { key: 'updates', label: 'Mises à jour' },
  { key: 'vote', label: 'Vote' },
]

export function NouveautesTabs({ profile, roadmapItems, suggestions, myVotes }: Props) {
  const [tab, setTab] = useState<Tab>('blog')

  return (
    <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:py-8 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0D1F3C]">Nouveautés</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Restez informé, votez pour les prochaines features, partagez vos idées.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#F1F5F9] p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-[#0D1F3C] shadow-sm'
                : 'text-[#64748B] hover:text-[#0D1F3C]'
            }`}
          >
            {t.label}
            {t.key === 'vote' && (roadmapItems.filter(i => i.type !== 'released').length > 0) && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--brand)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'blog' && <BlogTab />}
      {tab === 'updates' && <UpdatesTab roadmapItems={roadmapItems} />}
      {tab === 'vote' && (
        <VoteTab
          profile={profile}
          roadmapItems={roadmapItems}
          suggestions={suggestions}
          myVotes={myVotes}
        />
      )}
    </main>
  )
}
