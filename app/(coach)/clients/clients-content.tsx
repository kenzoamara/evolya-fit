'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/shared/empty-state'
import type { Profile, Client, Objective, Checkin, Session } from '@/types/database'
import { getPlanLimits } from '@/lib/plan-limits'

type ClientWithRelations = Client & {
  objectives: Objective[]
  checkins: Checkin[]
  sessions: Session[]
}

const AVATAR_COLORS = [
  { bg: '#EEF9F3', text: '#4E9B6F' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#F5F3FF', text: '#7C3AED' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#F0FDFA', text: '#0D9488' },
  { bg: '#FEF2F2', text: '#DC2626' },
]

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return fullName
  const first = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}

function formatActivityDate(date: Date, hasTime: boolean): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = hasTime
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  if (isToday) return timeStr ? `Aujourd'hui à ${timeStr}` : "Aujourd'hui"
  if (isYesterday) return timeStr ? `Hier à ${timeStr}` : 'Hier'

  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return timeStr ? `${dateStr} à ${timeStr}` : dateStr
}

function getLastActivity(client: ClientWithRelations, now: Date): { text: string; color: string; dot: string } {
  const candidates: { date: Date; label: string; hasTime: boolean }[] = []

  if (client.last_checkin_at) {
    candidates.push({ date: new Date(client.last_checkin_at), label: 'Check-in', hasTime: true })
  }
  const sessions = (client.sessions ?? []).filter(s => new Date(s.session_date) <= now)
  if (sessions.length > 0) {
    const last = [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date))[0]
    candidates.push({ date: new Date(last.session_date), label: 'Séance', hasTime: false })
  }
  const doneObjs = (client.objectives ?? []).filter(o => o.status === 'done' && o.completed_at)
  if (doneObjs.length > 0) {
    const last = [...doneObjs].sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))[0]
    candidates.push({ date: new Date(last.completed_at!), label: 'Objectif', hasTime: true })
  }

  if (candidates.length === 0) return { text: 'Aucune activité', color: '#94A3B8', dot: '#94A3B8' }

  const latest = candidates.sort((a, b) => b.date.getTime() - a.date.getTime())[0]
  const days = Math.floor((now.getTime() - latest.date.getTime()) / 86400000)
  const display = `${latest.label} · ${formatActivityDate(latest.date, latest.hasTime)}`

  if (days <= 0)  return { text: display, color: '#16A34A', dot: '#16A34A' }
  if (days <= 7)  return { text: display, color: '#16A34A', dot: '#16A34A' }
  if (days <= 14) return { text: display, color: '#CA8A04', dot: '#D97706' }
  if (days <= 30) return { text: display, color: '#EA580C', dot: '#EA580C' }
  return { text: display, color: '#DC2626', dot: '#DC2626' }
}


type Props = { profile: Profile; clients: ClientWithRelations[]; upgraded?: boolean }

export function ClientsContent({ profile, clients, upgraded }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (upgraded) {
      const newLimit = getPlanLimits(profile.plan).clients
      toast.success(`Plan activé — ${newLimit === -1 ? 'membres illimités' : `${newLimit} membres disponibles`}`)
      // Nettoyer le param de l'URL sans reload
      window.history.replaceState({}, '', '/clients')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [clientLink, setClientLink] = useState<{ name: string; url: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const now = new Date()

  // ── Onglets + lien partageable + demandes reçues ─────────────────────────────
  const [tab, setTab] = useState<'membres' | 'demandes'>('membres')
  const [shareModal, setShareModal] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
  const shareLink = `${appUrl}/rejoindre/${profile.id}`

  const pendingClients = clients.filter(c => c.status === 'pending')

  async function handleCopyShareLink() {
    await navigator.clipboard.writeText(shareLink)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  async function handleApprove(client: ClientWithRelations) {
    if (limitReached) {
      toast.error(`Limite de ${clientMax} membres atteinte. Passe à un plan supérieur pour valider cette demande.`)
      return
    }
    setApproveLoadingId(client.id)
    try {
      const res = await fetch('/api/clients/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erreur lors de la validation.'); return }
      if (data.hasEmail) {
        toast.success(`${client.full_name} validé — lien envoyé par email.`)
      } else {
        // Pas d'email : on montre le lien à copier/envoyer manuellement
        setClientLink({ name: client.full_name, url: data.magicLink })
        setShowAddModal(true)
        toast.success(`${client.full_name} validé. Envoie-lui son lien d'accès.`)
      }
      router.refresh()
    } catch {
      toast.error('Erreur réseau. Réessaie.')
    } finally {
      setApproveLoadingId(null)
    }
  }

  async function handleReject(clientId: string) {
    setApproveLoadingId(clientId)
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    setApproveLoadingId(null)
    if (error) { toast.error('Erreur lors du refus.'); return }
    toast.success('Demande refusée.')
    router.refresh()
  }

  function openEditName(client: ClientWithRelations, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const parts = client.full_name.trim().split(' ')
    setEditFirstName(parts[0] ?? '')
    setEditLastName(parts.slice(1).join(' '))
    setEditingClient(client)
  }

  function handleResendInvite(client: ClientWithRelations, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.evolyafit.fr'
    const link = `${appUrl}/c/${client.magic_token}/dashboard`
    setClientLink({ name: client.full_name, url: link })
    setShowAddModal(true)
  }

  async function handleEditName(e: React.FormEvent) {
    e.preventDefault()
    if (!editingClient) return
    setEditLoading(true)
    const fullName = [editFirstName.trim(), editLastName.trim()].filter(Boolean).join(' ')
    const supabase = createClient()
    const { error } = await supabase.from('clients').update({ full_name: fullName }).eq('id', editingClient.id)
    setEditLoading(false)
    if (error) { toast.error('Erreur lors de la modification.'); return }
    toast.success('Nom mis à jour.')
    setEditingClient(null)
    router.refresh()
  }

  async function handleDeleteClient(clientId: string) {
    setDeleteLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    setDeleteLoading(false)
    if (error) { toast.error('Erreur lors de la suppression.'); return }
    toast.success('Client supprimé.')
    setDeleteConfirmId(null)
    router.refresh()
  }

  const filteredClients = clients.filter((c) =>
    c.status !== 'pending' &&
    (c.full_name.toLowerCase().includes(search.toLowerCase()) ||
     (c.email ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const activeClients = clients.filter((c) => c.status === 'active').length
  const clientMax = getPlanLimits(profile.plan).clients
  const limitReached = clientMax !== -1 && activeClients >= clientMax
  const limitNear = !limitReached && clientMax !== -1 && activeClients >= clientMax - 2

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    const fullName = [newFirstName.trim(), newLastName.trim()].filter(Boolean).join(' ')
    try {
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: fullName, clientEmail: newEmail }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setClientLink({ name: fullName, url: data.magicLink })
      setNewFirstName(''); setNewLastName(''); setNewEmail('')
      router.refresh()
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-6 pb-6 sm:py-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0D1F3C] tracking-tight">Mes membres</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-sm text-[#64748B]">
              {activeClients} actif{activeClients > 1 ? 's' : ''}
              {clientMax !== -1 && ` sur ${clientMax}`}
            </p>
            {clientMax !== -1 && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (activeClients / clientMax) * 100)}%`,
                      backgroundColor: activeClients >= clientMax ? '#EF4444' : activeClients / clientMax >= 0.8 ? '#F59E0B' : '#4E9B6F',
                    }}
                  />
                </div>
                <span className="text-xs text-[#94A3B8]">{Math.round((activeClients / clientMax) * 100)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Lien partageable — désactivé si limite atteinte */}
          <button
            onClick={() => {
              if (limitReached) {
                router.push('/plans')
              } else {
                setShareModal(true)
              }
            }}
            title={limitReached ? 'Limite atteinte — passer à un plan supérieur' : "Partager mon lien d'invitation"}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 border text-sm font-medium rounded-lg transition-all active:scale-[0.98] whitespace-nowrap ${
              limitReached
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626] cursor-not-allowed opacity-70'
                : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFB] text-[#374151]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className="sm:hidden">{limitReached ? 'Limite' : 'Partager'}</span>
            <span className="hidden sm:inline">{limitReached ? 'Limite atteinte' : 'Partager mon lien'}</span>
          </button>

          {limitReached ? (
            <button onClick={() => router.push('/plans')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D4A853] hover:bg-[#c49940] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] whitespace-nowrap">
              Plan supérieur
            </button>
          ) : (
            <button onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4E9B6F] hover:bg-[#3d8058] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] whitespace-nowrap"
              style={{ boxShadow: '0 1px 2px rgba(97,128,112,0.2)' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5v10M1.5 6.5h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Onglets Elève / Demandes reçues */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#E2E8F0]">
        <button
          onClick={() => setTab('membres')}
          className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${tab === 'membres' ? 'text-[#0D1F3C]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
        >
          Elève
          {tab === 'membres' && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#4E9B6F] rounded-full" />}
        </button>
        <button
          onClick={() => setTab('demandes')}
          className={`relative px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'demandes' ? 'text-[#0D1F3C]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
        >
          Demandes reçues
          {pendingClients.length > 0 && (
            <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 text-white bg-[#EF4444]">
              {pendingClients.length}
            </span>
          )}
          {tab === 'demandes' && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#4E9B6F] rounded-full" />}
        </button>
      </div>

      {/* Demandes reçues */}
      {tab === 'demandes' && (
        pendingClients.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl">
            <EmptyState icon="clients" title="Aucune demande reçue"
              description="Les personnes qui s'inscrivent via ton lien de partage apparaissent ici. Tu reçois aussi une notification par email." />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
            {pendingClients.map((client) => {
              const c = avatarColor(client.full_name)
              const isLoading = approveLoadingId === client.id
              return (
                <div key={client.id} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 sm:px-5 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: c.bg, color: c.text }}>
                      {client.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#0D1F3C] truncate">{client.full_name}</p>
                      <p className="text-xs text-[#94A3B8] truncate">{client.email?.includes('@evolya.internal') ? 'Sans email' : client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button onClick={() => handleReject(client.id)} disabled={isLoading}
                      className="px-3 py-2 text-xs font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] transition-colors disabled:opacity-50">
                      Refuser
                    </button>
                    <button onClick={() => handleApprove(client)} disabled={isLoading}
                      className="px-3 py-2 text-xs font-semibold text-white bg-[#4E9B6F] rounded-lg hover:bg-[#3d8058] transition-colors disabled:opacity-50">
                      {isLoading ? '...' : 'Valider'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Barre de recherche */}
      {tab === 'membres' && clients.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all" />
          </div>
        </div>
      )}

      {/* Bannière upgrade */}
      {limitReached && (
        <div className="mb-4 bg-[#FFFBEB] border border-[#D4A853]/40 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D4A853]/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L1 14.5h14L8 1.5Z" stroke="#D4A853" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v3.5" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="12" r="0.75" fill="#D4A853"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D1F3C]">Limite de {clientMax} membres atteinte</p>
              <p className="text-xs text-[#64748B] mt-0.5">Passez au plan supérieur pour continuer à ajouter des membres.</p>
            </div>
          </div>
          <button onClick={() => router.push('/plans')}
            className="flex-shrink-0 px-4 py-2 bg-[#D4A853] hover:bg-[#c49940] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] whitespace-nowrap">
            Upgrader
          </button>
        </div>
      )}
      {limitNear && (
        <div className="mb-4 bg-[#FFFBEB] border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-[12px] text-amber-700">
            Il vous reste <strong>{clientMax - activeClients} place{clientMax - activeClients > 1 ? 's' : ''}</strong> sur votre plan ({activeClients}/{clientMax} membres).
          </p>
          <a href="/plans" className="text-[11px] font-semibold text-amber-700 underline whitespace-nowrap">Voir les plans</a>
        </div>
      )}

      {/* Liste */}
      {tab === 'membres' && (filteredClients.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl">
          {clients.length === 0 ? (
            <EmptyState icon="clients" title="Aucun membre encore"
              description="Invite ton premier membre et commence à suivre sa progression."
              action={
                <button onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 bg-[#4E9B6F] text-white text-sm font-medium rounded-lg hover:bg-[#3d8058] transition-all active:scale-[0.98]">
                  Inviter un membre
                </button>
              } />
          ) : (
            <EmptyState icon="clients" title={`Aucun résultat pour "${search}"`} description="Essayez avec un autre nom ou email." />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
          {filteredClients.map((client) => {
            const activity = getLastActivity(client, now)

            return (
              <div key={client.id} className="flex items-stretch gap-2 group/card">
                <Link href={`/clients/${client.id}`}
                  className="flex-1 flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 sm:px-5 py-4 hover:border-[#4E9B6F]/40 hover:shadow-sm transition-all min-w-0">

                  <div className="flex items-center gap-4 min-w-0">
                    {(() => { const c = avatarColor(client.full_name); return (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: c.bg, color: c.text }}>
                        {client.full_name.charAt(0).toUpperCase()}
                      </div>
                    )})()}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#0D1F3C]">{formatDisplayName(client.full_name)}</span>
                        {client.status === 'inactive' ? (
                          <span className="text-[10px] font-medium bg-[#F1F5F9] text-[#94A3B8] px-1.5 py-0.5 rounded-full">Inactif</span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EEF9F3', color: '#4E9B6F' }}>Actif</span>
                        )}
                        {(() => {
                          const lastCheckin = client.checkins.length > 0
                            ? new Date(Math.max(...client.checkins.map(ch => new Date(ch.submitted_at as string).getTime())))
                            : null
                          const daysSince = lastCheckin ? Math.floor((now.getTime() - lastCheckin.getTime()) / 86400000) : 999
                          if (client.status === 'active' && daysSince > 7) {
                            return (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
                                {daysSince >= 999 ? 'Jamais' : `${daysSince}j`}
                              </span>
                            )
                          }
                          return null
                        })()}
                      </div>
                      <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: activity.color }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: activity.dot }} />
                        <span>{activity.text}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-[#94A3B8] group-hover:text-[#4E9B6F] transition-colors text-sm">→</span>
                  </div>
                </Link>

                {/* Actions — masquées sur mobile, hover sur desktop */}
                <div className="hidden sm:flex flex-col gap-1 items-center justify-center sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity">
                  <button onClick={(e) => handleResendInvite(client, e)}
                    className="text-xs text-[#64748B] hover:text-[#4E9B6F] border border-[#E2E8F0] hover:border-[#4E9B6F]/30 bg-white px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                    🔗 Lien
                  </button>
                  <button onClick={(e) => openEditName(client, e)}
                    className="text-xs text-[#64748B] hover:text-[#4E9B6F] border border-[#E2E8F0] hover:border-[#4E9B6F]/30 bg-white px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                    ✏ Nom
                  </button>
                  {deleteConfirmId === client.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDeleteClient(client.id)} disabled={deleteLoading}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg transition-colors disabled:opacity-60">
                        {deleteLoading ? '...' : 'Oui'}
                      </button>
                      <button onClick={() => setDeleteConfirmId(null)}
                        className="text-xs border border-[#E2E8F0] text-[#64748B] px-2 py-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors bg-white">
                        Non
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(client.id)}
                      className="text-xs text-[#64748B] hover:text-red-500 border border-[#E2E8F0] hover:border-red-200 bg-white px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Modal partage du lien */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${shareModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setShareModal(false) }}
      >
        <div className={`bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-xl transition-all duration-150 ${shareModal ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'}`}>
          <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-semibold text-[#0D1F3C] tracking-tight">Partager mon lien</h3>
            <button onClick={() => setShareModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors text-xl">×</button>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
              Envoie ce lien unique à autant de personnes que tu veux. Chaque inscription arrive dans <strong className="text-[#0D1F3C]">Demandes reçues</strong> pour que tu la valides.
            </p>

            <div className="bg-[#F1F5F9] rounded-xl px-4 py-3 mb-4 flex items-center gap-3 min-w-0">
              <span className="text-xs text-[#64748B] truncate flex-1 font-mono">{shareLink}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyShareLink}
                className="flex-1 py-2.5 border border-[#E2E8F0] text-sm font-medium text-[#0D1F3C] rounded-lg hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-2">
                {shareCopied ? '✓ Copié !' : '📋 Copier le lien'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Rejoins mon coaching ici : ${shareLink}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#1fb855] transition-colors flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.533 5.845L.057 23.57a.75.75 0 00.914.914l5.725-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.742-.521-5.292-1.428l-.38-.223-3.397.875.893-3.317-.243-.394A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ajout client */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${showAddModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setClientLink(null); setLinkCopied(false) } }}
      >
        <div className={`bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-xl transition-all duration-150 ${showAddModal ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'}`}>

          {/* ── Étape 1 : formulaire ── */}
          {!clientLink && (<>
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-semibold text-[#0D1F3C] tracking-tight">Ajouter un membre</h3>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors text-xl">×</button>
            </div>
            <form onSubmit={handleAddClient} className="px-6 py-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Prénom</label>
                  <input type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} required
                    placeholder="Thomas"
                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Nom</label>
                  <input type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)}
                    placeholder="Martin"
                    className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Email <span className="text-[#94A3B8] font-normal">(optionnel)</span></label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  placeholder="thomas@exemple.com"
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={addLoading || !newFirstName.trim()}
                  className="flex-1 py-2.5 bg-[#4E9B6F] text-white text-sm font-medium rounded-lg hover:bg-[#3d8058] transition-all active:scale-[0.98] disabled:opacity-50">
                  {addLoading ? 'Création...' : 'Créer le membre →'}
                </button>
              </div>
            </form>
          </>)}

          {/* ── Étape 2 : lien à partager ── */}
          {clientLink && (
            <div className="px-6 py-6">
              <div className="w-12 h-12 rounded-full bg-[#4E9B6F]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1 13l-4-4 1.41-1.41L10 12.17l6.59-6.58L18 7l-8 8z" fill="#4E9B6F"/></svg>
              </div>
              <h3 className="font-semibold text-[#0D1F3C] text-center mb-1">Membre créé ✓</h3>
              <p className="text-sm text-[#64748B] text-center mb-5">Envoie ce lien à <strong>{clientLink.name}</strong> par WhatsApp, SMS ou email.</p>

              {/* Lien */}
              <div className="bg-[#F1F5F9] rounded-xl px-4 py-3 mb-4 flex items-center gap-3 min-w-0">
                <span className="text-xs text-[#64748B] truncate flex-1 font-mono">{clientLink.url}</span>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(clientLink.url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                  className="flex-1 py-2.5 border border-[#E2E8F0] text-sm font-medium text-[#0D1F3C] rounded-lg hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-2">
                  {linkCopied ? '✓ Copié !' : '📋 Copier le lien'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${clientLink.name} ! Voici ton espace de suivi Evolya : ${clientLink.url}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#1fb855] transition-colors flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.533 5.845L.057 23.57a.75.75 0 00.914.914l5.725-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.933 0-3.742-.521-5.292-1.428l-.38-.223-3.397.875.893-3.317-.243-.394A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  WhatsApp
                </a>
              </div>

              <button onClick={() => { setShowAddModal(false); setClientLink(null); setLinkCopied(false) }}
                className="w-full mt-3 py-2.5 text-sm text-[#64748B] hover:text-[#0D1F3C] transition-colors">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal édition nom — always mounted, CSS transition */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${editingClient ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setEditingClient(null) }}
      >
        <div className={`bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm shadow-xl transition-all duration-150 ${editingClient ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'}`}>
          <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-semibold text-[#0D1F3C] tracking-tight">Modifier le nom</h3>
            <button onClick={() => setEditingClient(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors text-xl">×</button>
          </div>
          <form onSubmit={handleEditName} className="px-6 py-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Prénom</label>
                <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Nom</label>
                <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] focus:ring-2 focus:ring-[#4E9B6F]/10 transition-all" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingClient(null)}
                className="flex-1 py-2.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={editLoading || !editFirstName.trim()}
                className="flex-1 py-2.5 bg-[#4E9B6F] text-white text-sm font-medium rounded-lg hover:bg-[#3d8058] transition-all active:scale-[0.98] disabled:opacity-50">
                {editLoading ? '...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </main>
  )
}
