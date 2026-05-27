'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/shared/logo'
import { Check } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 'done'

type FormData = {
  firstName: string
  lastName: string
  birthDate: string
  gender: string
  heightCm: string
  weightKg: string
  mainGoal: string
  activityLevel: string
  injuries: string
  dietaryHabits: string
  avgSleepHours: string
  sportPerformances: string
  dailyCalories: string
  privacyAccepted: boolean
}

const GOALS_POIDS = [
  { value: 'perte_de_poids',  label: 'Perte de poids' },
  { value: 'prise_de_masse',  label: 'Prise de masse' },
  { value: 'remise_en_forme', label: 'Remise en forme' },
]
const GOALS_PERF = [
  { value: 'performance',  label: 'Performance sportive' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'mobilite',     label: 'Mobilite & souplesse' },
]
const ALL_PREDEFINED_GOALS = [...GOALS_POIDS, ...GOALS_PERF].map(g => g.value)

const ACTIVITY_LEVELS = [
  { value: 'sedentaire',       label: 'Sédentaire',         sub: 'Peu ou pas d\'exercice' },
  { value: 'leger',            label: 'Légèrement actif',   sub: '1 à 3 séances / semaine' },
  { value: 'moderement_actif', label: 'Modérément actif',   sub: '3 à 5 séances / semaine' },
  { value: 'tres_actif',       label: 'Très actif',         sub: '6 séances et plus / semaine' },
]

const STEP_LABELS = ['Identité', 'Profil physique', 'Profil coaching', 'Optimisation']

const BRAND = 'var(--brand)'

function SelectCard({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
        !selected ? 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]' : ''
      }`}
      style={selected ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)' } : {}}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: selected ? 'var(--brand)' : '#0D1F3C' }}>{label}</p>
        {sub && <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>}
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${!selected ? 'border-[#CBD5E1]' : ''}`}
        style={selected ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand)' } : {}}
      >
        {selected && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#0D1F3C] mb-2">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0D1F3C] placeholder:text-[#94A3B8] focus:outline-none focus:border-[var(--brand)] transition-all'

type Props = { clientId: string; token: string; initialName: string; coachName: string }

export function OnboardingFlow({ clientId: _clientId, token, initialName, coachName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  const nameParts = initialName.trim().split(' ')
  const [form, setForm] = useState<FormData>({
    firstName: nameParts[0] ?? '',
    lastName:  nameParts.slice(1).join(' '),
    birthDate: '', gender: '', heightCm: '', weightKg: '',
    mainGoal: '', activityLevel: '', injuries: '', dietaryHabits: '',
    avgSleepHours: '', sportPerformances: '', dailyCalories: '',
    privacyAccepted: false,
  })

  function set<K extends keyof FormData>(key: K, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function canAdvance(): boolean {
    if (step === 1) return !!form.firstName.trim() && !!form.lastName.trim() && !!form.birthDate && form.privacyAccepted
    if (step === 2) return !!form.gender && !!form.heightCm && !!form.weightKg
    return true
  }

  function saveStep(partial: Partial<FormData>) {
    fetch('/api/client/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...partial }),
    }).catch(() => {})
  }

  async function finish() {
    setLoading(true)
    try {
      await fetch('/api/client/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
    } catch {}
    setLoading(false)
    setStep('done')
  }

  function advance() {
    if (step === 1) {
      saveStep({ firstName: form.firstName, lastName: form.lastName, birthDate: form.birthDate })
      setStep(2)
    } else if (step === 2) {
      saveStep({ gender: form.gender, heightCm: form.heightCm, weightKg: form.weightKg })
      setStep(3)
    } else if (step === 3) {
      saveStep({ mainGoal: form.mainGoal, activityLevel: form.activityLevel, injuries: form.injuries, dietaryHabits: form.dietaryHabits })
      setStep(4)
    } else if (step === 4) {
      finish()
    }
  }

  function skip() {
    if (step === 3) setStep(4)
    else if (step === 4) finish()
  }

  const stepNum = typeof step === 'number' ? step : null

  return (
    <>
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .step-enter { animation: stepIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>

      <div className="fixed inset-0 z-[100] flex overflow-hidden">

        {/* ── Left brand panel (desktop only) ─────────────────── */}
        <aside
          className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 flex-col p-10 xl:p-12"
          style={{ backgroundColor: BRAND }}
        >
          <div className="shrink-0" style={{ filter: 'brightness(0) invert(1)' }}>
            <Logo height={28} variant="default" />
          </div>

          <div className="flex-1 flex flex-col justify-center mt-12">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
              Configuration du compte
            </p>
            <h2 className="text-white text-[28px] xl:text-[32px] font-semibold leading-[1.2] mb-10">
              Votre espace<br />de coaching<br />personnalisé.
            </h2>

            {/* Step list */}
            <div className="space-y-4">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1
                const done   = stepNum !== null && n < stepNum
                const active = stepNum === n
                const future = stepNum === null || n > stepNum
                return (
                  <div key={i} className={`flex items-center gap-3.5 transition-opacity ${future ? 'opacity-35' : 'opacity-100'}`}>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                        done   ? 'bg-white' :
                        active ? 'bg-white/20 border-2 border-white text-white' :
                                 'bg-white/10 text-white/60'
                      }`}
                      style={done ? { color: 'var(--brand)' } : {}}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : n}
                    </div>
                    <span className={`text-sm font-medium ${active ? 'text-white' : 'text-white/80'}`}>
                      {label}
                    </span>
                    {active && (
                      <span className="ml-auto text-[10px] text-white/60 font-medium uppercase tracking-wide">
                        En cours
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-white/40 text-xs shrink-0">
            {coachName} vous accompagne.
          </p>
        </aside>

        {/* ── Right form panel ─────────────────────────────────── */}
        <div className="flex-1 bg-[#F8FAFB] overflow-y-auto">
          <div className="min-h-full flex flex-col max-w-xl mx-auto px-6 sm:px-10 lg:px-16 py-8 lg:py-12">

            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between mb-6 shrink-0">
              <Logo height={26} variant="default" />
              {stepNum && (
                <span className="text-xs font-medium text-[#94A3B8] tabular-nums">{stepNum} / 4</span>
              )}
            </div>

            {/* Mobile progress bar */}
            {stepNum && (
              <div className="lg:hidden flex gap-1.5 mb-8 shrink-0">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className="h-[3px] flex-1 rounded-full transition-all duration-500"
                    style={{ background: s <= stepNum ? BRAND : '#E2E8F0' }} />
                ))}
              </div>
            )}

            {/* Desktop step counter */}
            {stepNum && (
              <div className="hidden lg:flex items-center gap-3 mb-10 shrink-0">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className="h-[3px] w-8 rounded-full transition-all duration-500"
                      style={{ background: s <= stepNum ? BRAND : '#E2E8F0' }} />
                  ))}
                </div>
                <span className="text-xs font-medium text-[#94A3B8] tabular-nums">{stepNum} / 4</span>
              </div>
            )}

            {/* Step content */}
            <div className="flex-1 flex flex-col justify-center">
              <div key={step} className="step-enter">

                {/* STEP 1 — Identité */}
                {step === 1 && (
                  <div className="space-y-8">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: BRAND }}>
                        Identité
                      </p>
                      <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#0D1F3C] leading-[1.15] mb-3">
                        Commençons par<br />vous connaître.
                      </h1>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        Votre coach a créé votre espace. Vérifiez et complétez vos informations.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Prénom">
                          <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                            placeholder="Prénom" autoFocus className={inputCls} />
                        </Field>
                        <Field label="Nom">
                          <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                            placeholder="Nom" className={inputCls} />
                        </Field>
                      </div>
                      <Field label="Date de naissance">
                        <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)}
                          max={new Date().toISOString().split('T')[0]} className={inputCls} />
                      </Field>
                    </div>

                    {/* Consentement RGPD */}
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, privacyAccepted: !f.privacyAccepted }))}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${form.privacyAccepted ? 'border-transparent' : 'border-[#CBD5E1] bg-white'}`}
                        style={form.privacyAccepted ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : {}}
                      >
                        {form.privacyAccepted && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-xs text-[#64748B] leading-relaxed">
                        J&apos;ai lu et j&apos;accepte la{' '}
                        <a
                          href="/politique-confidentialite"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="font-medium underline"
                          style={{ color: 'var(--brand)' }}
                        >
                          politique de confidentialité
                        </a>
                        . Mes données sont utilisées uniquement dans le cadre de mon suivi de coaching.
                      </span>
                    </button>
                  </div>
                )}

                {/* STEP 2 — Profil physique */}
                {step === 2 && (
                  <div className="space-y-8">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: BRAND }}>
                        Profil physique
                      </p>
                      <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#0D1F3C] leading-[1.15] mb-3">
                        Votre profil<br />physique.
                      </h1>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        Ces données permettent de calibrer vos objectifs et votre programme.
                      </p>
                    </div>
                    <div className="space-y-5">
                      <Field label="Vous êtes">
                        <div className="grid grid-cols-3 gap-2.5 mt-0.5">
                          {[
                            { value: 'homme', label: 'Homme' },
                            { value: 'femme', label: 'Femme' },
                          ].map(opt => {
                            const sel = form.gender === opt.value
                            return (
                              <button key={opt.value} type="button" onClick={() => set('gender', opt.value)}
                                className={`py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${!sel ? 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]' : ''}`}
                                style={sel ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)', color: 'var(--brand)' } : {}}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Taille (cm)">
                          <input type="number" value={form.heightCm} onChange={e => set('heightCm', e.target.value)}
                            placeholder="175" min={100} max={250} className={inputCls} />
                        </Field>
                        <Field label="Poids (kg)">
                          <input type="number" value={form.weightKg} onChange={e => set('weightKg', e.target.value)}
                            placeholder="70" min={30} max={300} step={0.1} className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Profil coaching */}
                {step === 3 && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
                          Profil coaching
                        </p>
                        <span className="text-[10px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                          Recommandé
                        </span>
                      </div>
                      <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#0D1F3C] leading-[1.15] mb-3">
                        Adapter votre<br />coaching.
                      </h1>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        Ces informations aident votre coach à personnaliser votre programme.
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-[#0D1F3C] mb-3">Objectif principal</p>

                        {/* Groupe Poids & Corps */}
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-2">Poids &amp; Corps</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {GOALS_POIDS.map(g => {
                            const sel = form.mainGoal === g.value
                            return (
                              <button key={g.value} type="button"
                                onClick={() => set('mainGoal', g.value)}
                                className={`py-2.5 px-2 rounded-xl border-2 text-[13px] font-medium text-center transition-all duration-150 ${!sel ? 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]' : ''}`}
                                style={sel ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)', color: 'var(--brand)' } : {}}
                              >
                                {g.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Groupe Performance */}
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-2">Performance</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {GOALS_PERF.map(g => {
                            const sel = form.mainGoal === g.value
                            return (
                              <button key={g.value} type="button"
                                onClick={() => set('mainGoal', g.value)}
                                className={`py-2.5 px-2 rounded-xl border-2 text-[13px] font-medium text-center transition-all duration-150 ${!sel ? 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]' : ''}`}
                                style={sel ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)', color: 'var(--brand)' } : {}}
                              >
                                {g.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Champ libre */}
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-2">Autre / Personnalisé</p>
                        <input
                          type="text"
                          value={ALL_PREDEFINED_GOALS.includes(form.mainGoal) ? '' : form.mainGoal}
                          onChange={e => set('mainGoal', e.target.value)}
                          placeholder="Ex : reprendre le sport, préparation marathon..."
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0D1F3C] mb-2.5">Niveau d'activité</p>
                        <div className="space-y-2">
                          {ACTIVITY_LEVELS.map(a => (
                            <SelectCard key={a.value} label={a.label} sub={a.sub}
                              selected={form.activityLevel === a.value}
                              onClick={() => set('activityLevel', a.value)} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0D1F3C] mb-1">Blessures ou douleurs</label>
                        <p className="text-xs text-[#94A3B8] mb-2">Zones sensibles, antécédents, contraintes...</p>
                        <textarea rows={2} value={form.injuries} onChange={e => set('injuries', e.target.value)}
                          placeholder="Ex : douleur genou droit, hernie discale..."
                          className={inputCls + ' resize-none'} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0D1F3C] mb-1">Habitudes alimentaires</label>
                        <p className="text-xs text-[#94A3B8] mb-2">Intolérances, préférences, restrictions...</p>
                        <textarea rows={2} value={form.dietaryHabits} onChange={e => set('dietaryHabits', e.target.value)}
                          placeholder="Ex : végétarien, intolérant au gluten..."
                          className={inputCls + ' resize-none'} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Optimisation */}
                {step === 4 && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
                          Optimisation
                        </p>
                        <span className="text-[10px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                          Optionnel
                        </span>
                      </div>
                      <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#0D1F3C] leading-[1.15] mb-3">
                        Affinez votre<br />suivi.
                      </h1>
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        Complétez seulement ce que vous savez. Vous pourrez toujours le modifier plus tard.
                      </p>
                    </div>
                    <div className="space-y-5">
                      <Field label="Sommeil moyen (heures par nuit)">
                        <input type="number" value={form.avgSleepHours} onChange={e => set('avgSleepHours', e.target.value)}
                          placeholder="7" min={1} max={24} step={0.5} className={inputCls} />
                      </Field>
                      <div>
                        <label className="block text-sm font-medium text-[#0D1F3C] mb-1">Performances sportives</label>
                        <p className="text-xs text-[#94A3B8] mb-2">Vos records personnels, capacités actuelles...</p>
                        <textarea rows={2} value={form.sportPerformances} onChange={e => set('sportPerformances', e.target.value)}
                          placeholder="Ex : course 5 km en 28 min, squat max 80 kg..."
                          className={inputCls + ' resize-none'} />
                      </div>
                      <Field label="Calories journalières estimées (kcal)">
                        <input type="number" value={form.dailyCalories} onChange={e => set('dailyCalories', e.target.value)}
                          placeholder="2000" min={500} max={10000} className={inputCls} />
                      </Field>
                    </div>
                  </div>
                )}

                {/* DONE */}
                {step === 'done' && (
                  <div className="text-center py-8">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-7"
                      style={{ backgroundColor: BRAND }}
                    >
                      <Check size={28} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#0D1F3C] mb-3 leading-tight">
                      Votre profil<br />est prêt.
                    </h1>
                    <p className="text-sm text-[#64748B] leading-relaxed mb-10">
                      {coachName} peut maintenant personnaliser<br />
                      votre programme de coaching.
                    </p>
                    <button
                      onClick={() => router.push(`/c/${token}/dashboard`)}
                      className="w-full py-3.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: BRAND }}
                    >
                      Accéder à mon espace →
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Footer CTA */}
            {stepNum && (
              <div className="shrink-0 pt-8 pb-4 space-y-2.5">
                <button
                  onClick={advance}
                  disabled={!canAdvance() || loading}
                  className="w-full py-3.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: BRAND }}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Finalisation...
                      </span>
                    : step === 4 ? 'Terminer' : 'Continuer →'}
                </button>
                {(step === 3 || step === 4) && (
                  <button onClick={skip}
                    className="w-full py-2.5 text-sm text-[#94A3B8] hover:text-[#64748B] transition-colors">
                    Passer cette étape
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
