'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Client, Session, Checkin, BilanSnapshot,
  localDateStr, formatDate, getWeekNumber,
  GOAL_LABELS, ACTIVITY_LABELS, calcBmiCoach, calcAgeCoach,
  StatChip, InfoRow, ProfileChip,
} from './_shared'

// ─── Aperçu Tab ────────────────────────────────────────────────────────────────

export function ApercuTab({
  client, sessions, checkins, isCoach, onNewSession,
}: {
  client: Client; sessions: Session[]; checkins: Checkin[]
  isCoach: boolean; onNewSession: () => void
}) {
  const router = useRouter()
  const [showBilan, setShowBilan] = useState(false)

  // Inline note editing for last session
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineNotes, setInlineNotes] = useState('')
  const [inlineSaving, setInlineSaving] = useState(false)
  const [notesOverride, setNotesOverride] = useState<Record<string, string>>({})

  async function saveInlineNote(sessionId: string) {
    setInlineSaving(true)
    const res = await fetch('/api/sessions/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, notes: inlineNotes }),
    })
    setInlineSaving(false)
    if (!res.ok) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Note enregistrée.')
    setNotesOverride(prev => ({ ...prev, [sessionId]: inlineNotes }))
    setInlineEditId(null)
    router.refresh()
  }

  const now = new Date()
  const todayStr = localDateStr(now)
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()

  const pastSessions = sessions.filter(s => s.session_date <= todayStr)
  const attended = pastSessions.filter(s => s.attendance === 'attended').length
  const missed = pastSessions.filter(s => s.attendance === 'missed').length
  const attendanceRate = pastSessions.length > 0
    ? Math.round((attended / pastSessions.filter(s => s.attendance !== null).length || 0) * 100) || null
    : null

  const lastSession = sessions
    .filter(s => s.session_date <= todayStr)
    .sort((a, b) => b.session_date.localeCompare(a.session_date))[0] ?? null

  const nextSession = sessions
    .filter(s => s.session_date > todayStr)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))[0] ?? null

  const checkinThisWeek = checkins.find(c => c.week_number === currentWeek && c.year === currentYear) ?? null
  const lastCheckin = checkins.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] ?? null

  const memberSince = new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip label="Séances" value={String(sessions.length)} sub={sessions.length > 0 ? `${pastSessions.length} passées` : 'Aucune planifiée'} />
        <StatChip
          label="Présence"
          value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
          sub={pastSessions.filter(s => s.attendance !== null).length > 0
            ? `${attended} présent${attended > 1 ? 's' : ''}, ${missed} absent${missed > 1 ? 's' : ''}`
            : 'Non marquée'}
        />
        <StatChip label="Check-ins" value={String(checkins.length)} sub={checkinThisWeek ? 'Semaine en cours ✓' : 'En attente cette sem.'} highlight={!!checkinThisWeek} />
      </div>

      {/* Prochaine séance */}
      {nextSession && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-brand uppercase tracking-wide">Prochaine séance</span>
          </div>
          <p className="text-sm font-semibold text-[#0D1F3C]">
            {formatDate(nextSession.session_date)}
            {nextSession.session_time && (
              <span className="ml-2 text-xs font-medium text-[#4E9B6F]">{nextSession.session_time.replace(':', 'h')}</span>
            )}
          </p>
          {nextSession.notes && <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{nextSession.notes}</p>}
        </div>
      )}

      {/* Dernière séance + note rapide (Task 7) */}
      {lastSession ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Dernière séance</span>
            <div className="flex items-center gap-1.5">
              {lastSession.attendance === 'attended' && (
                <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full">✓ Présent</span>
              )}
              {lastSession.attendance === 'missed' && (
                <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">✗ Absent</span>
              )}
              <span className="text-xs text-[#64748B]">{formatDate(lastSession.session_date)}</span>
            </div>
          </div>

          {/* Inline note editing */}
          {isCoach && inlineEditId === lastSession.id ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={inlineNotes}
                onChange={e => setInlineNotes(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Note visible par le client..."
                className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] focus:outline-none focus:border-brand transition-colors resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => saveInlineNote(lastSession.id)} disabled={inlineSaving}
                  className="px-3 py-1.5 btn-brand text-xs font-medium rounded-lg disabled:opacity-60">
                  {inlineSaving ? '...' : 'Enregistrer'}
                </button>
                <button onClick={() => setInlineEditId(null)}
                  className="px-3 py-1.5 border border-[#E2E8F0] text-xs text-[#64748B] rounded-lg hover:bg-[#F1F5F9]">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              {(notesOverride[lastSession.id] ?? lastSession.notes) ? (
                <p className="text-sm text-[#0D1F3C] leading-relaxed line-clamp-3">{notesOverride[lastSession.id] ?? lastSession.notes}</p>
              ) : (
                <p className="text-sm text-[#94A3B8] italic">Aucune note pour cette séance.</p>
              )}
              {isCoach && (
                <button
                  onClick={() => { setInlineEditId(lastSession.id); setInlineNotes(notesOverride[lastSession.id] ?? lastSession.notes ?? '') }}
                  className="mt-2 text-xs text-brand font-medium hover:underline flex items-center gap-1"
                >
                  <span className="text-sm leading-none">✎</span>
                  {(notesOverride[lastSession.id] ?? lastSession.notes) ? 'Modifier la note' : 'Ajouter une note'}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-4 text-center">
          <p className="text-sm text-[#94A3B8]">Aucune séance passée.</p>
        </div>
      )}

      {/* Check-in semaine courante */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Check-in — Semaine {currentWeek}</span>
          {checkinThisWeek ? (
            <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full">Reçu</span>
          ) : (
            <span className="text-[10px] font-semibold bg-[#F1F5F9] text-[#94A3B8] px-2 py-0.5 rounded-full">En attente</span>
          )}
        </div>
        {checkinThisWeek ? (
          <div className="space-y-1.5">
            {checkinThisWeek.q1_answer && <p className="text-sm text-[#0D1F3C] line-clamp-2">{checkinThisWeek.q1_answer}</p>}
            {!checkinThisWeek.q1_answer && !checkinThisWeek.q2_answer && !checkinThisWeek.q3_answer && (
              <p className="text-sm text-[#94A3B8] italic">Check-in envoyé sans réponses.</p>
            )}
          </div>
        ) : lastCheckin ? (
          <p className="text-xs text-[#94A3B8]">
            Dernier check-in reçu le {new Date(lastCheckin.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} (S{lastCheckin.week_number})
          </p>
        ) : (
          <p className="text-xs text-[#94A3B8]">{client.full_name} n&apos;a pas encore envoyé de check-in.</p>
        )}
      </div>

      {/* Infos client + actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Informations</p>
          <InfoRow label="Email" value={client.email.includes('@evolya.internal') ? '—' : client.email} />
          <InfoRow label="Statut" value={client.status === 'active' ? 'Actif' : 'Inactif'} />
          <InfoRow label="Client depuis" value={memberSince} />
        </div>

        {isCoach && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Actions rapides</p>
            <button onClick={onNewSession}
              className="w-full flex items-center gap-2 px-3 py-2.5 btn-brand rounded-lg text-sm font-medium transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Nouvelle séance
            </button>
            <button onClick={() => setShowBilan(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg text-sm font-medium transition-colors">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L8 4.5H12L9 7l1 3.5L6.5 8.5 3.5 10.5l1-3.5L1.5 4.5H5L6.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Préparer le bilan
            </button>
            {client.magic_token && (
              <a href={`/c/${client.magic_token}/dashboard?coach=1`} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] rounded-lg text-sm font-medium transition-colors">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M7.5 2.5h3v3M10.5 2.5L6 7M3 3.5H2A1 1 0 001 4.5v6a1 1 0 001 1h6a1 1 0 001-1V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Voir l&apos;espace client
              </a>
            )}
          </div>
        )}
      </div>

      <ClientProfilCard client={client} />

      {showBilan && (
        <BilanModal clientId={client.id} clientName={client.full_name} onClose={() => setShowBilan(false)} />
      )}
    </div>
  )
}

// ─── Client Profil Card ───────────────────────────────────────────────────────

function ClientProfilCard({ client }: { client: Client }) {
  const hasPhysical = client.height_cm || client.weight_kg || client.gender || client.birth_date
  const hasCoaching = client.main_goal || client.activity_level
  const hasHabits   = client.injuries || client.dietary_habits || client.avg_sleep_hours
  const hasPerf     = client.sport_performances || client.daily_calories_estimated
  const hasAny      = hasPhysical || hasCoaching || hasHabits || hasPerf

  if (!hasAny) return (
    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-4 text-center">
      <p className="text-[12px] text-[#94A3B8]">Onboarding non complété — aucune donnée de profil.</p>
    </div>
  )

  const age = calcAgeCoach(client.birth_date)
  const bmi = calcBmiCoach(client.height_cm, client.weight_kg)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-3">Profil client</p>
      {hasPhysical && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#F1F5F9] border-y border-[#F1F5F9]">
          {age !== null && <div className="bg-white px-4 py-3"><ProfileChip label="Âge" value={`${age} ans`} /></div>}
          {client.gender && <div className="bg-white px-4 py-3"><ProfileChip label="Genre" value={client.gender === 'homme' ? 'Homme' : 'Femme'} /></div>}
          {client.height_cm && <div className="bg-white px-4 py-3"><ProfileChip label="Taille" value={`${client.height_cm} cm`} /></div>}
          {client.weight_kg && <div className="bg-white px-4 py-3"><ProfileChip label="Poids" value={`${client.weight_kg} kg`} /></div>}
          {bmi && <div className="bg-white px-4 py-3"><ProfileChip label="IMC" value={String(bmi.value)} color={bmi.color} /></div>}
        </div>
      )}
      <div className="px-4 py-1">
        {client.main_goal && <InfoRow label="Objectif" value={GOAL_LABELS[client.main_goal] ?? client.main_goal} />}
        {client.activity_level && <InfoRow label="Activité" value={ACTIVITY_LABELS[client.activity_level] ?? client.activity_level} />}
        {client.injuries && <InfoRow label="Blessures" value={client.injuries} />}
        {client.dietary_habits && <InfoRow label="Alimentation" value={client.dietary_habits} />}
        {client.avg_sleep_hours && <InfoRow label="Sommeil" value={`${client.avg_sleep_hours}h / nuit`} />}
        {client.sport_performances && <InfoRow label="Performances" value={client.sport_performances} />}
        {client.daily_calories_estimated && <InfoRow label="Calories / jour" value={`${client.daily_calories_estimated} kcal`} />}
      </div>
    </div>
  )
}

// ─── Bilan Modal ──────────────────────────────────────────────────────────────

const MEAS_LABELS: Record<string, string> = {
  waist_cm: 'Tour de taille', hips_cm: 'Tour de hanches', chest_cm: 'Tour de poitrine',
  l_bicep_cm: 'Bicep G', r_bicep_cm: 'Bicep D', l_thigh_cm: 'Cuisse G', r_thigh_cm: 'Cuisse D',
}

function BilanModal({ clientId, clientName, onClose }: { clientId: string; clientName: string; onClose: () => void }) {
  const [snapshot, setSnapshot] = useState<BilanSnapshot | null>(null)
  const [loading, setLoading]   = useState(true)
  const [coachNote, setCoachNote] = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    fetch(`/api/bilan/preview?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => { setSnapshot(d.snapshot); setLoading(false) })
      .catch(() => setLoading(false))
  })

  useEffect(() => {
    fetch(`/api/bilan/preview?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => { setSnapshot(d.snapshot); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  async function handleSend() {
    setSending(true)
    const res = await fetch('/api/bilan/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, coach_note: coachNote || null }),
    })
    setSending(false)
    if (res.ok) { setSent(true); toast.success('Bilan envoyé !') }
    else { const d = await res.json(); toast.error(d.error ?? 'Erreur') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-[14px] font-semibold text-[#0D1F3C]">Bilan — {clientName}</p>
            {snapshot && <p className="text-[11px] text-[#94A3B8]">{snapshot.period_label}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-[13px] text-[#94A3B8]">Chargement…</div>
          ) : !snapshot ? (
            <div className="py-12 text-center text-[13px] text-[#94A3B8]">Impossible de charger les données.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8FAFB] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] mb-1">Check-ins (8 sem.)</p>
                  <p className="text-[22px] font-bold text-[#0D1F3C] leading-none">{snapshot.checkin_count}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Taux : {snapshot.checkin_rate_pct ?? 0}%</p>
                </div>
                <div className="bg-[#F8FAFB] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] mb-1">Objectifs atteints</p>
                  <p className="text-[22px] font-bold text-[#0D1F3C] leading-none">{snapshot.objectives_done}<span className="text-[14px] font-normal text-[#94A3B8]">/{snapshot.objectives_total}</span></p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{snapshot.objectives_total > 0 ? Math.round((snapshot.objectives_done / snapshot.objectives_total) * 100) : 0}% complétés</p>
                </div>
                {snapshot.weight_delta_kg !== null && (
                  <div className="bg-[#F8FAFB] rounded-xl p-3">
                    <p className="text-[10px] text-[#94A3B8] mb-1">Évolution du poids</p>
                    <p className={`text-[22px] font-bold leading-none ${snapshot.weight_delta_kg < 0 ? 'text-[#16A34A]' : snapshot.weight_delta_kg > 0 ? 'text-[#DC2626]' : 'text-[#0D1F3C]'}`}>
                      {snapshot.weight_delta_kg > 0 ? '+' : ''}{snapshot.weight_delta_kg} kg
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{snapshot.weight_start_kg}→{snapshot.weight_end_kg} kg</p>
                  </div>
                )}
                {snapshot.roi_weeks !== null && snapshot.roi_weeks > 0 && (
                  <div className="bg-[#FFF9F0] border border-[#FDE68A] rounded-xl p-3">
                    <p className="text-[10px] text-[#B45309] mb-1">Accompagnement</p>
                    <p className="text-[22px] font-bold text-[#92400E] leading-none">{snapshot.roi_weeks}</p>
                    <p className="text-[11px] text-[#B45309] mt-0.5">semaines ensemble</p>
                  </div>
                )}
              </div>

              {snapshot.measurements_delta && Object.entries(snapshot.measurements_delta).filter(([, v]) => v !== null).length > 0 && (
                <div className="bg-[#F8FAFB] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Mensurations (delta)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(snapshot.measurements_delta).filter(([, v]) => v !== null).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[11px] text-[#64748B]">{MEAS_LABELS[key] ?? key}</span>
                        <span className={`text-[11px] font-bold ${val! < 0 ? 'text-[#16A34A]' : val! > 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                          {val! > 0 ? '+' : ''}{val} cm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {snapshot.main_goal && (
                <div className="bg-[#FFF9F0] border border-[#FDE68A] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-[#B45309] uppercase mb-1">Objectif principal</p>
                  <p className="text-[13px] text-[#92400E]">{snapshot.main_goal}</p>
                </div>
              )}

              {!sent && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1.5">Message personnalisé (optionnel)</label>
                  <textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} rows={3}
                    placeholder="Ex : Excellent mois, tu as bien progressé sur la régularité…"
                    className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-xl resize-none focus:outline-none focus:border-[#4E9B6F] bg-white"
                  />
                </div>
              )}
              {sent && (
                <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">
                  <span className="text-[#16A34A]">✓</span>
                  <p className="text-[13px] text-[#166534] font-medium">Bilan envoyé avec succès</p>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && snapshot && (
          <div className="px-5 py-4 border-t border-[#E2E8F0] flex gap-3">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] rounded-lg text-[13px] font-medium transition-colors">
              PDF
            </button>
            {!sent && (
              <button onClick={handleSend} disabled={sending}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 btn-brand rounded-lg text-[13px] font-semibold disabled:opacity-60 transition-colors">
                {sending ? 'Envoi…' : 'Envoyer au client'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
