'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useIsCoachView } from '@/hooks/use-coach-view'
import { formatDateShort } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { Client } from '@/types/database'

type Props = {
  client: Client
  coachName: string
  coachingType: string | null
  coachPhoto?: string | null
}

type ProfilTab = 'sport' | 'nutrition' | 'habitudes'

const GOALS: { value: string; label: string }[] = [
  { value: 'perte_de_poids',  label: 'Perte de poids' },
  { value: 'prise_de_masse',  label: 'Prise de masse' },
  { value: 'performance',     label: 'Performance sportive' },
  { value: 'remise_en_forme', label: 'Remise en forme' },
  { value: 'autre',           label: 'Autre' },
]

const ACTIVITY_LEVELS: { value: string; label: string; sub: string }[] = [
  { value: 'sedentaire',        label: 'Sédentaire',        sub: 'Peu ou pas d\'exercice' },
  { value: 'leger',             label: 'Légèrement actif',  sub: '1 à 3 séances / semaine' },
  { value: 'moderement_actif',  label: 'Modérément actif',  sub: '3 à 5 séances / semaine' },
  { value: 'tres_actif',        label: 'Très actif',        sub: '6 séances et plus / semaine' },
]

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const d = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

function calcBmi(height: number | null, weight: number | null): { value: number; label: string; color: string } | null {
  if (!height || !weight) return null
  const bmi = weight / ((height / 100) ** 2)
  const rounded = Math.round(bmi * 10) / 10
  if (bmi < 18.5) return { value: rounded, label: 'Insuffisance pondérale', color: '#3B82F6' }
  if (bmi < 25)   return { value: rounded, label: 'Poids normal', color: '#4E9B6F' }
  if (bmi < 30)   return { value: rounded, label: 'Surpoids', color: '#D97706' }
  return { value: rounded, label: 'Obésité', color: '#EF4444' }
}

const inputCls = 'w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0D1F3C] placeholder:text-[#94A3B8] focus:outline-none focus:border-[var(--brand)] transition-colors'
const textareaCls = inputCls + ' resize-none'

function SectionHeader({ title, onEdit, editing, readOnly = false }: { title: string; onEdit: () => void; editing: boolean; readOnly?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[13px] font-semibold text-[#0D1F3C]">{title}</h2>
      {!editing && !readOnly && (
        <button onClick={onEdit} className="text-[12px] font-medium text-brand hover:underline">
          Modifier
        </button>
      )}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#F8FAFB] last:border-0">
      <span className="text-[12px] text-[#94A3B8] shrink-0">{label}</span>
      <span className="text-[12px] font-medium text-[#0D1F3C] text-right max-w-[60%]">
        {value || <span className="text-[#CBD5E1]">—</span>}
      </span>
    </div>
  )
}

function SelectCard({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border-[1.5px] text-left transition-all duration-150 ${!selected ? 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]' : ''}`}
      style={selected ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 6%, white)' } : {}}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium" style={{ color: selected ? 'var(--brand)' : '#0D1F3C' }}>{label}</p>
        {sub && <p className="text-[11px] text-[#94A3B8] mt-0.5">{sub}</p>}
      </div>
      <div className="w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0"
        style={selected ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand)' } : { borderColor: '#CBD5E1' }}
      >
        {selected && <Check size={8} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  )
}

function SaveCancelRow({ onSave, onCancel, saving, sectionKey }: { onSave: () => void; onCancel: () => void; saving: string | null; sectionKey: string }) {
  return (
    <div className="flex gap-2 pt-1">
      <button onClick={onSave} disabled={saving === sectionKey}
        className="px-4 py-2 btn-brand text-[13px] font-medium rounded-lg disabled:opacity-50">
        {saving === sectionKey ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
      <button onClick={onCancel} className="px-4 py-2 text-[13px] text-[#64748B] hover:text-[#0D1F3C] transition-colors">
        Annuler
      </button>
    </div>
  )
}

export function ClientProfil({ client, coachName, coachingType, coachPhoto }: Props) {
  const router = useRouter()
  const isCoachView = useIsCoachView()

  const [activeTab, setActiveTab] = useState<ProfilTab>('sport')
  const [editingIdentity, setEditingIdentity] = useState(false)
  const [editingSport, setEditingSport] = useState(false)
  const [editingNutrition, setEditingNutrition] = useState(false)
  const [editingHabitudes, setEditingHabitudes] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  // Identity
  const [fullName, setFullName] = useState(client.full_name)
  const [birthDate, setBirthDate] = useState(client.birth_date ?? '')

  // Sport
  const [mainGoal, setMainGoal] = useState(client.main_goal ?? '')
  const [activityLevel, setActivityLevel] = useState(client.activity_level ?? '')
  const [sportPerformances, setSportPerformances] = useState(client.sport_performances ?? '')

  // Nutrition
  const [gender, setGender] = useState(client.gender ?? '')
  const [heightCm, setHeightCm] = useState(client.height_cm ? String(client.height_cm) : '')
  const [weightKg, setWeightKg] = useState(client.weight_kg ? String(client.weight_kg) : '')
  const [dietaryHabits, setDietaryHabits] = useState(client.dietary_habits ?? '')
  const [dailyCalories, setDailyCalories] = useState(client.daily_calories_estimated ? String(client.daily_calories_estimated) : '')

  // Habitudes
  const [avgSleepHours, setAvgSleepHours] = useState(client.avg_sleep_hours ? String(client.avg_sleep_hours) : '')
  const [injuries, setInjuries] = useState(client.injuries ?? '')

  async function save(section: string, updates: Record<string, string | undefined>) {
    setSaving(section)
    const res = await fetch('/api/client/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, magicToken: client.magic_token, ...updates }),
    })
    const data = await res.json()
    setSaving(null)
    if (data.error) { toast.error(data.error); return }
    toast.success('Mis à jour.')
    router.refresh()
    if (section === 'identity')   setEditingIdentity(false)
    if (section === 'sport')      setEditingSport(false)
    if (section === 'nutrition')  setEditingNutrition(false)
    if (section === 'habitudes')  setEditingHabitudes(false)
  }

  const age = calcAge(client.birth_date)
  const bmi = calcBmi(client.height_cm, client.weight_kg)
  const goalLabel = GOALS.find(g => g.value === client.main_goal)?.label
  const activityLabel = ACTIVITY_LEVELS.find(a => a.value === client.activity_level)?.label

  const TABS: { key: ProfilTab; label: string }[] = [
    { key: 'sport',      label: 'Sport' },
    { key: 'nutrition',  label: 'Nutrition' },
    { key: 'habitudes',  label: 'Habitudes' },
  ]

  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px] bg-[#F8FAFC]">👤</div>
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1F3C]">Mon profil</h1>
        </div>
      </div>

      {/* ── Mon coach ── */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #1e3a5f 100%)' }}
      >
        <div className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          {coachPhoto
            ? <img src={coachPhoto} alt={coachName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[18px] font-bold text-white">{coachName.charAt(0).toUpperCase()}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-0.5">Ton coach</p>
          <p className="text-[15px] font-bold text-white truncate">{coachName}</p>
          {coachingType && <p className="text-[12px] text-white/60">{coachingType}</p>}
        </div>
      </div>

      {/* ── Identité ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <SectionHeader title="Identité" onEdit={() => setEditingIdentity(true)} editing={editingIdentity} readOnly={isCoachView} />
        {editingIdentity ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Nom complet</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Date de naissance</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} className={inputCls} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Email</label>
              <input type="email" value={client.email} disabled className={inputCls + ' bg-[#F8FAFB] text-[#94A3B8] cursor-not-allowed'} />
            </div>
            <SaveCancelRow sectionKey="identity" saving={saving}
              onSave={() => save('identity', { fullName, birthDate: birthDate || undefined })}
              onCancel={() => { setEditingIdentity(false); setFullName(client.full_name); setBirthDate(client.birth_date ?? '') }} />
          </div>
        ) : (
          <>
            <DataRow label="Nom" value={client.full_name} />
            <DataRow label="Âge" value={age ? `${age} ans` : null} />
            <DataRow label="Date de naissance" value={client.birth_date ? new Date(client.birth_date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            <DataRow label="Email" value={client.email.includes('@evolya.internal') ? '—' : client.email} />
          </>
        )}
      </section>

      {/* ── Sport / Nutrition / Habitudes tabs ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-[#F1F5F9]">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-[13px] font-medium transition-colors ${activeTab === tab.key ? '' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
              style={activeTab === tab.key ? { color: 'var(--brand)', borderBottom: '2px solid var(--brand)' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Sport */}
          {activeTab === 'sport' && (
            <>
              <SectionHeader title="Mon profil sport" onEdit={() => setEditingSport(true)} editing={editingSport} readOnly={isCoachView} />
              {editingSport ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-2">Objectif principal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GOALS.map(g => {
                        const sel = mainGoal === g.value
                        return (
                          <button key={g.value} type="button" onClick={() => setMainGoal(g.value)}
                            className={`py-2.5 px-3 rounded-lg border-[1.5px] text-[13px] font-medium text-left transition-all ${!sel ? 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]' : ''} ${g.value === 'autre' ? 'col-span-2' : ''}`}
                            style={sel ? { borderColor: 'var(--brand)', color: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 6%, white)' } : {}}>
                            {g.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-2">Niveau d'activité</label>
                    <div className="space-y-1.5">
                      {ACTIVITY_LEVELS.map(a => (
                        <SelectCard key={a.value} label={a.label} sub={a.sub}
                          selected={activityLevel === a.value} onClick={() => setActivityLevel(a.value)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1">Performances sportives</label>
                    <p className="text-[11px] text-[#94A3B8] mb-1.5">Vos records personnels, capacités actuelles...</p>
                    <textarea rows={2} value={sportPerformances} onChange={e => setSportPerformances(e.target.value)}
                      placeholder="Ex : squat max 80 kg, course 5 km en 28 min..." className={textareaCls} />
                  </div>
                  <SaveCancelRow sectionKey="sport" saving={saving}
                    onSave={() => save('sport', { mainGoal: mainGoal || undefined, activityLevel: activityLevel || undefined, sportPerformances: sportPerformances || undefined })}
                    onCancel={() => { setEditingSport(false); setMainGoal(client.main_goal ?? ''); setActivityLevel(client.activity_level ?? ''); setSportPerformances(client.sport_performances ?? '') }} />
                </div>
              ) : (
                <>
                  <DataRow label="Objectif" value={goalLabel ?? null} />
                  <DataRow label="Niveau d'activité" value={activityLabel ?? null} />
                  <DataRow label="Performances" value={client.sport_performances} />
                </>
              )}
            </>
          )}

          {/* Nutrition */}
          {activeTab === 'nutrition' && (
            <>
              <SectionHeader title="Mon profil nutrition" onEdit={() => setEditingNutrition(true)} editing={editingNutrition} readOnly={isCoachView} />
              {editingNutrition ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-2">Genre</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ value: 'homme', label: 'Homme' }, { value: 'femme', label: 'Femme' }].map(opt => {
                        const sel = gender === opt.value
                        return (
                          <button key={opt.value} type="button" onClick={() => setGender(opt.value)}
                            className={`py-2.5 rounded-lg border-[1.5px] text-[13px] font-medium transition-all ${!sel ? 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]' : ''}`}
                            style={sel ? { borderColor: 'var(--brand)', color: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 6%, white)' } : {}}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Taille (cm)</label>
                      <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="175" min={100} max={250} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Poids (kg)</label>
                      <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="70" min={30} max={300} step={0.1} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1">Habitudes alimentaires</label>
                    <p className="text-[11px] text-[#94A3B8] mb-1.5">Intolérances, préférences, restrictions...</p>
                    <textarea rows={2} value={dietaryHabits} onChange={e => setDietaryHabits(e.target.value)}
                      placeholder="Ex : végétarien, intolérant au gluten..." className={textareaCls} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Calories journalières (kcal)</label>
                    <input type="number" value={dailyCalories} onChange={e => setDailyCalories(e.target.value)}
                      placeholder="2000" min={500} max={10000} className={inputCls} />
                  </div>
                  <SaveCancelRow sectionKey="nutrition" saving={saving}
                    onSave={() => save('nutrition', { gender: gender || undefined, heightCm: heightCm || undefined, weightKg: weightKg || undefined, dietaryHabits: dietaryHabits || undefined, dailyCalories: dailyCalories || undefined })}
                    onCancel={() => { setEditingNutrition(false); setGender(client.gender ?? ''); setHeightCm(client.height_cm ? String(client.height_cm) : ''); setWeightKg(client.weight_kg ? String(client.weight_kg) : ''); setDietaryHabits(client.dietary_habits ?? ''); setDailyCalories(client.daily_calories_estimated ? String(client.daily_calories_estimated) : '') }} />
                </div>
              ) : (
                <>
                  <DataRow label="Genre" value={client.gender === 'homme' ? 'Homme' : client.gender === 'femme' ? 'Femme' : null} />
                  <DataRow label="Taille" value={client.height_cm ? `${client.height_cm} cm` : null} />
                  <DataRow label="Poids" value={client.weight_kg ? `${client.weight_kg} kg` : null} />
                  {bmi && (
                    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#F8FAFB]">
                      <span className="text-[12px] text-[#94A3B8] shrink-0">IMC</span>
                      <span className="text-[12px] font-semibold" style={{ color: bmi.color }}>{bmi.value} — {bmi.label}</span>
                    </div>
                  )}
                  <DataRow label="Alimentation" value={client.dietary_habits} />
                  <DataRow label="Calories / jour" value={client.daily_calories_estimated ? `${client.daily_calories_estimated} kcal` : null} />
                </>
              )}
            </>
          )}

          {/* Habitudes */}
          {activeTab === 'habitudes' && (
            <>
              <SectionHeader title="Mes habitudes" onEdit={() => setEditingHabitudes(true)} editing={editingHabitudes} readOnly={isCoachView} />
              {editingHabitudes ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Sommeil moyen (heures/nuit)</label>
                    <input type="number" value={avgSleepHours} onChange={e => setAvgSleepHours(e.target.value)}
                      placeholder="7" min={1} max={24} step={0.5} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1">Blessures ou douleurs</label>
                    <p className="text-[11px] text-[#94A3B8] mb-1.5">Zones sensibles, antécédents, contraintes...</p>
                    <textarea rows={2} value={injuries} onChange={e => setInjuries(e.target.value)}
                      placeholder="Ex : douleur genou droit..." className={textareaCls} />
                  </div>
                  <SaveCancelRow sectionKey="habitudes" saving={saving}
                    onSave={() => save('habitudes', { avgSleepHours: avgSleepHours || undefined, injuries: injuries || undefined })}
                    onCancel={() => { setEditingHabitudes(false); setAvgSleepHours(client.avg_sleep_hours ? String(client.avg_sleep_hours) : ''); setInjuries(client.injuries ?? '') }} />
                </div>
              ) : (
                <>
                  <DataRow label="Sommeil" value={client.avg_sleep_hours ? `${client.avg_sleep_hours}h / nuit` : null} />
                  <DataRow label="Blessures / douleurs" value={client.injuries} />
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Compte ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <h2 className="text-[13px] font-semibold text-[#0D1F3C] mb-3">Mon compte</h2>
        <DataRow label="Membre depuis" value={formatDateShort(client.created_at)} />
        <DataRow label="Statut" value={client.status === 'active' ? 'Actif' : 'Inactif'} />
        <DataRow label="Accès valide jusqu'au" value={formatDateShort(client.token_expires_at)} />
      </section>
    </main>
  )
}
