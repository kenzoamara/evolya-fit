'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { Client, Session, localDateStr, formatDate } from './_shared'

export function SessionsTab({ client, sessions, isCoach }: { client: Client; sessions: Session[]; isCoach: boolean }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [date, setDate] = useState(localDateStr(new Date()))
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [recurring, setRecurring] = useState(false)
  const [recurringDow, setRecurringDow] = useState(1)
  const [recurringInterval, setRecurringInterval] = useState<1 | 2>(1)
  const [recurringEndMode, setRecurringEndMode] = useState<'count' | 'date'>('count')
  const [recurringCount, setRecurringCount] = useState(8)
  const [recurringEndDate, setRecurringEndDate] = useState('')

  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineNotes, setInlineNotes] = useState('')
  const [inlinePrivateNotes, setInlinePrivateNotes] = useState('')
  const [inlineSaving, setInlineSaving] = useState(false)
  const [notesOverride, setNotesOverride] = useState<Record<string, { notes: string; private_notes: string }>>({})

  function openInlineEdit(session: Session) {
    setInlineEditId(session.id)
    setInlineNotes(notesOverride[session.id]?.notes ?? session.notes ?? '')
    setInlinePrivateNotes(notesOverride[session.id]?.private_notes ?? session.private_notes ?? '')
  }

  async function saveInlineNotes(sessionId: string) {
    setInlineSaving(true)
    const res = await fetch('/api/sessions/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, notes: inlineNotes, private_notes: inlinePrivateNotes }),
    })
    setInlineSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Notes enregistrées.')
    setNotesOverride(prev => ({ ...prev, [sessionId]: { notes: inlineNotes, private_notes: inlinePrivateNotes } }))
    setInlineEditId(null)
    router.refresh()
  }

  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'attended' | 'missed' | null>>(() =>
    Object.fromEntries(sessions.map(s => [s.id, s.attendance ?? null]))
  )

  async function handleAttendance(sessionId: string, value: 'attended' | 'missed' | null) {
    setAttendanceMap(prev => ({ ...prev, [sessionId]: value }))
    await fetch('/api/sessions/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, attendance: value }),
    })
  }

  async function handleDelete(sessionId: string) {
    const res = await fetch('/api/sessions/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    if (!res.ok) { toast.error('Erreur lors de la suppression.'); return }
    toast.success('Séance supprimée.')
    setDeleteConfirmId(null)
    router.refresh()
  }

  const now = new Date()
  const todayStr = localDateStr(now)
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())

  function openNew(prefillDate?: string) {
    const d = prefillDate ?? localDateStr(new Date())
    setEditId(null); setDate(d); setTime(''); setNotes(''); setPrivateNotes('')
    setRecurring(false); setRecurringDow(new Date(d + 'T12:00:00').getDay())
    setRecurringInterval(1); setRecurringEndMode('count'); setRecurringCount(8); setRecurringEndDate('')
    setShowModal(true)
  }

  function openEdit(session: Session) {
    setEditId(session.id); setDate(session.session_date); setTime(session.session_time ?? '')
    setNotes(session.notes ?? ''); setPrivateNotes(session.private_notes ?? '')
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    if (editId) {
      const res = await fetch('/api/sessions/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: editId, session_date: date, session_time: time || null, notes, private_notes: privateNotes }),
      })
      if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); setLoading(false); return }
      toast.success('Séance modifiée avec succès.')
    } else {
      const existingDates = new Set(sessions.map(s => s.session_date))
      const inserts: { client_id: string; coach_id: string; session_date: string; session_time: string | null; notes: string; private_notes: string }[] = [
        { client_id: client.id, coach_id: '', session_date: date, session_time: time || null, notes, private_notes: privateNotes }
      ]
      if (recurring) {
        const startD = new Date(date + 'T12:00:00')
        let daysToFirst = (recurringDow - startD.getDay() + 7) % 7
        if (daysToFirst === 0) daysToFirst = recurringInterval * 7
        const endDateLimit = recurringEndMode === 'date' && recurringEndDate ? new Date(recurringEndDate + 'T23:59:59') : null
        const maxCount = recurringEndMode === 'count' ? recurringCount : 500
        const cursor = new Date(startD)
        cursor.setDate(cursor.getDate() + daysToFirst)
        let added = 0
        while (added < maxCount) {
          if (endDateLimit && cursor > endDateLimit) break
          const ds = localDateStr(cursor)
          if (!existingDates.has(ds)) inserts.push({ client_id: client.id, coach_id: '', session_date: ds, session_time: time || null, notes, private_notes: privateNotes })
          cursor.setDate(cursor.getDate() + recurringInterval * 7)
          added++
        }
      }
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: inserts }),
      })
      if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); setLoading(false); return }
      toast.success(inserts.length > 1 ? `${inserts.length} séances planifiées.` : 'Séance ajoutée avec succès.')
    }
    setLoading(false); setShowModal(false); router.refresh()
  }

  // Calendar helpers
  function buildCalendarGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }
  const calCells = buildCalendarGrid(calYear, calMonth)
  const sessionByDate = new Map<string, Session>()
  for (const s of sessions) sessionByDate.set(s.session_date, s)
  const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  function calPrevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
  function calNextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }
  function handleCalDayClick(d: Date) { const ds = localDateStr(d); const s = sessionByDate.get(ds); if (s) openEdit(s); else openNew(ds) }

  return (
    <div>
      {isCoach && (
        <div className="flex justify-end mb-4">
          <button onClick={() => openNew()} className="flex items-center gap-2 px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-colors">
            + Nouvelle séance
          </button>
        </div>
      )}

      {/* Calendar */}
      {isCoach && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={calPrevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors text-base">‹</button>
            <p className="text-sm font-semibold text-[#0D1F3C]">{MONTH_NAMES_FR[calMonth]} {calYear}</p>
            <button onClick={calNextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors text-base">›</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((h, i) => <div key={i} className="text-center text-[10px] font-medium text-[#94A3B8] py-1">{h}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calCells.map((d, i) => {
              if (!d) return <div key={i} />
              const dateStr = localDateStr(d)
              const isPast = d < now
              const isToday = dateStr === todayStr
              const session = sessionByDate.get(dateStr)
              const att = session ? (attendanceMap[session.id] ?? null) : null
              const bgClass = !session ? '' : isPast && att === 'attended' ? 'bg-brand text-white' : isPast && att === 'missed' ? 'bg-red-400 text-white' : isPast ? 'bg-[#E2E8F0] text-[#64748B]' : ''
              const borderClass = (!!session && !isPast) ? 'border-2 border-brand text-brand' : ''
              const hoverClass = !session ? 'hover:bg-[#F1F5F9]' : ''
              return (
                <button key={i} onClick={() => handleCalDayClick(d)} className="relative flex items-center justify-center h-8 w-full transition-all">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all ${bgClass} ${borderClass} ${hoverClass}`}>{d.getDate()}</span>
                  {isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F1F5F9] flex-wrap">
            {[['bg-brand', 'Présent'], ['bg-red-400', 'Absent'], ['bg-[#E2E8F0]', 'Non marquée'], ['border-2 border-brand', 'Planifiée']].map(([cls, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                <span className={`w-4 h-4 rounded-full inline-block ${cls}`} />{label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg">
          <EmptyState icon="sessions" title="Aucune séance enregistrée"
            description={isCoach ? 'Ajoutez votre première note de séance pour ce client.' : 'Votre coach n\'a pas encore enregistré de séance.'}
            action={isCoach ? <button onClick={() => openNew()} className="px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-colors">+ Nouvelle séance</button> : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isPast = session.session_date <= todayStr
            const att = attendanceMap[session.id] ?? null
            const isInlineEditing = inlineEditId === session.id
            const displayNotes = notesOverride[session.id]?.notes ?? session.notes
            const displayPrivateNotes = notesOverride[session.id]?.private_notes ?? session.private_notes
            return (
              <div key={session.id} className={`bg-white rounded-xl border transition-colors ${isPast && att === 'attended' ? 'border-brand/30' : isPast && att === 'missed' ? 'border-red-200' : 'border-[#E2E8F0]'}`}>
                <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#0D1F3C]">
                      {formatDate(session.session_date)}
                      {session.session_time && <span className="ml-2 text-xs font-medium text-brand bg-brand-bg px-2 py-0.5 rounded-full">{session.session_time.replace(':', 'h')}</span>}
                    </span>
                    {isPast && att === 'attended' && <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full">✓ Présent</span>}
                    {isPast && att === 'missed' && <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">✗ Absent</span>}
                    {!isPast && <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Planifiée</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCoach && isPast && (
                      <div className="flex gap-1">
                        <button onClick={() => handleAttendance(session.id, att === 'attended' ? null : 'attended')}
                          className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${att === 'attended' ? 'bg-brand text-white border-brand' : 'text-[#64748B] border-[#E2E8F0] hover:border-brand hover:text-brand'}`} title="Présent">✓</button>
                        <button onClick={() => handleAttendance(session.id, att === 'missed' ? null : 'missed')}
                          className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${att === 'missed' ? 'bg-red-400 text-white border-red-400' : 'text-[#64748B] border-[#E2E8F0] hover:border-red-300 hover:text-red-400'}`} title="Absent">✗</button>
                      </div>
                    )}
                    {isCoach && (
                      deleteConfirmId === session.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(session.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors">Confirmer</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-[#64748B] border border-[#E2E8F0] px-2.5 py-1 rounded-md hover:bg-[#F1F5F9] transition-colors">Annuler</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(session.id)} className="text-xs text-[#64748B] hover:text-red-500 border border-[#E2E8F0] hover:border-red-200 px-2.5 py-1 rounded-md transition-colors">Supprimer</button>
                      )
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-4 space-y-3">
                  {isCoach && isInlineEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Note de séance <span className="normal-case font-normal text-[#94A3B8]">— visible par le client</span></label>
                        <textarea value={inlineNotes} onChange={e => setInlineNotes(e.target.value)} rows={4} autoFocus
                          placeholder="Ce qui a été abordé, les avancées, les points clés de la séance..."
                          className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] focus:outline-none focus:border-brand transition-colors resize-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Note privée <span className="normal-case font-normal text-[#94A3B8]">— invisible pour le client</span></label>
                        <textarea value={inlinePrivateNotes} onChange={e => setInlinePrivateNotes(e.target.value)} rows={3}
                          placeholder="Observations personnelles, hypothèses, plan pour la prochaine séance..."
                          className="w-full px-3 py-2.5 bg-[#FFFBF2] border border-[#D4A853]/30 rounded-lg text-sm text-[#0D1F3C] focus:outline-none focus:border-[#D4A853] transition-colors resize-none leading-relaxed"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => saveInlineNotes(session.id)} disabled={inlineSaving} className="px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                          {inlineSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button onClick={() => setInlineEditId(null)} className="px-4 py-2 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {displayNotes ? <p className="text-sm text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{displayNotes}</p>
                        : <p className="text-sm text-[#94A3B8] italic">{isCoach ? 'Aucune note — cliquez sur "Écrire" pour ajouter.' : 'Aucune note pour cette séance.'}</p>}
                      {isCoach && displayPrivateNotes && (
                        <div className="mt-3 bg-[#FFFBF2] border border-[#D4A853]/30 rounded-lg px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-[#D4A853] uppercase tracking-wide mb-1">Note privée</p>
                          <p className="text-xs text-[#64748B] leading-relaxed whitespace-pre-wrap">{displayPrivateNotes}</p>
                        </div>
                      )}
                      {isCoach && (
                        <button onClick={() => openInlineEdit(session)} className="mt-3 text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1 transition-colors">
                          <span className="text-base leading-none">✎</span>
                          {displayNotes ? 'Modifier les notes' : 'Écrire une note'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl border border-[#E2E8F0] w-full sm:max-w-lg shadow-md overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-semibold text-[#0D1F3C]">{editId ? 'Modifier la séance' : 'Nouvelle séance'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#94A3B8] hover:text-[#64748B] text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Heure <span className="text-xs font-normal text-[#9B9B93]">(optionnel)</span></label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Notes de séance</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Notes visibles par le client..."
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0D1F3C] mb-1">Notes privées <span className="text-xs font-normal text-[#64748B] ml-1">— invisibles du client</span></label>
                <textarea value={privateNotes} onChange={e => setPrivateNotes(e.target.value)} rows={3} placeholder="Notes uniquement visibles par vous..."
                  className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-colors resize-none" />
              </div>
              {!editId && (() => {
                const DOW_SHORT = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']
                const DOW_FULL  = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
                const previewDates: string[] = []
                if (recurring && date) {
                  const startD = new Date(date + 'T12:00:00')
                  let daysToFirst = (recurringDow - startD.getDay() + 7) % 7
                  if (daysToFirst === 0) daysToFirst = recurringInterval * 7
                  const endLimit = recurringEndMode === 'date' && recurringEndDate ? new Date(recurringEndDate + 'T23:59:59') : null
                  const max = recurringEndMode === 'count' ? recurringCount : 500
                  const cur = new Date(startD); cur.setDate(cur.getDate() + daysToFirst)
                  let n = 0
                  while (n < max && previewDates.length < 60) {
                    if (endLimit && cur > endLimit) break
                    previewDates.push(localDateStr(cur))
                    cur.setDate(cur.getDate() + recurringInterval * 7); n++
                  }
                }
                const totalCount = recurring ? 1 + previewDates.length : 1
                const lastDate = previewDates[previewDates.length - 1]
                return (
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <button type="button" onClick={() => setRecurring(r => !r)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFB] hover:bg-[#F1F5F9] transition-colors">
                      <span className="text-sm font-medium text-[#0D1F3C]">Répétition</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${recurring ? 'bg-brand text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                        {recurring ? 'Activée' : 'Désactivée'}
                      </span>
                    </button>
                    {recurring && (
                      <div className="px-4 py-4 space-y-4 border-t border-[#E2E8F0] bg-white">
                        <div>
                          <p className="text-xs text-[#64748B] mb-2">Répéter chaque</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 0].map(dow => (
                              <button key={dow} type="button" onClick={() => setRecurringDow(dow)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${recurringDow === dow ? 'bg-brand text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}>
                                {DOW_SHORT[dow]}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-brand mt-1.5 font-medium">Tous les {DOW_FULL[recurringDow]}s</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1.5">Fréquence</p>
                          <div className="flex gap-2">
                            {([1, 2] as const).map(v => (
                              <button key={v} type="button" onClick={() => setRecurringInterval(v)}
                                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${recurringInterval === v ? 'border-brand bg-brand-bg text-brand' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}>
                                {v === 1 ? 'Toutes les semaines' : 'Toutes les 2 semaines'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-1 mb-2">
                            {(['count', 'date'] as const).map(mode => (
                              <button key={mode} type="button" onClick={() => setRecurringEndMode(mode)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${recurringEndMode === mode ? 'bg-[#0D1F3C] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}>
                                {mode === 'count' ? 'Nombre de séances' : 'Date de fin'}
                              </button>
                            ))}
                          </div>
                          {recurringEndMode === 'count' ? (
                            <select value={recurringCount} onChange={e => setRecurringCount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand">
                              {[4, 6, 8, 10, 12, 16, 20, 26, 52].map(n => <option key={n} value={n}>{n} répétitions supplémentaires</option>)}
                            </select>
                          ) : (
                            <input type="date" value={recurringEndDate} min={date} onChange={e => setRecurringEndDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand" />
                          )}
                        </div>
                        {totalCount > 1 && (
                          <div className="bg-brand-bg rounded-lg px-3 py-2.5">
                            <p className="text-xs font-medium text-brand">
                              {totalCount} séances planifiées
                              {lastDate && <span className="font-normal"> · jusqu&apos;au {new Date(lastDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
              <div className="flex gap-3 pb-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
