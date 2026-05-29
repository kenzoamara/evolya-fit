'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PlanGate } from '@/components/ui/plan-gate'
import {
  Client, Session, Checkin, WeightEntry, BodyMeasurement, SleepEntry, PerformanceEntry,
  formatDate, getWeekNumber, GOAL_LABELS, ACTIVITY_LABELS, calcBmiCoach,
  StatChip, InfoRow,
} from './_shared'

type ProfilSection = 'sport' | 'nutrition' | 'habitudes'

export function ProfilTab({
  client, sessions, checkins, weightEntries, bodyMeasurements, sleepEntries, performanceEntries, isCoach, userPlan,
}: {
  client: Client; sessions: Session[]; checkins: Checkin[]
  weightEntries: WeightEntry[]; bodyMeasurements: BodyMeasurement[]
  sleepEntries: SleepEntry[]; performanceEntries: PerformanceEntry[]
  isCoach: boolean; userPlan: string
}) {
  const [section, setSection] = useState<ProfilSection>('sport')
  const TABS: { key: ProfilSection; label: string }[] = [
    { key: 'sport',     label: '⚡ Sport' },
    { key: 'nutrition', label: '🥗 Nutrition' },
    { key: 'habitudes', label: '🌙 Habitudes' },
  ]
  return (
    <div>
      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-5 w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${section === key ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
            {label}
          </button>
        ))}
      </div>
      {section === 'sport' && <SportSection client={client} sessions={sessions} performanceEntries={performanceEntries} isCoach={isCoach} />}
      {section === 'nutrition' && <NutritionSection client={client} weightEntries={weightEntries} bodyMeasurements={bodyMeasurements} userPlan={userPlan} />}
      {section === 'habitudes' && (
        <PlanGate featureKey="habitudes" userPlan={userPlan}>
          <HabitesSection client={client} checkins={checkins} sleepEntries={sleepEntries} />
        </PlanGate>
      )}
    </div>
  )
}

// ─── Sport Section ────────────────────────────────────────────────────────────

function SportSection({ client, sessions, performanceEntries, isCoach }: { client: Client; sessions: Session[]; performanceEntries: PerformanceEntry[]; isCoach: boolean }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const pastSessions = sessions.filter(s => s.session_date <= todayStr)
  const nextSession = sessions.filter(s => s.session_date > todayStr).sort((a, b) => a.session_date.localeCompare(b.session_date))[0]
  const attended = pastSessions.filter(s => s.attendance === 'attended').length
  const missed = pastSessions.filter(s => s.attendance === 'missed').length
  const markedSessions = pastSessions.filter(s => s.attendance !== null)
  const attendanceRate = markedSessions.length > 0 ? Math.round((attended / markedSessions.length) * 100) : null
  const recentSessions = [...pastSessions].sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip label="⚡ Séances" value={String(sessions.length)} sub={`${pastSessions.length} passées`} />
        <StatChip label="✅ Présence" value={attendanceRate !== null ? `${attendanceRate}%` : '—'} sub={markedSessions.length > 0 ? `${attended}P · ${missed}A` : 'Non marquée'} />
        <StatChip label="📅 Prochaine" value={nextSession ? formatDate(nextSession.session_date) : '—'} sub={nextSession?.session_time?.replace(':', 'h') ?? ''} />
      </div>

      {(client.main_goal || client.activity_level) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">🏅 Profil sportif</p>
          <div className="divide-y divide-[#F8FAFB]">
            {client.main_goal && <InfoRow label="Objectif" value={GOAL_LABELS[client.main_goal] ?? client.main_goal} />}
            {client.activity_level && <InfoRow label="Niveau activité" value={ACTIVITY_LABELS[client.activity_level] ?? client.activity_level} />}
            {client.sport_performances && (
              <div className="py-2.5">
                <p className="text-xs text-[#94A3B8] mb-1">Notes performances</p>
                <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.sport_performances}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {performanceEntries.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2">🏆 Performances enregistrées</p>
          <div className="divide-y divide-[#F8FAFB]">
            {performanceEntries.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-semibold text-[#0D1F3C]">{p.label}</span>
                  {p.notes && <span className="text-[11px] text-[#94A3B8] ml-2 truncate hidden sm:inline">{p.notes}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[13px] font-bold text-brand">{p.value} {p.unit}</span>
                  <span className="text-[10px] text-[#94A3B8]">{new Date(p.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentSessions.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2">📋 5 dernières séances</p>
          <div className="divide-y divide-[#F8FAFB]">
            {recentSessions.map(s => {
              const att = s.attendance
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[12px] font-medium text-[#0D1F3C] shrink-0">{formatDate(s.session_date)}</span>
                    {s.session_time && <span className="text-[11px] text-[#94A3B8] shrink-0">{s.session_time.replace(':', 'h')}</span>}
                    {isCoach && s.notes && <span className="text-[11px] text-[#94A3B8] truncate hidden sm:block">{s.notes.slice(0, 60)}{s.notes.length > 60 ? '…' : ''}</span>}
                  </div>
                  {att === 'attended' && <span className="text-[10px] font-semibold bg-brand-bg text-brand px-2 py-0.5 rounded-full shrink-0">✓ Présent</span>}
                  {att === 'missed'   && <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full shrink-0">✗ Absent</span>}
                  {!att && <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full shrink-0">Non marquée</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Nutrition Section ────────────────────────────────────────────────────────

function NutritionSection({ client, weightEntries, bodyMeasurements, userPlan }: { client: Client; weightEntries: WeightEntry[]; bodyMeasurements: BodyMeasurement[]; userPlan: string }) {
  const bmi = calcBmiCoach(client.height_cm, client.weight_kg)
  const weightData = useMemo(() =>
    weightEntries.map(w => ({
      date: new Date(w.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      poids: w.weight_kg,
    })), [weightEntries])
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].poids : client.weight_kg
  const weightDelta = weightData.length >= 2 ? +(weightData[weightData.length - 1].poids - weightData[0].poids).toFixed(1) : null

  const measFields: { key: keyof BodyMeasurement; label: string }[] = [
    { key: 'neck_cm',      label: 'Cou' },
    { key: 'shoulders_cm', label: 'Épaules' },
    { key: 'chest_cm',     label: 'Poitrine' },
    { key: 'waist_cm',     label: 'Tour de taille' },
    { key: 'hips_cm',      label: 'Tour de hanches' },
    { key: 'l_bicep_cm',   label: 'Biceps gauche' },
    { key: 'r_bicep_cm',   label: 'Biceps droit' },
    { key: 'l_forearm_cm', label: 'Avant-bras gauche' },
    { key: 'r_forearm_cm', label: 'Avant-bras droit' },
    { key: 'l_thigh_cm',   label: 'Cuisse gauche' },
    { key: 'r_thigh_cm',   label: 'Cuisse droite' },
  ]
  const firstMeas = bodyMeasurements[0]
  const lastMeas = bodyMeasurements[bodyMeasurements.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="⚖️ Poids" value={currentWeight ? `${currentWeight} kg` : '—'} sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg` : 'profil statique'} />
        <StatChip label="📏 Taille" value={client.height_cm ? `${client.height_cm} cm` : '—'} sub={client.gender === 'homme' ? 'Homme' : client.gender === 'femme' ? 'Femme' : ''} />
        <StatChip label="📊 IMC" value={bmi ? String(bmi.value) : '—'} sub={bmi ? (bmi.value < 18.5 ? 'Insuffisant' : bmi.value < 25 ? 'Normal' : bmi.value < 30 ? 'Surpoids' : 'Obésité') : ''} />
        <StatChip label="🔥 Calories" value={client.daily_calories_estimated ? `${client.daily_calories_estimated}` : '—'} sub="kcal / jour" />
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-semibold text-[#0D1F3C]">📈 Évolution du poids</p>
            {weightDelta !== null && (
              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${weightDelta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : weightDelta > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {weightDelta > 0 ? '+' : ''}{weightDelta} kg depuis le début
              </span>
            )}
          </div>
          {currentWeight && <p className="text-[13px] font-bold text-[#0D1F3C]">{currentWeight} kg</p>}
        </div>
        {weightData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#CBD5E1' }} tickFormatter={v => `${v}kg`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} kg`, 'Poids']} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Line type="monotone" dataKey="poids" stroke="var(--brand)" strokeWidth={2} dot={{ fill: 'var(--brand)', r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[12px] text-[#94A3B8] text-center py-6">
            {weightData.length === 0 ? 'Aucune pesée enregistrée' : 'Il faut au minimum 2 pesées pour afficher la courbe'}
          </p>
        )}
      </div>

      <PlanGate featureKey="mensurations" userPlan={userPlan}>
        {bodyMeasurements.length > 0 && firstMeas && lastMeas && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">📐 Mensurations</p>
            <p className="text-[11px] text-[#94A3B8] mb-4">
              {bodyMeasurements.length === 1
                ? `Mesure du ${new Date(firstMeas.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                : `${new Date(firstMeas.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${new Date(lastMeas.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
            </p>
            <div className="space-y-2">
              {measFields.map(({ key, label }) => {
                const first = firstMeas[key] as number | null
                const last = lastMeas[key] as number | null
                if (last === null) return null
                const delta = (bodyMeasurements.length > 1 && first !== null) ? +(last - first).toFixed(1) : null
                return (
                  <div key={key as string} className="flex items-center gap-3 py-2 border-b border-[#F8FAFB] last:border-0">
                    <span className="text-[12px] text-[#64748B] w-36 shrink-0">{label}</span>
                    <span className="text-[13px] font-semibold text-[#0D1F3C] tabular-nums">{last} cm</span>
                    {delta !== null && delta !== 0 && (
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full tabular-nums ${delta < 0 ? 'bg-[#EEF9F3] text-[#4E9B6F]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                        {delta > 0 ? '+' : ''}{delta} cm
                      </span>
                    )}
                    {delta === 0 && <span className="text-[11px] text-[#CBD5E1]">stable</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </PlanGate>

      {(client.dietary_habits || client.daily_calories_estimated) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">🥗 Profil alimentaire</p>
          <div className="divide-y divide-[#F8FAFB]">
            {client.dietary_habits && (
              <div className="py-2.5">
                <p className="text-xs text-[#94A3B8] mb-1">Habitudes</p>
                <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.dietary_habits}</p>
              </div>
            )}
            {client.daily_calories_estimated && <InfoRow label="Calories / jour" value={`${client.daily_calories_estimated} kcal`} />}
          </div>
        </div>
      )}

      <NutritionProgrammeEditor clientId={client.id} />
    </div>
  )
}

// ─── Nutrition Programme Editor ───────────────────────────────────────────────

function NutritionProgrammeEditor({ clientId }: { clientId: string }) {
  const [programme, setProgramme] = useState<{ id: string; title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach/nutrition?clientId=${clientId}`)
      .then(r => r.json())
      .then(d => { setProgramme(d.programme ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  function startEdit() { setTitle(programme?.title ?? 'Programme nutritionnel'); setContent(programme?.content ?? ''); setEditing(true) }

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/coach/nutrition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, title, content }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setProgramme(data.programme); setEditing(false)
    toast.success('Programme nutritionnel sauvegardé !')
  }

  if (loading) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">🥗 Programme nutritionnel client</p>
        {!editing && <button onClick={startEdit} className="text-[12px] font-medium text-brand hover:underline">{programme ? 'Modifier' : 'Rédiger'}</button>}
      </div>
      {editing ? (
        <div className="space-y-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du programme"
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
            placeholder="Rédigez ici le programme nutritionnel du client : objectifs caloriques, répartition des macros, conseils repas…"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand resize-none" />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !content.trim()} className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-[13px] text-[#64748B] hover:text-[#0D1F3C]">Annuler</button>
          </div>
        </div>
      ) : programme ? (
        <p className="text-[13px] text-[#0D1F3C] leading-relaxed whitespace-pre-wrap line-clamp-4">{programme.content}</p>
      ) : (
        <p className="text-[12px] text-[#94A3B8] text-center py-4">Aucun programme nutritionnel défini pour ce client.</p>
      )}
    </div>
  )
}

// ─── Habitudes Section ────────────────────────────────────────────────────────

function HabitesSection({ client, checkins, sleepEntries }: { client: Client; checkins: Checkin[]; sleepEntries: SleepEntry[] }) {
  const now = new Date()
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()
  const hasCheckinThisWeek = checkins.some(c => c.week_number === currentWeek && c.year === currentYear)

  const sleep7d = sleepEntries.filter(s => (now.getTime() - new Date(s.date + 'T00:00').getTime()) / 86400000 <= 7)
  const avgSleep7d = sleep7d.length > 0 ? +(sleep7d.reduce((acc, s) => acc + s.hours, 0) / sleep7d.length).toFixed(1) : null
  const recentCheckins = checkins.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatChip label="✅ Check-ins" value={String(checkins.length)} sub={hasCheckinThisWeek ? 'Semaine ✓' : 'En attente'} highlight={hasCheckinThisWeek} />
        <StatChip label="🌙 Sommeil moy." value={avgSleep7d !== null ? `${avgSleep7d}h` : client.avg_sleep_hours ? `${client.avg_sleep_hours}h` : '—'} sub={avgSleep7d !== null ? '7 derniers jours' : 'profil statique'} />
      </div>

      {recentCheckins.length > 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide px-4 pt-4 pb-2">✅ Derniers check-ins</p>
          <div className="divide-y divide-[#F8FAFB]">
            {recentCheckins.map(c => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-brand bg-brand-bg px-2 py-0.5 rounded-full">S{c.week_number}</span>
                  <span className="text-[11px] text-[#94A3B8]">{new Date(c.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
                {c.q1_answer ? <p className="text-[12px] text-[#0D1F3C] leading-relaxed line-clamp-2">{c.q1_answer}</p> : <p className="text-[12px] text-[#94A3B8] italic">Aucune réponse.</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-6 text-center">
          <p className="text-sm text-[#94A3B8]">Aucun check-in reçu pour ce client.</p>
        </div>
      )}

      {(client.injuries || client.avg_sleep_hours || sleepEntries.length > 0) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">💚 Santé & bien-être</p>
          <div className="divide-y divide-[#F8FAFB]">
            {client.injuries && (
              <div className="py-2.5">
                <p className="text-xs text-[#94A3B8] mb-1">Blessures / contraintes</p>
                <p className="text-[12px] text-[#0D1F3C] leading-relaxed">{client.injuries}</p>
              </div>
            )}
            {avgSleep7d !== null && <InfoRow label="🌙 Sommeil moyen (7j)" value={`${avgSleep7d}h / nuit`} />}
            {avgSleep7d === null && client.avg_sleep_hours && <InfoRow label="🌙 Sommeil (profil)" value={`${client.avg_sleep_hours}h / nuit`} />}
          </div>
        </div>
      )}

      <HabitsManager clientId={client.id} />
    </div>
  )
}

// ─── Habits Manager ───────────────────────────────────────────────────────────

function HabitsManager({ clientId }: { clientId: string }) {
  const [habits, setHabits] = useState<{ id: string; name: string; emoji: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach/habits?clientId=${clientId}`)
      .then(r => r.json())
      .then(d => { setHabits(d.habits ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  async function addHabit() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/coach/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, name: newName.trim(), emoji: newEmoji }) })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setHabits(prev => [...prev, data.habit]); setNewName(''); setNewEmoji('✅')
    toast.success('Habitude ajoutée !')
  }

  async function deleteHabit(id: string) {
    await fetch(`/api/coach/habits?clientId=${clientId}&id=${id}`, { method: 'DELETE' })
    setHabits(prev => prev.filter(h => h.id !== id))
    toast.success('Supprimé')
  }

  if (loading) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">💤 Habitudes à cocher (client)</p>
      {habits.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {habits.map(h => (
            <div key={h.id} className="flex items-center gap-2.5 px-3 py-2 bg-[#F8FAFB] rounded-lg">
              <span className="text-[15px]">{h.emoji}</span>
              <span className="flex-1 text-[13px] text-[#0D1F3C]">{h.name}</span>
              <button onClick={() => deleteHabit(h.id)} className="text-[#D1D5DB] hover:text-red-400 transition-colors text-[18px] leading-none">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={newEmoji} onChange={e => setNewEmoji(e.target.value.slice(0, 4))} className="w-12 text-center px-1 py-2 border border-[#E2E8F0] rounded-lg text-[15px] focus:outline-none" placeholder="✅" />
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex : 8 verres d'eau, 30 min marche…"
          className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand"
          onKeyDown={e => e.key === 'Enter' && addHabit()} />
        <button onClick={addHabit} disabled={saving || !newName.trim()} className="px-3 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50 whitespace-nowrap">+</button>
      </div>
    </div>
  )
}
