'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { planMrr } from '@/lib/stripe/plans'
import { PLAN_LABELS } from '@/lib/plan-features'

type Coach = {
  id: string
  full_name: string | null
  email: string | null
  plan: string
  plan_status: string
  suspended: boolean
  client_limit: number
  trial_ends_at: string | null
  created_at: string
  last_seen_at: string | null
  activeClients: number
  mrr: number
}

type Props = { coaches: Coach[] }

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: 'bg-[#F1F5F9] text-[#64748B]',
    trial: 'bg-[#F1F5F9] text-[#64748B]',
    starter: 'bg-blue-50 text-blue-700',
    growth: 'bg-green-50 text-green-700',
    standard: 'bg-green-50 text-green-700',
    pro: 'bg-[#F5F3FF] text-[#7C3AED]',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[plan] ?? styles.trial}`}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  )
}

function StatusBadge({ coach }: { coach: Coach }) {
  if (coach.suspended) return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Suspendu</span>
  if (coach.plan_status === 'cancelled') return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">Churné</span>
  return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Actif</span>
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function CoachesAdminContent({ coaches: initial }: Props) {
  const [coaches, setCoaches] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'mrr' | 'last_seen_at'>('created_at')
  const [selected, setSelected] = useState<Coach | null>(null)
  const [modalTab, setModalTab] = useState<'info' | 'actions'>('info')

  // Action states
  const [extendDays, setExtendDays] = useState(30)
  const [newPlan, setNewPlan] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [loading, setLoading] = useState(false)

  // Realtime: new coach signup or plan/status change
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-coaches-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new as Coach & { role?: string }
        if (p.role === 'coach') {
          setCoaches(prev => [{ ...p, activeClients: 0, mrr: planMrr(p.plan) } as Coach, ...prev])
          toast.info(`Nouveau coach : ${p.full_name ?? 'Coach'}`)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new as Coach & { role?: string }
        if (p.role === 'coach') {
          setCoaches(prev => prev.map(c => c.id === p.id ? { ...c, ...p, mrr: planMrr(p.plan) } : c))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.old as { id?: string }
        if (p.id) setCoaches(prev => prev.filter(c => c.id !== p.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    let list = [...coaches]
    if (search) list = list.filter(c =>
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
    if (filterPlan !== 'all') list = list.filter(c => c.plan === filterPlan)
    if (filterStatus === 'active') list = list.filter(c => !c.suspended && c.plan_status !== 'cancelled')
    if (filterStatus === 'suspended') list = list.filter(c => c.suspended)
    if (filterStatus === 'churned') list = list.filter(c => c.plan_status === 'cancelled')
    list.sort((a, b) => {
      if (sortBy === 'mrr') return b.mrr - a.mrr
      if (sortBy === 'last_seen_at') return (b.last_seen_at ?? '').localeCompare(a.last_seen_at ?? '')
      return b.created_at.localeCompare(a.created_at)
    })
    return list
  }, [coaches, search, filterPlan, filterStatus, sortBy])

  function exportCSV() {
    const headers = ['Nom', 'Email', 'Plan', 'Statut', 'Clients actifs', 'MRR', 'Inscription', 'Dernière connexion']
    const rows = filtered.map(c => [
      c.full_name ?? '', c.email ?? '', PLAN_LABELS[c.plan] ?? c.plan,
      c.suspended ? 'Suspendu' : c.plan_status,
      c.activeClients, c.mrr,
      formatDate(c.created_at), formatDate(c.last_seen_at),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'coaches.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  async function callAction(action: string, body: Record<string, unknown>) {
    setLoading(true)
    const res = await fetch('/api/admin/coaches/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId: selected?.id, ...body }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Erreur'); return false }
    return true
  }

  async function handleSuspend() {
    if (!selected) return
    const ok = await callAction('suspend', { suspend: !selected.suspended })
    if (ok) {
      const updated = { ...selected, suspended: !selected.suspended }
      setCoaches(prev => prev.map(c => c.id === selected.id ? updated : c))
      setSelected(updated)
      toast.success(updated.suspended ? 'Compte suspendu.' : 'Compte réactivé.')
    }
  }

  async function handleExtendTrial() {
    if (!selected) return
    const ok = await callAction('extend-trial', { days: extendDays })
    if (ok) toast.success(`+${extendDays} jours offerts à ${selected.full_name}.`)
  }

  async function handleChangePlan() {
    if (!selected || !newPlan) return
    const ok = await callAction('change-plan', { plan: newPlan })
    if (ok) {
      const mrrMap: Record<string, number> = { trial: 0, starter: 19, standard: 49 }
      const updated = { ...selected, plan: newPlan, mrr: mrrMap[newPlan] ?? 0 }
      setCoaches(prev => prev.map(c => c.id === selected.id ? updated : c))
      setSelected(updated)
      toast.success('Plan modifié.')
      setNewPlan('')
    }
  }

  async function handleDelete() {
    if (!selected || confirmDelete !== selected.email) return
    const ok = await callAction('delete', { confirmEmail: confirmDelete })
    if (ok) {
      setCoaches(prev => prev.filter(c => c.id !== selected.id))
      setSelected(null)
      toast.success('Compte supprimé.')
    }
  }

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Coaches</h1>
          <p className="text-sm text-[#64748B]">{coaches.length} comptes au total</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
          ↓ Export CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher nom / email..."
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F] w-56"
        />
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none">
          <option value="all">Tous les plans</option>
          <option value="trial">Découverte</option>
          <option value="starter">Lancement</option>
          <option value="growth">Croissance</option>
          <option value="pro">Pro</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
          <option value="churned">Churnés</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none">
          <option value="created_at">Trier : date inscription</option>
          <option value="mrr">Trier : MRR</option>
          <option value="last_seen_at">Trier : dernière connexion</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFB]">
              {['Nom / Email', 'Plan', 'Statut', 'Clients', 'Inscription', 'Dernière co.', 'MRR'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(coach => (
              <tr
                key={coach.id}
                onClick={() => { setSelected(coach); setModalTab('info') }}
                className="border-b border-[#F1F5F9] hover:bg-[#F8FAFB] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0D1F3C]">{coach.full_name ?? '—'}</p>
                  <p className="text-xs text-[#64748B]">{coach.email}</p>
                </td>
                <td className="px-4 py-3"><PlanBadge plan={coach.plan} /></td>
                <td className="px-4 py-3"><StatusBadge coach={coach} /></td>
                <td className="px-4 py-3 text-[#0D1F3C]">{coach.activeClients}</td>
                <td className="px-4 py-3 text-[#64748B]">{formatDate(coach.created_at)}</td>
                <td className="px-4 py-3 text-[#64748B]">{formatDate(coach.last_seen_at)}</td>
                <td className="px-4 py-3 font-medium text-[#4E9B6F]">{coach.mrr}€</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-[#94A3B8] text-sm">Aucun coach trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal coach */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="font-semibold text-[#0D1F3C]">{selected.full_name}</h2>
                <p className="text-sm text-[#64748B]">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#94A3B8] hover:text-[#64748B] text-xl">×</button>
            </div>

            <div className="flex gap-1 p-3 border-b border-[#E2E8F0]">
              {(['info', 'actions'] as const).map(t => (
                <button key={t} onClick={() => setModalTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modalTab === t ? 'bg-[#0D1F3C] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>
                  {t === 'info' ? 'Infos' : 'Actions admin'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {modalTab === 'info' && (
                <div className="space-y-3">
                  {[
                    ['Plan', <PlanBadge key="p" plan={selected.plan} />],
                    ['Statut', <StatusBadge key="s" coach={selected} />],
                    ['Clients actifs', selected.activeClients],
                    ['MRR généré', `${selected.mrr}€/mois`],
                    ['Date inscription', formatDate(selected.created_at)],
                    ['Dernière connexion', formatDate(selected.last_seen_at)],
                    ['Trial ends', formatDate(selected.trial_ends_at)],
                  ].map(([label, value], i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                      <span className="text-sm text-[#64748B]">{label}</span>
                      <span className="text-sm font-medium text-[#0D1F3C]">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'actions' && (
                <div className="space-y-5">
                  {/* Changer plan */}
                  <div>
                    <p className="text-xs font-semibold text-[#0D1F3C] mb-2">Changer de plan</p>
                    <div className="flex gap-2">
                      <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                        className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]">
                        <option value="">Sélectionner...</option>
                        <option value="trial">Découverte (0€)</option>
                        <option value="starter">Lancement (19€)</option>
                        <option value="growth">Croissance (29€)</option>
                        <option value="pro">Pro (49€)</option>
                      </select>
                      <button onClick={handleChangePlan} disabled={!newPlan || loading}
                        className="px-3 py-2 bg-[#4E9B6F] text-white rounded-lg text-sm disabled:opacity-50 hover:bg-[#5a7a60] transition-colors">
                        Appliquer
                      </button>
                    </div>
                  </div>

                  {/* Offrir jours */}
                  <div>
                    <p className="text-xs font-semibold text-[#0D1F3C] mb-2">Offrir des jours gratuits</p>
                    <div className="flex gap-2">
                      <input type="number" value={extendDays} onChange={e => setExtendDays(Number(e.target.value))} min={1} max={365}
                        className="w-24 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]" />
                      <span className="text-sm text-[#64748B] self-center">jours</span>
                      <button onClick={handleExtendTrial} disabled={loading}
                        className="px-3 py-2 bg-[#D4A853] text-white rounded-lg text-sm disabled:opacity-50 hover:bg-[#c49640] transition-colors">
                        Offrir
                      </button>
                    </div>
                  </div>

                  {/* Suspendre / Réactiver */}
                  <div>
                    <p className="text-xs font-semibold text-[#0D1F3C] mb-2">
                      {selected.suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                    </p>
                    <button onClick={handleSuspend} disabled={loading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${selected.suspended ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'}`}>
                      {selected.suspended ? '✓ Réactiver le compte' : '⏸ Suspendre le compte'}
                    </button>
                  </div>

                  {/* Supprimer */}
                  <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                    <p className="text-xs font-semibold text-red-700 mb-2">⚠ Supprimer le compte (irréversible)</p>
                    <p className="text-xs text-red-600 mb-3">Confirme en saisissant l&apos;email : <strong>{selected.email}</strong></p>
                    <input
                      type="text" value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)}
                      placeholder={selected.email ?? ''}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm mb-2 focus:outline-none bg-white"
                    />
                    <button
                      onClick={handleDelete}
                      disabled={confirmDelete !== selected.email || loading}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
