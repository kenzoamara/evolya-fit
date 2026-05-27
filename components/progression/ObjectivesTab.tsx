'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDateShort } from '@/lib/utils'
import type { Client, Objective } from '@/types/database'

type Props = {
  client: Client
  objectives: Objective[]
  isCoach: boolean
}

type ObjType = 'series' | 'distance' | 'timer'
type StatusFilter = 'all' | 'todo' | 'in_progress' | 'done'
type DateFilter = 'all' | 'week' | 'month' | 'no_date'

const PAGE_SIZE = 5
const DONE_PAGE_SIZE = 10

function typeLabel(obj: Objective): string {
  if (obj.type === 'series' && obj.series_count && obj.reps_count) {
    return `${obj.series_count} × ${obj.reps_count} reps`
  }
  if (obj.type === 'distance' && obj.distance_km) {
    return `${obj.distance_km} km`
  }
  if (obj.type === 'timer' && obj.series_count && obj.duration_seconds) {
    const sec = obj.duration_seconds
    const label = sec >= 60 ? `${Math.floor(sec / 60)}min${sec % 60 ? `${sec % 60}s` : ''}` : `${sec}s`
    return `${obj.series_count} × ${label}`
  }
  return ''
}

export function ObjectivesTab({ client, objectives, isCoach }: Props) {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const [showModal, setShowModal] = useState(false)
  const [objType, setObjType] = useState<ObjType>('series')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [seriesCount, setSeriesCount] = useState<number>(3)
  const [repsCount, setRepsCount] = useState<number>(10)
  const [distanceKm, setDistanceKm] = useState<number>(5)
  const [durationSeconds, setDurationSeconds] = useState<number>(30)
  const [loading, setLoading] = useState(false)
  const [addAnother, setAddAnother] = useState(false)

  const [todoPage, setTodoPage] = useState(PAGE_SIZE)
  const [inProgressPage, setInProgressPage] = useState(PAGE_SIZE)
  const [doneExpanded, setDoneExpanded] = useState(false)
  const [donePage, setDonePage] = useState(DONE_PAGE_SIZE)
  const [mobileTab, setMobileTab] = useState<'todo' | 'in_progress' | 'done'>('todo')

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const filtered = objectives.filter(o => {
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) &&
      !(o.description ?? '').toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (dateFilter === 'week') {
      if (!o.target_date) return false
      const d = new Date(o.target_date)
      if (d < startOfWeek || d > endOfWeek) return false
    }
    if (dateFilter === 'month') {
      if (!o.target_date) return false
      const d = new Date(o.target_date)
      if (d < startOfMonth || d > endOfMonth) return false
    }
    if (dateFilter === 'no_date') {
      if (o.target_date) return false
    }
    return true
  })

  const todoObjs = filtered.filter(o => o.status === 'todo').sort((a, b) => b.created_at.localeCompare(a.created_at))
  const inProgressObjs = filtered.filter(o => o.status === 'in_progress').sort((a, b) => b.created_at.localeCompare(a.created_at))
  const doneObjs = filtered.filter(o => o.status === 'done').sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))

  const rawTodo = objectives.filter(o => o.status === 'todo').length
  const rawInProgress = objectives.filter(o => o.status === 'in_progress').length
  const rawDone = objectives.filter(o => o.status === 'done').length
  const total = objectives.length
  const progressPct = total > 0 ? Math.round((rawDone / total) * 100) : 0

  function resetForm() {
    setTitle('')
    setDescription('')
    setTargetDate('')
    setObjType('series')
    setSeriesCount(3)
    setRepsCount(10)
    setDistanceKm(5)
    setDurationSeconds(30)
  }

  async function handleSubmit(e: React.FormEvent, keepOpen: boolean) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const payload: Record<string, unknown> = {
      client_id: client.id,
      coach_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      target_date: targetDate || null,
      status: 'todo',
      type: objType,
    }
    if (objType === 'series') { payload.series_count = seriesCount; payload.reps_count = repsCount }
    if (objType === 'distance') { payload.distance_km = distanceKm }
    if (objType === 'timer') { payload.series_count = seriesCount; payload.duration_seconds = durationSeconds }

    const { error } = await supabase.from('objectives').insert(payload)
    setLoading(false)
    if (error) { toast.error('Erreur lors de la sauvegarde.'); return }

    toast.success('Objectif ajouté.')
    resetForm()
    if (keepOpen) {
      setAddAnother(true)
    } else {
      setShowModal(false)
      setAddAnother(false)
    }
    router.refresh()
  }

  async function advanceStatus(obj: Objective) {
    const next = obj.status === 'todo' ? 'in_progress' : obj.status === 'in_progress' ? 'done' : 'todo'
    const supabase = createClient()
    await supabase.from('objectives').update({
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : null,
    }).eq('id', obj.id)
    const label = next === 'in_progress' ? 'En cours' : next === 'done' ? 'Atteint' : 'À faire'
    toast.success(`Objectif → ${label}`)
    router.refresh()
  }

  async function handleDelete(obj: Objective) {
    const supabase = createClient()
    await supabase.from('objectives').delete().eq('id', obj.id)
    toast.success('Objectif supprimé.')
    router.refresh()
  }

  const Column = ({
    label, color, objs, allCount, page, setPage, isDone = false,
  }: {
    label: string; color: string; objs: Objective[]; allCount: number
    page: number; setPage: (n: number) => void; isDone?: boolean
  }) => {
    const visible = isDone ? (doneExpanded ? objs.slice(0, page) : []) : objs.slice(0, page)

    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">{label}</span>
          <span className="text-xs text-[#94A3B8]">({allCount})</span>
        </div>

        {isDone && !doneExpanded ? (
          <button onClick={() => setDoneExpanded(true)}
            className="w-full text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-lg py-3 hover:bg-[#F8FAFB] transition-colors">
            Voir les {allCount} objectifs atteints
          </button>
        ) : (
          <div className="space-y-2">
            {objs.length === 0 && (
              <div className="border border-dashed border-[#E2E8F0] rounded-lg px-4 py-5 text-center text-xs text-[#94A3B8]">Aucun</div>
            )}
            {visible.map(obj => (
              <ObjectiveCard key={obj.id} obj={obj} isCoach={isCoach}
                onAdvance={isCoach ? advanceStatus : undefined}
                onDelete={isCoach ? handleDelete : undefined} />
            ))}
            {objs.length > page && (
              <button onClick={() => setPage(page + PAGE_SIZE)}
                className="w-full text-xs text-[#64748B] hover:text-[#4E9B6F] py-2 transition-colors">
                Voir {Math.min(objs.length - page, PAGE_SIZE)} autre{objs.length - page > 1 ? 's' : ''} →
              </button>
            )}
            {isDone && doneExpanded && objs.length <= page && (
              <button onClick={() => setDoneExpanded(false)}
                className="w-full text-xs text-[#94A3B8] hover:text-[#64748B] py-1 transition-colors">
                Réduire
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-[#0D1F3C] whitespace-nowrap">{rawDone} / {total} atteints</span>
          <div className="flex-1 max-w-xs h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div className="h-full bg-[#4E9B6F] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-[#64748B]">{progressPct}%</span>
        </div>
        {isCoach && (
          <button onClick={() => { resetForm(); setAddAnother(false); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
            + Ajouter un exercice
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] max-w-xs px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors" />
        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
          {([['all', 'Tous'], ['todo', 'À faire'], ['in_progress', 'En cours'], ['done', 'Atteint']] as [StatusFilter, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === v ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
          {([['all', 'Toutes dates'], ['week', 'Cette semaine'], ['month', 'Ce mois'], ['no_date', 'Sans date']] as [DateFilter, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setDateFilter(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${dateFilter === v ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex sm:hidden gap-1 bg-[#F1F5F9] rounded-lg p-1 mb-4">
        {([['todo', 'À faire', rawTodo], ['in_progress', 'En cours', rawInProgress], ['done', 'Atteint', rawDone]] as [typeof mobileTab, string, number][]).map(([k, l, count]) => (
          <button key={k} onClick={() => setMobileTab(k)}
            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${mobileTab === k ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B]'}`}>
            {l} <span className="text-[#94A3B8]">({count})</span>
          </button>
        ))}
      </div>

      <div className="hidden sm:grid grid-cols-3 gap-4">
        <Column label="À faire" color="#94A3B8" objs={todoObjs} allCount={rawTodo} page={todoPage} setPage={setTodoPage} />
        <Column label="En cours" color="#D4A853" objs={inProgressObjs} allCount={rawInProgress} page={inProgressPage} setPage={setInProgressPage} />
        <Column label="Atteint" color="#4E9B6F" objs={doneObjs} allCount={rawDone} page={donePage} setPage={setDonePage} isDone />
      </div>
      <div className="sm:hidden">
        {mobileTab === 'todo' && <Column label="À faire" color="#94A3B8" objs={todoObjs} allCount={rawTodo} page={todoPage} setPage={setTodoPage} />}
        {mobileTab === 'in_progress' && <Column label="En cours" color="#D4A853" objs={inProgressObjs} allCount={rawInProgress} page={inProgressPage} setPage={setInProgressPage} />}
        {mobileTab === 'done' && <Column label="Atteint" color="#4E9B6F" objs={doneObjs} allCount={rawDone} page={donePage} setPage={setDonePage} isDone />}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl border border-[#E2E8F0] w-full sm:max-w-lg shadow-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-[#0D1F3C]">
                {addAnother ? 'Ajouter un autre exercice' : 'Nouvel exercice'}
              </h3>
              <button onClick={() => { setShowModal(false); setAddAnother(false) }} className="text-[#94A3B8] hover:text-[#64748B] text-xl">×</button>
            </div>

            <form onSubmit={e => handleSubmit(e, false)} className="px-6 py-5 space-y-5">
              {/* Nom de l'exercice */}
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Nom de l&apos;exercice</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required autoFocus={!addAnother}
                  placeholder="Ex : Pompes, Course, Planche..."
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors" />
              </div>

              {/* Sélecteur de type */}
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-2">Type d&apos;exercice</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['series', 'Séries / Reps', 'Ex : 4×15 pompes'],
                    ['distance', 'Distance', 'Ex : 10 km'],
                    ['timer', 'Durée / Timer', 'Ex : 3×60s planche'],
                  ] as [ObjType, string, string][]).map(([v, l, sub]) => (
                    <button key={v} type="button" onClick={() => setObjType(v)}
                      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                        objType === v
                          ? 'border-[#4E9B6F] bg-[#4E9B6F]/5 text-[#4E9B6F]'
                          : 'border-[#E2E8F0] text-[#64748B] hover:border-[#D4D4CC]'
                      }`}>
                      <span className="font-semibold text-sm">{l}</span>
                      <span className="text-[10px] text-[#94A3B8] font-normal">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Champs dynamiques */}
              {objType === 'series' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#64748B] mb-1.5">Nombre de séries</label>
                    <input type="number" min={1} max={99} value={seriesCount}
                      onChange={e => setSeriesCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-center focus:outline-none focus:border-[#4E9B6F] transition-colors" />
                  </div>
                  <div className="flex items-end pb-2.5 text-[#94A3B8] font-medium text-lg">×</div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#64748B] mb-1.5">Reps par série</label>
                    <input type="number" min={1} max={999} value={repsCount}
                      onChange={e => setRepsCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-center focus:outline-none focus:border-[#4E9B6F] transition-colors" />
                  </div>
                  <div className="flex items-end pb-2.5 text-xs text-[#94A3B8]">reps</div>
                </div>
              )}

              {objType === 'distance' && (
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Distance à parcourir (km)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0.1} max={999} step={0.1} value={distanceKm}
                      onChange={e => setDistanceKm(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium focus:outline-none focus:border-[#4E9B6F] transition-colors" />
                    <span className="text-sm text-[#64748B] font-medium whitespace-nowrap">km</span>
                  </div>
                </div>
              )}

              {objType === 'timer' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#64748B] mb-1.5">Nombre de séries</label>
                    <input type="number" min={1} max={99} value={seriesCount}
                      onChange={e => setSeriesCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-center focus:outline-none focus:border-[#4E9B6F] transition-colors" />
                  </div>
                  <div className="flex items-end pb-2.5 text-[#94A3B8] font-medium text-lg">×</div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#64748B] mb-1.5">Durée par série (sec)</label>
                    <input type="number" min={5} max={3600} step={5} value={durationSeconds}
                      onChange={e => setDurationSeconds(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-center focus:outline-none focus:border-[#4E9B6F] transition-colors" />
                  </div>
                  <div className="flex items-end pb-2.5 text-xs text-[#94A3B8]">sec</div>
                </div>
              )}

              {/* Aperçu */}
              {title && (
                <div className="bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg px-4 py-3 text-sm text-[#64748B]">
                  <span className="font-medium text-[#0D1F3C]">{title}</span>
                  {' — '}
                  {objType === 'series' && <span>{seriesCount} série{seriesCount > 1 ? 's' : ''} de {repsCount} rep{repsCount > 1 ? 's' : ''}</span>}
                  {objType === 'distance' && <span>{distanceKm} km</span>}
                  {objType === 'timer' && <span>{seriesCount} série{seriesCount > 1 ? 's' : ''} de {durationSeconds}s</span>}
                </div>
              )}

              {/* Date cible optionnelle */}
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Date cible <span className="font-normal text-[#64748B]">(optionnel)</span></label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors" />
              </div>

              <div className="flex flex-col gap-2 pb-1">
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowModal(false); setAddAnother(false) }}
                    className="flex-1 py-2.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading || !title.trim()}
                    className="flex-1 py-2.5 bg-[#4E9B6F] text-white text-sm font-medium rounded-lg hover:bg-[#5a7a60] transition-colors disabled:opacity-60">
                    {loading ? 'Ajout...' : 'Valider'}
                  </button>
                </div>
                <button type="button" disabled={loading || !title.trim()}
                  onClick={e => handleSubmit(e as unknown as React.FormEvent, true)}
                  className="w-full py-2.5 border border-[#4E9B6F] text-[#4E9B6F] text-sm font-medium rounded-lg hover:bg-[#4E9B6F]/5 transition-colors disabled:opacity-40">
                  {loading ? '...' : '+ Valider et ajouter un autre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ObjectiveCard({
  obj, isCoach, onAdvance, onDelete,
}: {
  obj: Objective; isCoach: boolean
  onAdvance?: (obj: Objective) => void
  onDelete?: (obj: Objective) => void
}) {
  const detail = typeLabel(obj)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 group hover:border-[#D4D4CC] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {obj.status === 'done' && <span className="text-[#4E9B6F] text-sm flex-shrink-0">✓</span>}
            <p className={`text-sm font-medium leading-snug ${obj.status === 'done' ? 'text-[#4E9B6F] line-through' : 'text-[#0D1F3C]'}`}>
              {obj.title}
            </p>
          </div>
          {detail && (
            <span className="inline-block text-xs text-[#4E9B6F] bg-[#4E9B6F]/8 px-2 py-0.5 rounded-full mt-1 font-medium">
              {detail}
            </span>
          )}
          {obj.description && (
            <p className="text-xs text-[#64748B] leading-relaxed mt-1">{obj.description}</p>
          )}
          {obj.target_date && (
            <p className="text-xs text-[#94A3B8] mt-1">Cible : {formatDateShort(obj.target_date)}</p>
          )}
          {obj.status === 'done' && obj.completed_at && (
            <p className="text-xs text-[#4E9B6F] mt-1">Atteint le {formatDateShort(obj.completed_at)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0">
          {isCoach && onAdvance && obj.status !== 'done' && (
            <button onClick={() => onAdvance(obj)}
              className="text-[#94A3B8] hover:text-[#4E9B6F] transition-colors text-sm px-1"
              title="Avancer le statut">
              →
            </button>
          )}
          {isCoach && onDelete && (
            <button onClick={() => onDelete(obj)}
              className="text-[#94A3B8] hover:text-red-400 transition-colors text-xs px-1"
              title="Supprimer">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
