'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Checkin, Objective } from '@/types/database'
import {
  buildCheckinMap, formatShortDate, toDateKey, DAY_LABELS, getMonday,
} from './utils'
import { DifficultyRatingModal } from './DifficultyRatingModal'

type Props = {
  checkins: Checkin[]
  objectives: Objective[]
  clientId: string
  isClient?: boolean
  token?: string
}

type CompletionMap = Map<string, Set<string>>

// ─── Rest day helpers ─────────────────────────────────────────────────────────
export function loadRestDays(clientId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(`cl_restdays_${clientId}`)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function toggleRestDay(clientId: string, dateKey: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const days = loadRestDays(clientId)
    if (days.has(dateKey)) days.delete(dateKey)
    else days.add(dateKey)
    localStorage.setItem(`cl_restdays_${clientId}`, JSON.stringify(Array.from(days)))
    return days.has(dateKey)
  } catch { return false }
}

// ─── Persistance localStorage ─────────────────────────────────────────────────
function storageKey(clientId: string, weekKey: string) {
  return `cl_completions_${clientId}_${weekKey}`
}

function loadFromStorage(clientId: string, weekStart: Date): CompletionMap {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = localStorage.getItem(storageKey(clientId, toDateKey(weekStart)))
    if (!raw) return new Map()
    const parsed: Record<string, string[]> = JSON.parse(raw)
    const map = new Map<string, Set<string>>()
    Object.entries(parsed).forEach(([date, ids]) => map.set(date, new Set(ids)))
    return map
  } catch { return new Map() }
}

function saveToStorage(clientId: string, weekStart: Date, completions: CompletionMap) {
  if (typeof window === 'undefined') return
  try {
    const obj: Record<string, string[]> = {}
    completions.forEach((set, date) => { obj[date] = Array.from(set) })
    localStorage.setItem(storageKey(clientId, toDateKey(weekStart)), JSON.stringify(obj))
  } catch {}
}

// ─── Donut SVG animé ──────────────────────────────────────────────────────────
function DonutChart({ pct }: { pct: number | null }) {
  const r = 22
  const circumference = 2 * Math.PI * r
  const target = pct ?? 0
  const [displayed, setDisplayed] = useState(target)
  const animRef = useRef<number | null>(null)
  const currentRef = useRef(target)

  useEffect(() => {
    const to = target
    if (animRef.current) cancelAnimationFrame(animRef.current)

    function step() {
      const cur = currentRef.current
      if (cur === to) return
      const diff = to - cur
      // Vitesse : 1 par frame si diff ≤5, 3 si ≤20, 5 sinon
      const inc = Math.abs(diff) <= 5 ? 1 : Math.abs(diff) <= 20 ? 3 : 5
      const next = diff > 0 ? Math.min(cur + inc, to) : Math.max(cur - inc, to)
      currentRef.current = next
      setDisplayed(next)
      if (next !== to) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [target])

  const dash = (displayed / 100) * circumference
  return (
    <svg width="56" height="56" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
      {displayed > 0 && (
        <circle cx="30" cy="30" r={r} fill="none" stroke="#4E9B6F" strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 30 30)" />
      )}
      <text x="30" y="34" textAnchor="middle" fontSize="11" fontWeight="600"
        fill={pct != null ? '#0D1F3C' : '#94A3B8'} fontFamily="inherit">
        {pct != null ? `${displayed}%` : '—'}
      </text>
    </svg>
  )
}

// ─── Checkbox visuelle ────────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex w-4 h-4 rounded border items-center justify-center transition-all duration-150 flex-shrink-0"
      style={{ backgroundColor: checked ? '#4E9B6F' : 'white', borderColor: checked ? '#4E9B6F' : '#D0D0CA' }}>
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

// ─── Modal ajout objectif ─────────────────────────────────────────────────────
function AddObjectiveModal({ clientId, token, isClient, onClose, onAdded }: {
  clientId: string; token?: string; isClient?: boolean; onClose: () => void; onAdded: () => void
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(isClient ? '/api/objectives/client-add' : '/api/objectives/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isClient
          ? { token, title: title.trim() }
          : { clientId, title: title.trim() }
        ),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur.'); setLoading(false); return }
      onAdded(); onClose()
    } catch {
      setError('Erreur réseau.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-lg w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#0D1F3C]">Nouvel objectif</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B] text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Méditer 10 min par jour..." autoFocus
            className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">Annuler</button>
            <button type="submit" disabled={loading || !title.trim()}
              className="flex-1 py-2 bg-[#4E9B6F] text-white text-sm font-medium rounded-lg hover:bg-[#5a7a60] transition-colors disabled:opacity-50">
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function WeeklyView({ checkins, objectives, clientId, isClient = false, token }: Props) {
  const router = useRouter()
  const now = new Date()
  const [weekStart, setWeekStart] = useState<Date>(getMonday(now))
  const [completions, setCompletions] = useState<CompletionMap>(new Map())
  const [showAddModal, setShowAddModal] = useState(false)
  const [restDays, setRestDays] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const difficultyDateRef = useRef<string | null>(null)
  const triggerModalRef = useRef(false)

  const isCoach = !isClient
  // Les clients peuvent aussi ajouter/supprimer leurs objectifs
  const canEdit = isCoach || isClient
  const checkinMap = buildCheckinMap(checkins)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
  const isCurrentWeek = toDateKey(weekStart) === toDateKey(getMonday(now))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i)
    const key = toDateKey(d)
    return { date: d, key, label: DAY_LABELS[i], shortLabel: DAY_LABELS[i].slice(0, 2),
      checkin: checkinMap.get(key), isFuture: d > now, isToday: key === toDateKey(now) }
  })

  const pastDays = days.filter(d => !d.isFuture)

  useEffect(() => { setCompletions(loadFromStorage(clientId, weekStart)) }, [clientId, weekStart])
  useEffect(() => { setRestDays(loadRestDays(clientId)) }, [clientId])

  const fetchCompletions = useCallback(async () => {
    const startDate = toDateKey(weekStart)
    const wEnd = new Date(weekStart); wEnd.setDate(wEnd.getDate() + 6)
    const endDate = toDateKey(wEnd)
    const params = new URLSearchParams({ client_id: clientId, start_date: startDate, end_date: endDate })
    if (token) params.set('token', token)
    try {
      const res = await fetch(`/api/daily-completion?${params}`)
      if (!res.ok) return
      const data: Array<{ objective_id: string; completed_date: string }> = await res.json()
      const map = new Map<string, Set<string>>()
      for (const item of data) {
        if (!map.has(item.completed_date)) map.set(item.completed_date, new Set())
        map.get(item.completed_date)!.add(item.objective_id)
      }
      setCompletions(map); saveToStorage(clientId, weekStart, map)
    } catch {}
  }, [weekStart, clientId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCompletions() }, [fetchCompletions])

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  function toggleCompletion(dateKey: string, objectiveId: string) {
    triggerModalRef.current = false

    setCompletions(prev => {
      const next = new Map(prev)
      const daySet = new Set(next.get(dateKey) ?? [])
      const wasChecked = daySet.has(objectiveId)

      if (wasChecked) {
        daySet.delete(objectiveId)
      } else {
        daySet.add(objectiveId)
        if (isClient && isCurrentWeek && dateKey === toDateKey(now)) {
          const validCompleted = Array.from(daySet).filter(id => objectives.some(o => o.id === id)).length
          if (validCompleted === objectives.length && objectives.length > 0) {
            try {
              const flag = `cl_difficulty_rated_${clientId}_${dateKey}`
              if (!localStorage.getItem(flag)) {
                triggerModalRef.current = true
                difficultyDateRef.current = dateKey
              }
            } catch {}
          }
        }
      }

      next.set(dateKey, daySet)
      saveToStorage(clientId, weekStart, next)
      return next
    })

    fetch('/api/daily-completion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, objective_id: objectiveId, completed_date: dateKey, ...(token ? { token } : {}) }),
    }).catch(() => {})

    if (triggerModalRef.current) {
      setTimeout(() => setShowDifficultyModal(true), 300)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      if (isClient) {
        await fetch('/api/objectives/client-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, objectiveId: id }),
        })
      } else {
        await fetch('/api/objectives/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objectiveId: id }),
        })
      }
    } catch {}
    setDeletingId(null)
    router.refresh()
  }

  function handleRestToggle(key: string) {
    const isNowRest = toggleRestDay(clientId, key)
    setRestDays(prev => { const next = new Set(prev); if (isNowRest) next.add(key); else next.delete(key); return next })
  }

  const totalObjectives = objectives.length
  // Filtre les completions pour n'inclure que les objectifs existants (évite les bugs après suppression)
  const validObjIds = new Set(objectives.map(o => o.id))
  function countValid(dayKey: string): number {
    return Array.from(completions.get(dayKey) ?? []).filter(id => validObjIds.has(id)).length
  }
  // Jours actifs = jours passés sans jour de repos
  const activePastDays = pastDays.filter(d => !restDays.has(d.key))
  const totalDoneThisWeek = activePastDays.reduce((sum, d) => sum + countValid(d.key), 0)
  const weekEngagementPct = totalObjectives > 0 && activePastDays.length > 0
    ? Math.round((totalDoneThisWeek / (activePastDays.length * totalObjectives)) * 100) : 0

  return (
    <div className="space-y-5">
      {/* ── Navigation semaine ── */}
      <div className="flex items-center justify-between">
        <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors text-lg">‹</button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#0D1F3C]">
            Semaine du {formatShortDate(weekStart)} au {formatShortDate(weekEnd)}
          </p>
          {isCurrentWeek && <p className="text-xs text-[#4E9B6F] mt-0.5">Semaine en cours</p>}
        </div>
        <button onClick={nextWeek} disabled={isCurrentWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg">›</button>
      </div>

      {/* ── KPI ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[#F0F7F1] border border-[#C8D8CA] rounded-lg px-4 py-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3" stroke="#4E9B6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-[#0D1F3C]">
            Semaine complétée à{' '}
            <span className="font-bold" style={{
              color: weekEngagementPct >= 70 ? '#4E9B6F' : weekEngagementPct >= 40 ? '#BFA76A' : '#94A3B8'
            }}>{weekEngagementPct}%</span>
          </span>
        </div>
      </div>

      {/* ── 7 cartes donuts ── */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 min-w-[420px]">
          {days.map(({ date, key, label, checkin, isFuture, isToday }) => {
            const completedCount = countValid(key)
            const pct = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : null
            const isRest = restDays.has(key)
            const hasActivity = completedCount > 0 || !!checkin || isRest

            return (
              <div key={key} className="flex-1 flex flex-col rounded-xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: isToday ? '#4E9B6F' : '#E2E8F0',
                  minWidth: '58px',
                  boxShadow: isToday ? '0 0 0 2px #4E9B6F, 0 0 18px rgba(107,143,113,0.30)' : 'none',
                  transform: isToday ? 'translateY(-3px)' : 'none',
                }}>
                {/* Header */}
                <div className="px-1 py-2 text-center"
                  style={{ backgroundColor: isRest ? '#F0F0EC' : hasActivity ? '#4E9B6F' : isFuture ? '#F8FAFB' : '#F0F0EC' }}>
                  <p className="text-xs font-semibold" style={{ color: isRest ? '#64748B' : hasActivity ? '#fff' : '#64748B' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: isRest ? '#94A3B8' : hasActivity ? 'rgba(255,255,255,0.75)' : '#94A3B8' }}>
                    {formatShortDate(date)}
                  </p>
                </div>

                {/* Body */}
                <div className="bg-white flex flex-col items-center py-2 gap-1.5 flex-1">
                  {isRest ? (
                    <div className="flex flex-col items-center gap-1 py-2">
                      <span className="text-2xl">💤</span>
                      <span className="text-[10px] text-[#64748B] font-medium">Repos</span>
                    </div>
                  ) : (
                    <DonutChart pct={pct} />
                  )}

                  {checkin?.energy_score != null && (
                    <span className="text-[10px] font-medium bg-[#F0F0EC] text-[#64748B] px-1.5 py-0.5 rounded-full">
                      ⚡ {checkin.energy_score}/10
                    </span>
                  )}

                  {isClient && isToday && !checkin && !isFuture && (
                    <a href="#checkin" className="text-[10px] text-[#4E9B6F] hover:underline font-medium">Check-in →</a>
                  )}

                  {/* Bouton jour de repos — client uniquement */}
                  {!isFuture && isClient && (
                    <button onClick={() => handleRestToggle(key)}
                      title={isRest ? 'Retirer le jour de repos' : 'Marquer comme jour de repos'}
                      className={`mt-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
                        isRest
                          ? 'bg-[#64748B]/10 border-[#64748B]/20 text-[#64748B] hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                          : 'border-dashed border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F0F0EC] hover:text-[#64748B]'
                      }`}>
                      {isRest ? '✕ repos' : '💤 repos'}
                    </button>
                  )}

                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Tableau suivi des objectifs ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
            Suivi des objectifs
            {totalObjectives > 0 && <span className="ml-2 font-normal normal-case text-[#94A3B8]">({totalObjectives})</span>}
          </h4>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-[#4E9B6F] hover:text-[#5a7a60] bg-[#F0F7F1] hover:bg-[#E0EFE3] px-2.5 py-1 rounded-lg transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Ajouter
            </button>
          )}
        </div>

        {objectives.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#94A3B8]">
              {isCoach ? 'Aucun objectif — cliquez sur "+ Objectif" pour en ajouter.' : 'Aucun objectif défini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B] w-[38%]">Objectif</th>
                  {days.map(({ key, shortLabel, date, isToday }) => (
                    <th key={key} className="px-2 py-2.5 text-center text-xs font-medium"
                      style={{ color: isToday ? '#4E9B6F' : '#64748B', minWidth: '44px' }}>
                      <div>{shortLabel}</div>
                      <div className="text-[9px] font-normal text-[#94A3B8]">{String(date.getDate()).padStart(2, '0')}</div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-[#64748B]">%</th>
                  {canEdit && <th className="w-8" />}
                </tr>
              </thead>
              <tbody>
                {objectives.map(obj => {
                  // Dénominateur = jours actifs (ni futur, ni repos)
                  const activeDays = days.filter(d => !d.isFuture && !restDays.has(d.key)).length
                  const rowDone = days.filter(d => !d.isFuture && !restDays.has(d.key) && completions.get(d.key)?.has(obj.id)).length
                  const rowPct = activeDays > 0 ? Math.round((rowDone / activeDays) * 100) : 0
                  return (
                    <tr key={obj.id} className="group border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFB] transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-[#0D1F3C] leading-tight">
                          {obj.title.length > 32 ? obj.title.slice(0, 32) + '…' : obj.title}
                        </span>
                      </td>
                      {days.map(({ key, isFuture }) => {
                        const isChecked = completions.get(key)?.has(obj.id) ?? false
                        const isRestDay = restDays.has(key)
                        return (
                          <td key={key} className="px-2 py-2.5 text-center">
                            {isRestDay && !isFuture ? (
                              <span className="text-[10px] text-[#94A3B8]">💤</span>
                            ) : (
                              <button
                                onClick={() => isClient && !isFuture && toggleCompletion(key, obj.id)}
                                disabled={isFuture || isCoach}
                                className={`mx-auto flex items-center justify-center w-5 h-5 rounded transition-all ${
                                  isFuture || isCoach ? 'cursor-default opacity-60' : 'cursor-pointer hover:scale-110'
                                }`}
                                title={isCoach ? 'Seul le client peut cocher' : isFuture ? 'Jour à venir' : isChecked ? 'Décocher' : 'Cocher'}>
                                <Checkbox checked={isChecked} />
                              </button>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs font-semibold" style={{
                          color: rowPct >= 70 ? '#4E9B6F' : rowPct >= 40 ? '#BFA76A' : '#94A3B8',
                        }}>
                          {`${rowPct}%`}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="pr-2 py-2.5 text-center">
                          <button
                            onClick={() => handleDelete(obj.id)}
                            disabled={deletingId === obj.id}
                            title="Supprimer cet objectif"
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-all disabled:opacity-30 text-sm"
                          >
                            {deletingId === obj.id ? '…' : '✕'}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFB] border-t border-[#E2E8F0]">
                  <td className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Total</td>
                  {days.map(({ key, isFuture }) => {
                    const isRestDay = restDays.has(key)
                    const count = countValid(key)
                    const pct = totalObjectives > 0 && !isFuture && !isRestDay
                      ? Math.round((count / totalObjectives) * 100) : null
                    return (
                      <td key={key} className="px-2 py-2.5 text-center">
                        {isRestDay && !isFuture ? (
                          <span className="text-[10px] text-[#94A3B8]">💤</span>
                        ) : (
                          <span className="text-[11px] font-semibold" style={{
                            color: pct == null ? '#E2E8F0' : pct >= 70 ? '#4E9B6F' : pct >= 40 ? '#BFA76A' : '#94A3B8',
                          }}>
                            {pct != null ? `${pct}%` : '—'}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-[11px] font-bold text-[#4E9B6F]">{weekEngagementPct}%</span>
                  </td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddObjectiveModal
          clientId={clientId}
          token={token}
          isClient={isClient}
          onClose={() => setShowAddModal(false)}
          onAdded={() => router.refresh()}
        />
      )}

      {showDifficultyModal && difficultyDateRef.current && (
        <DifficultyRatingModal
          clientId={clientId}
          date={difficultyDateRef.current}
          token={token}
          onClose={() => setShowDifficultyModal(false)}
        />
      )}
    </div>
  )
}
