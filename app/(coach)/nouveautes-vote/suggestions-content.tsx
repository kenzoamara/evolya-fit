'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, ThumbsDown, MessageCircle, Search, ChevronDown, Plus, X, ArrowLeft, Loader2, Send, Trash2 } from 'lucide-react'
import type { Profile, RoadmapItem, Suggestion, SuggestionComment, Vote, SuggestionStatus } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'blog' | 'updates' | 'suggestions'

type Props = {
  profile: Profile
  roadmapItems: RoadmapItem[]
  suggestions: Suggestion[]
  myVotes: Pick<Vote, 'item_id' | 'suggestion_id' | 'vote_type'>[]
}

type RightPanel = 'empty' | 'new' | 'detail'

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUS_META: Record<SuggestionStatus, { label: string; dot: string; badge: string }> = {
  pending:    { label: 'Proposée',  dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved:   { label: 'Proposée',  dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  planned:    { label: 'Planifiée', dot: 'bg-indigo-400',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  in_progress:{ label: 'En cours',  dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  delivered:  { label: 'Livrée',    dot: 'bg-green-500',   badge: 'bg-green-50 text-green-700 border-green-200' },
  rejected:   { label: 'Rejetée',   dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200' },
}

type FilterTab = 'all' | SuggestionStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',         label: 'Toutes' },
  { key: 'approved',    label: 'Proposée' },
  { key: 'planned',     label: 'Planifiée' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'delivered',   label: 'Livrée' },
]

type SortKey = 'votes' | 'recent'

const BLOG_POSTS = [
  { id: '1', title: 'Comment structurer un programme d\'entraînement efficace', excerpt: 'Découvrez les principes clés pour créer des programmes qui obtiennent des résultats durables pour vos clients, quelle que soit leur condition physique de départ.', category: 'Coaching', readTime: '4 min', date: '2025-05-10', pro_only: false },
  { id: '2', title: '5 questions essentielles pour votre check-in hebdomadaire', excerpt: 'Les check-ins réguliers sont la base d\'un suivi client réussi. Voici les questions qui font vraiment la différence entre un client qui progresse et un client qui décroche.', category: 'Relation client', readTime: '3 min', date: '2025-04-28', pro_only: false },
  { id: '3', title: 'Gérer la motivation de vos clients sur le long terme', excerpt: 'La motivation fluctue, c\'est normal. Apprenez à anticiper les baisses et à maintenir l\'engagement de vos clients même dans les moments difficiles.', category: 'Psychologie', readTime: '5 min', date: '2025-04-15', pro_only: false },
  { id: '4', title: 'Fidélisation avancée : les indicateurs que les meilleurs coaches surveillent', excerpt: 'LTV, taux de churn, score d\'engagement — comment lire vos métriques business pour anticiper les départs et maximiser la rétention de vos clients.', category: 'Business', readTime: '6 min', date: '2025-05-20', pro_only: true },
  { id: '5', title: 'Créer une offre premium : tarification, valeur et positionnement', excerpt: 'Comment justifier des tarifs plus élevés, structurer vos offres et attirer des clients qui paient sans négocier. Une méthode en 4 étapes pour les coaches ambitieux.', category: 'Business', readTime: '7 min', date: '2025-05-05', pro_only: true },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Coaching': 'bg-blue-50 text-blue-700',
  'Relation client': 'bg-purple-50 text-purple-700',
  'Psychologie': 'bg-orange-50 text-orange-700',
  'Nutrition': 'bg-green-50 text-green-700',
  'Business': 'bg-yellow-50 text-yellow-700',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const delta = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (delta < 60)    return 'à l\'instant'
  if (delta < 3600)  return `il y a ${Math.floor(delta / 60)} min`
  if (delta < 86400) return `il y a ${Math.floor(delta / 3600)} h`
  if (delta < 7 * 86400) return `il y a ${Math.floor(delta / 86400)} j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isNew(dateStr: string | null) {
  if (!dateStr) return false
  return (Date.now() - new Date(dateStr).getTime()) < 30 * 24 * 60 * 60 * 1000
}

function StatusBadge({ status }: { status: SuggestionStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function TypeBadge({ type }: { type: RoadmapItem['type'] }) {
  if (type === 'released')   return <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Disponible</span>
  if (type === 'in_progress') return <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">En cours</span>
  return <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Prévu</span>
}

// ─── Blog Tab ────────────────────────────────────────────────────────────────

function BlogTab({ plan }: { plan: string }) {
  const isPro = plan === 'pro'
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#0D1F3C]">Articles & ressources</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Conseils, méthodes et bonnes pratiques pour améliorer votre coaching.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map(post => {
            const locked = post.pro_only && !isPro
            return (
              <article key={post.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col hover:shadow-sm transition-shadow relative">
                {post.pro_only && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0D1F3C] text-white">Pro</span>
                  </div>
                )}
                <div className="h-28 w-full flex items-center justify-center flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)' }}>
                  {locked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F1F5F9]/80 backdrop-blur-[2px]">
                      <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      </div>
                    </div>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="opacity-25"><path d="M6 8h20M6 14h20M6 20h12" stroke="#0D1F3C" strokeWidth="2" strokeLinecap="round"/></svg>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}>{post.category}</span>
                    <span className="text-[11px] text-[#94A3B8]">{post.readTime}</span>
                  </div>
                  <h3 className={`text-sm font-semibold leading-snug mb-2 ${locked ? 'text-[#94A3B8]' : 'text-[#0D1F3C]'}`}>{post.title}</h3>
                  {locked ? (
                    <div className="flex-1">
                      <div className="space-y-1.5"><div className="h-2 bg-[#F1F5F9] rounded-full w-full"/><div className="h-2 bg-[#F1F5F9] rounded-full w-4/5"/><div className="h-2 bg-[#F1F5F9] rounded-full w-3/5"/></div>
                      <a href="/plans" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4E9B6F] hover:underline">Passer au plan Pro</a>
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] leading-relaxed flex-1">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9]">
                    <span className="text-[11px] text-[#94A3B8]">{fmtDate(post.date)}</span>
                    <span className="text-[11px] font-medium text-[#94A3B8]">Bientôt disponible</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        <div className="mt-6 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl px-5 py-4 text-center">
          <p className="text-sm text-[#64748B]">D&apos;autres articles arrivent prochainement. Revenez régulièrement !</p>
        </div>
      </div>
    </div>
  )
}

// ─── Updates Tab ─────────────────────────────────────────────────────────────

function UpdatesTab({ roadmapItems }: { roadmapItems: RoadmapItem[] }) {
  const released  = [...roadmapItems].filter(i => i.type === 'released').sort((a, b) => new Date(b.released_at ?? b.created_at).getTime() - new Date(a.released_at ?? a.created_at).getTime())
  const inProgress = roadmapItems.filter(i => i.type === 'in_progress')
  const comingSoon = roadmapItems.filter(i => i.type === 'coming_soon')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#0D1F3C]">Historique des mises à jour</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Tout ce qui a été livré, ce qui est en cours et ce qui arrive bientôt.</p>
        </div>

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
                    {item.description && <p className="text-xs text-[#64748B] mt-0.5">{item.description}</p>}
                  </div>
                  {item.category && <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

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
                    {item.description && <p className="text-xs text-[#64748B] mt-0.5">{item.description}</p>}
                  </div>
                  {item.category && <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {released.length > 0 ? (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Disponible</h3>
            </div>
            <div className="relative pl-5">
              <div className="absolute left-0 top-2 bottom-2 w-px bg-[#E2E8F0]" />
              <div className="space-y-3">
                {released.map(item => {
                  const dateStr = item.released_at ?? item.created_at
                  return (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-5 top-4 w-2 h-2 rounded-full bg-green-500 border-2 border-white" style={{ marginLeft: '-1px' }} />
                      <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          {isNew(dateStr) && <span className="text-[11px] font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">Nouveau</span>}
                          {item.category && <span className="text-[11px] text-[#94A3B8] bg-[#F8FAFB] px-2 py-0.5 rounded-full">{item.category}</span>}
                        </div>
                        <p className="text-sm font-medium text-[#0D1F3C]">{item.title}</p>
                        {item.description && <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{item.description}</p>}
                        <p className="text-[11px] text-[#94A3B8] mt-2">{fmtDate(dateStr)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        ) : inProgress.length === 0 && comingSoon.length === 0 && (
          <div className="text-center py-16 text-[#94A3B8]">
            <p className="text-sm font-medium text-[#0D1F3C] mb-1">Aucune mise à jour pour l&apos;instant</p>
            <p className="text-xs">Revenez bientôt !</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SuggestionsContent({ profile, roadmapItems, suggestions: initialSuggestions, myVotes }: Props) {
  const supabase = createClient()

  // ── Tab principal ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('suggestions')

  // ── State liste suggestions ────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortKey>('votes')
  const [filter, setFilter]     = useState<FilterTab>('all')
  const [sortOpen, setSortOpen] = useState(false)

  // ── State votes suggestions ────────────────────────────────────────────────
  const [myVoteMap, setMyVoteMap] = useState<Record<string, 'up' | 'down'>>(() => {
    const map: Record<string, 'up' | 'down'> = {}
    for (const v of myVotes) {
      if (v.suggestion_id) map[v.suggestion_id] = (v.vote_type ?? 'up') as 'up' | 'down'
    }
    return map
  })
  const [counts, setCounts] = useState<Record<string, { up: number; down: number }>>(() => {
    const m: Record<string, { up: number; down: number }> = {}
    for (const s of initialSuggestions) {
      m[s.id] = { up: s.vote_count ?? 0, down: s.dislike_count ?? 0 }
    }
    return m
  })

  // ── State panneau droit ────────────────────────────────────────────────────
  const [rightPanel, setRightPanel] = useState<RightPanel>('empty')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── State commentaires ─────────────────────────────────────────────────────
  const [comments, setComments]               = useState<SuggestionComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText]         = useState('')
  const [postingComment, setPostingComment]   = useState(false)

  // ── State nouvelle suggestion ──────────────────────────────────────────────
  const [suggTitle, setSuggTitle]   = useState('')
  const [suggDesc, setSuggDesc]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sortRef = useRef<HTMLDivElement>(null)

  const selectedSuggestion = useMemo(
    () => suggestions.find(s => s.id === selectedId) ?? null,
    [suggestions, selectedId]
  )

  // ── Fermer dropdown au clic extérieur ──────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('suggestions-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'suggestions' }, (p) => {
        const u = p.new as { id: string; vote_count: number; dislike_count: number; comment_count: number }
        setSuggestions(prev => prev.map(s => s.id === u.id ? { ...s, vote_count: u.vote_count, dislike_count: u.dislike_count ?? 0, comment_count: u.comment_count ?? 0 } : s))
        setCounts(prev => ({ ...prev, [u.id]: { up: u.vote_count, down: u.dislike_count ?? 0 } }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'suggestion_comments' }, (p) => {
        const c = p.new as SuggestionComment
        if (c.suggestion_id === selectedId) setComments(prev => [...prev, c])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, selectedId])

  // ── Charger commentaires ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || rightPanel !== 'detail') return
    setLoadingComments(true)
    setComments([])
    supabase
      .from('suggestion_comments')
      .select('*, coach:profiles!suggestion_comments_coach_id_fkey(full_name)')
      .eq('suggestion_id', selectedId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []) as SuggestionComment[])
        setLoadingComments(false)
      })
  }, [selectedId, rightPanel, supabase])

  // ── Vote ──────────────────────────────────────────────────────────────────
  const vote = useCallback(async (suggId: string, type: 'up' | 'down') => {
    const current = myVoteMap[suggId]

    if (current === type) {
      // Retirer le vote
      setMyVoteMap(prev => { const m = { ...prev }; delete m[suggId]; return m })
      setCounts(prev => ({
        ...prev,
        [suggId]: {
          up:   type === 'up'   ? Math.max(0, (prev[suggId]?.up   ?? 0) - 1) : (prev[suggId]?.up   ?? 0),
          down: type === 'down' ? Math.max(0, (prev[suggId]?.down ?? 0) - 1) : (prev[suggId]?.down ?? 0),
        }
      }))
      const { error } = await supabase.from('votes').delete().eq('coach_id', profile.id).eq('suggestion_id', suggId)
      if (error) {
        toast.error('Impossible de retirer le vote : ' + error.message)
        setMyVoteMap(prev => ({ ...prev, [suggId]: type }))
        setCounts(prev => ({
          ...prev,
          [suggId]: {
            up:   type === 'up'   ? (prev[suggId]?.up   ?? 0) + 1 : (prev[suggId]?.up   ?? 0),
            down: type === 'down' ? (prev[suggId]?.down ?? 0) + 1 : (prev[suggId]?.down ?? 0),
          }
        }))
      }
      return
    }

    if (current) {
      // Changer de vote
      setMyVoteMap(prev => ({ ...prev, [suggId]: type }))
      setCounts(prev => ({
        ...prev,
        [suggId]: {
          up:   current === 'up'   ? Math.max(0, (prev[suggId]?.up   ?? 0) - 1) : (prev[suggId]?.up   ?? 0) + (type === 'up'   ? 1 : 0),
          down: current === 'down' ? Math.max(0, (prev[suggId]?.down ?? 0) - 1) : (prev[suggId]?.down ?? 0) + (type === 'down' ? 1 : 0),
        }
      }))
      await supabase.from('votes').delete().eq('coach_id', profile.id).eq('suggestion_id', suggId)
      const { error } = await supabase.from('votes').insert({ coach_id: profile.id, suggestion_id: suggId, vote_type: type })
      if (error) {
        toast.error('Vote échoué : ' + error.message)
        setMyVoteMap(prev => ({ ...prev, [suggId]: current }))
      }
      return
    }

    // Nouveau vote
    setMyVoteMap(prev => ({ ...prev, [suggId]: type }))
    setCounts(prev => ({
      ...prev,
      [suggId]: {
        up:   (prev[suggId]?.up   ?? 0) + (type === 'up'   ? 1 : 0),
        down: (prev[suggId]?.down ?? 0) + (type === 'down' ? 1 : 0),
      }
    }))
    const { error } = await supabase.from('votes').upsert(
      { coach_id: profile.id, suggestion_id: suggId, vote_type: type },
      { onConflict: 'coach_id,suggestion_id' }
    )
    if (error) {
      toast.error('Vote échoué : ' + error.message)
      setMyVoteMap(prev => { const m = { ...prev }; delete m[suggId]; return m })
      setCounts(prev => ({
        ...prev,
        [suggId]: {
          up:   (prev[suggId]?.up   ?? 0) - (type === 'up'   ? 1 : 0),
          down: (prev[suggId]?.down ?? 0) - (type === 'down' ? 1 : 0),
        }
      }))
    }
  }, [myVoteMap, profile.id, supabase])

  // ── Poster commentaire ────────────────────────────────────────────────────
  const postComment = useCallback(async () => {
    if (!selectedId || !commentText.trim()) return
    setPostingComment(true)
    const res = await fetch('/api/suggestions/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion_id: selectedId, content: commentText.trim() }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur lors de l\'envoi')
    } else {
      setComments(prev => [...prev, { ...json.comment, coach: { full_name: profile.full_name } } as SuggestionComment])
      setCommentText('')
    }
    setPostingComment(false)
  }, [selectedId, commentText, profile.full_name])

  // ── Supprimer commentaire ─────────────────────────────────────────────────
  const deleteComment = useCallback(async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    const res = await fetch(`/api/suggestions/comment?id=${commentId}`, { method: 'DELETE' })
    if (!res.ok) toast.error('Erreur lors de la suppression')
  }, [])

  // ── Nouvelle suggestion ───────────────────────────────────────────────────
  const handleNewSuggestion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggTitle.trim()) return
    setSubmitting(true)

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase.from('suggestions').select('id', { count: 'exact', head: true }).eq('coach_id', profile.id).gt('created_at', weekAgo)
    if ((count ?? 0) >= 3) { toast.error('Limite atteinte : 3 suggestions par semaine.'); setSubmitting(false); return }

    const { data, error } = await supabase
      .from('suggestions')
      .insert({ coach_id: profile.id, title: suggTitle.trim().slice(0, 80), description: suggDesc.trim().slice(0, 300) || null, status: 'pending' })
      .select('*, coach:profiles!suggestions_coach_id_fkey(full_name)')
      .single()

    if (error) {
      toast.error('Erreur lors de l\'envoi.')
    } else {
      const newSugg = { ...data, vote_count: 0, dislike_count: 0, comment_count: 0 } as Suggestion
      setSuggestions(prev => [newSugg, ...prev])
      setCounts(prev => ({ ...prev, [newSugg.id]: { up: 0, down: 0 } }))
      toast.success('Suggestion envoyée ! Elle sera publiée si elle est retenue.')
      setSuggTitle('')
      setSuggDesc('')
      setSelectedId(newSugg.id)
      setRightPanel('detail')
    }
    setSubmitting(false)
  }, [suggTitle, suggDesc, profile.id, supabase])

  // ── Filtrage + tri ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...suggestions]
    if (filter !== 'all') {
      list = filter === 'approved'
        ? list.filter(s => s.status === 'approved' || s.status === 'pending')
        : list.filter(s => s.status === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
    }
    if (sort === 'votes') list.sort((a, b) => (counts[b.id]?.up ?? b.vote_count) - (counts[a.id]?.up ?? a.vote_count))
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  }, [suggestions, filter, search, sort, counts])

  function openSuggestion(id: string) { setSelectedId(id); setRightPanel('detail'); setCommentText('') }
  function openNew()   { setSelectedId(null); setRightPanel('new') }
  function closeRight(){ setSelectedId(null); setRightPanel('empty') }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Navigation tabs ── */}
      <div className="flex-shrink-0 border-b border-[#E2E8F0] bg-white px-6">
        <div className="flex items-end gap-0 -mb-px">
          {([
            { key: 'blog'        as Tab, label: 'Blog' },
            { key: 'updates'     as Tab, label: 'Mises à jour' },
            { key: 'suggestions' as Tab, label: 'Suggestions' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3.5 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-[#4E9B6F] text-[#4E9B6F]'
                  : 'border-transparent text-[#64748B] hover:text-[#0D1F3C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu par onglet ── */}
      {activeTab === 'blog' && <BlogTab plan={profile.plan ?? 'trial'} />}
      {activeTab === 'updates' && <UpdatesTab roadmapItems={roadmapItems} />}

      {/* ── Onglet Suggestions : two-panel ── */}
      {activeTab === 'suggestions' && (
        <div className="flex-1 flex min-h-0 overflow-hidden md:flex-row flex-col">

          {/* ════ PANNEAU GAUCHE ════ */}
          <div className={`flex flex-col w-full md:w-[420px] md:flex-shrink-0 border-r border-[#E2E8F0] bg-white min-h-0 ${rightPanel !== 'empty' ? 'hidden md:flex' : 'flex'}`}>

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-[15px] font-semibold text-[#0D1F3C]">Suggestions des coachs</h1>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Vote pour tes favoris ou propose une nouvelle idée.</p>
                </div>
                <button
                  onClick={openNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 btn-brand text-[12px] font-medium rounded-lg flex-shrink-0"
                >
                  <Plus size={13} /> Suggérer
                </button>
              </div>

              {/* Search + Sort */}
              <div className="flex gap-2 mt-3">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E2E8F0] rounded-lg text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] bg-[#F8FAFB]" />
                </div>
                <div className="relative" ref={sortRef}>
                  <button onClick={() => setSortOpen(p => !p)} className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-[#E2E8F0] rounded-lg text-[#64748B] hover:border-[#CBD5E1] bg-[#F8FAFB] whitespace-nowrap">
                    <span>{sort === 'votes' ? 'Plus votées' : 'Plus récentes'}</span>
                    <ChevronDown size={12} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-20 min-w-[140px] py-1">
                      {(['votes', 'recent'] as SortKey[]).map(key => (
                        <button key={key} onClick={() => { setSort(key); setSortOpen(false) }} className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#F8FAFB] ${sort === key ? 'text-[#4E9B6F] font-medium' : 'text-[#0D1F3C]'}`}>
                          {key === 'votes' ? 'Plus votées' : 'Plus récentes'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filtres statut */}
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {FILTER_TABS.map(tab => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${filter === tab.key ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                    {tab.key !== 'all' && filter !== tab.key && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[tab.key as SuggestionStatus]?.dot ?? 'bg-gray-400'}`} />}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <p className="text-[13px] text-[#94A3B8]">Aucune suggestion trouvée.</p>
                  <button onClick={openNew} className="mt-3 text-[12px] text-[#4E9B6F] font-medium hover:underline flex items-center gap-1"><Plus size={13} /> Ajouter la première</button>
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {filtered.map((sugg, idx) => {
                    const isSelected = sugg.id === selectedId
                    const upCount  = counts[sugg.id]?.up   ?? sugg.vote_count
                    const myVote   = myVoteMap[sugg.id]
                    const authorName = (sugg.coach as { full_name: string | null } | null)?.full_name
                    return (
                      <button key={sugg.id} onClick={() => openSuggestion(sugg.id)} className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${isSelected ? 'bg-[#F0FBF4]' : 'hover:bg-[#F8FAFB]'}`}>
                        <span className="flex-shrink-0 text-[11px] font-bold text-[#94A3B8] w-5 pt-0.5">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#0D1F3C] leading-snug line-clamp-2">{sugg.title}</p>
                          {sugg.description && <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{sugg.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {authorName && <span className="text-[11px] text-[#94A3B8]">{authorName}</span>}
                            {(sugg.comment_count ?? 0) > 0 && <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]"><MessageCircle size={11} />{sugg.comment_count}</span>}
                            <StatusBadge status={sugg.status} />
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); vote(sugg.id, 'up') }} className={`p-1 rounded-lg transition-colors ${myVote === 'up' ? 'text-[#4E9B6F] bg-[#4E9B6F]/10' : 'text-[#94A3B8] hover:text-[#4E9B6F] hover:bg-[#4E9B6F]/5'}`}><ThumbsUp size={13} /></button>
                          <span className={`text-[12px] font-bold ${upCount > 0 ? 'text-[#0D1F3C]' : 'text-[#94A3B8]'}`}>{upCount}</span>
                          <button onClick={e => { e.stopPropagation(); vote(sugg.id, 'down') }} className={`p-1 rounded-lg transition-colors ${myVote === 'down' ? 'text-red-500 bg-red-50' : 'text-[#94A3B8] hover:text-red-400 hover:bg-red-50'}`}><ThumbsDown size={13} /></button>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ════ PANNEAU DROIT ════ */}
          <div className={`flex-1 flex flex-col min-h-0 bg-[#F8FAFB] ${rightPanel === 'empty' ? 'hidden md:flex' : 'flex'}`}>

            {rightPanel !== 'empty' && (
              <div className="md:hidden px-4 pt-4 flex-shrink-0">
                <button onClick={closeRight} className="flex items-center gap-2 text-[13px] text-[#64748B] hover:text-[#0D1F3C]"><ArrowLeft size={15} /> Retour</button>
              </div>
            )}

            {/* État vide */}
            {rightPanel === 'empty' && (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#E2E8F0] mb-4 flex items-center justify-center">
                  <MessageCircle size={28} className="text-[#94A3B8]" />
                </div>
                <h2 className="text-[14px] font-semibold text-[#4E9B6F] mb-1">Tu as une idée ?</h2>
                <p className="text-[12px] text-[#64748B] mb-5 max-w-xs">Propose une amélioration ou vote pour les idées des autres coachs.</p>
                <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 btn-brand text-[13px] font-medium rounded-xl"><Plus size={15} /> Ajouter ma suggestion</button>
              </div>
            )}

            {/* Formulaire nouvelle suggestion */}
            {rightPanel === 'new' && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-xl mx-auto px-6 py-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[15px] font-semibold text-[#0D1F3C]">Nouvelle suggestion</h2>
                    <button onClick={closeRight} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#E2E8F0]"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleNewSuggestion} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
                    <div>
                      <label className="block text-[12px] font-medium text-[#0D1F3C] mb-1.5">Titre <span className="text-[#94A3B8] font-normal">({suggTitle.length}/80)</span></label>
                      <input type="text" value={suggTitle} onChange={e => setSuggTitle(e.target.value.slice(0, 80))} placeholder="Ex : Rappels automatiques pour les clients silencieux" required className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] bg-[#F8FAFB]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#0D1F3C] mb-1.5">Description <span className="text-[#94A3B8] font-normal">({suggDesc.length}/300)</span></label>
                      <textarea value={suggDesc} onChange={e => setSuggDesc(e.target.value.slice(0, 300))} placeholder="Décris en 2 lignes ce que ça ferait..." rows={4} className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] bg-[#F8FAFB] resize-none" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">Max 3 suggestions par semaine. On publie les meilleures idées.</p>
                    <button type="submit" disabled={submitting || !suggTitle.trim()} className="w-full py-2.5 btn-brand text-[13px] font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <><Loader2 size={13} className="animate-spin" /> Envoi...</> : 'Envoyer ma suggestion'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Détail suggestion */}
            {rightPanel === 'detail' && selectedSuggestion && (() => {
              const sugg      = selectedSuggestion
              const upCount   = counts[sugg.id]?.up   ?? sugg.vote_count
              const downCount = counts[sugg.id]?.down ?? sugg.dislike_count ?? 0
              const myVote    = myVoteMap[sugg.id]
              const authorName = (sugg.coach as { full_name: string | null } | null)?.full_name
              return (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto">
                    <div className="max-w-xl mx-auto px-6 py-8">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex-1">
                          <StatusBadge status={sugg.status} />
                          <h2 className="text-[16px] font-semibold text-[#0D1F3C] mt-2 leading-snug">{sugg.title}</h2>
                          <p className="text-[12px] text-[#94A3B8] mt-1">{authorName ? `Par ${authorName}` : 'Coach'} · {timeAgo(sugg.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={openNew} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#4E9B6F] hover:bg-[#4E9B6F]/5" title="Nouvelle suggestion"><Plus size={16} /></button>
                          <button onClick={closeRight} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#E2E8F0] md:hidden"><X size={16} /></button>
                        </div>
                      </div>

                      {sugg.description && (
                        <p className="text-[13px] text-[#475569] leading-relaxed bg-white border border-[#E2E8F0] rounded-xl p-4 mb-5">{sugg.description}</p>
                      )}

                      <div className="flex items-center gap-3 mb-7">
                        <button onClick={() => vote(sugg.id, 'up')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${myVote === 'up' ? 'bg-[#4E9B6F]/10 border-[#4E9B6F]/30 text-[#4E9B6F]' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#4E9B6F]/40 hover:text-[#4E9B6F]'}`}>
                          <ThumbsUp size={14} /><span>{upCount}</span>
                        </button>
                        <button onClick={() => vote(sugg.id, 'down')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${myVote === 'down' ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-red-200 hover:text-red-400'}`}>
                          <ThumbsDown size={14} /><span>{downCount}</span>
                        </button>
                      </div>

                      <div>
                        <h3 className="text-[13px] font-semibold text-[#0D1F3C] mb-3 flex items-center gap-2">
                          <MessageCircle size={13} /> Commentaires {comments.length > 0 && <span className="text-[11px] font-normal text-[#94A3B8]">({comments.length})</span>}
                        </h3>
                        {loadingComments ? (
                          <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-[#94A3B8]" /></div>
                        ) : comments.length === 0 ? (
                          <p className="text-[12px] text-[#94A3B8] py-4 text-center">Pas encore de commentaires.</p>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {comments.map(comment => {
                              const cName = (comment.coach as { full_name: string | null } | null)?.full_name
                              const isOwn = comment.coach_id === profile.id
                              return (
                                <div key={comment.id} className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex gap-3">
                                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#4E9B6F]/15 flex items-center justify-center text-[11px] font-bold text-[#4E9B6F]">{cName ? cName.charAt(0).toUpperCase() : '?'}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[12px] font-semibold text-[#0D1F3C]">{cName ?? 'Coach'}</span>
                                      <span className="text-[11px] text-[#94A3B8]">{timeAgo(comment.created_at)}</span>
                                    </div>
                                    <p className="text-[12px] text-[#475569] leading-relaxed">{comment.content}</p>
                                  </div>
                                  {isOwn && <button onClick={() => deleteComment(comment.id)} className="flex-shrink-0 p-1 rounded text-[#C8D5E0] hover:text-red-400"><Trash2 size={12} /></button>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <input type="text" value={commentText} onChange={e => setCommentText(e.target.value.slice(0, 500))} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }} placeholder="Ajouter un commentaire..." className="flex-1 px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[12px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] bg-white" />
                          <button onClick={postComment} disabled={postingComment || !commentText.trim()} className="flex-shrink-0 w-10 h-10 flex items-center justify-center btn-brand rounded-xl disabled:opacity-40">
                            {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#E2E8F0] px-6 py-3 bg-white hidden md:block">
                    <button onClick={openNew} className="flex items-center gap-2 text-[12px] text-[#4E9B6F] font-medium hover:text-[#3d7a58]"><Plus size={13} /> Ajouter ma suggestion</button>
                  </div>
                </div>
              )
            })()}

            {rightPanel === 'detail' && !selectedSuggestion && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-[#94A3B8]">Suggestion introuvable.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
