'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const COACHING_TYPES = [
  'Coach fitness', 'Coach musculation', 'Coach perte de poids', 'Coach bien-etre',
  'Preparateur physique', 'Coach running', 'Coach sport specifique', 'Coach yoga',
  'Coach pilates', 'Coach mobilite', 'Coach reeducation', 'Coach senior',
  'Coach handicap', 'Coach nutrition sportive', 'Coach transformation physique',
  'Coach mental sportif', 'Coach en ligne', 'Coach a domicile', 'Coach en salle', 'Autres',
]

const COLOR_PRESETS = [
  '#4E9B6F', '#0D1F3C', '#2563EB', '#7C3AED',
  '#EA580C', '#DC2626', '#DB2777', '#0891B2',
]

const FONT_OPTIONS = [
  { label: 'Geist (défaut)', value: 'Geist' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
]

const STEP_LABELS = ['Identifiants', 'Profil', 'Personnalisation', 'Premier client']

const inputCls = 'w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] focus:ring-3 focus:ring-[#4E9B6F]/10 transition-all'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan') ?? ''

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Étape 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Étape 2
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [coachingType, setCoachingType] = useState('')
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '')
  const [acceptCgu, setAcceptCgu] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)

  // Étape 3
  const [brandColorPrimary, setBrandColorPrimary] = useState('#4E9B6F')
  const [brandColorAccent, setBrandColorAccent] = useState('#0D1F3C')
  const [brandFont, setBrandFont] = useState('Geist')
  const [brandIcon, setBrandIcon] = useState('')

  // Étape 4
  const [clientName, setClientName] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const totalSteps = 4

  // Charger toutes les Google Fonts au montage
  useEffect(() => {
    const fonts = ['Inter', 'Poppins', 'Montserrat']
    fonts.forEach(font => {
      const id = `gfont-${font.toLowerCase()}`
      if (!document.getElementById(id)) {
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${font}:wght@400;600;700&display=swap`
        document.head.appendChild(link)
      }
    })
  }, [])

  // Injecter la couleur brand dans la page dès l'étape 3
  useEffect(() => {
    if (step !== 3) return
    const el = document.getElementById('signup-brand-style') ?? (() => {
      const s = document.createElement('style')
      s.id = 'signup-brand-style'
      document.head.appendChild(s)
      return s
    })()
    el.textContent = `
      .signup-brand-focus:focus { border-color: ${brandColorPrimary} !important; }
      .signup-brand-bar { background-color: ${brandColorPrimary} !important; }
      .signup-brand-btn { background-color: ${brandColorPrimary} !important; }
      .signup-brand-btn:hover { filter: brightness(0.9); }
    `
    return () => { document.getElementById('signup-brand-style')?.remove() }
  }, [brandColorPrimary, step])

  function canStep1() { return email.trim().length > 0 && password.length >= 8 }
  function canStep2() {
    return firstName.trim().length > 0 && lastName.trim().length > 0 && coachingType.length > 0 && acceptCgu && acceptPrivacy
  }

  // Étape 2 → valide le profil (le compte n'est créé qu'à l'étape 3)
  function handleStep2Next(e: React.FormEvent) {
    e.preventDefault()
    if (!canStep2()) return
    setError(null)
    setStep(3)
  }

  // Étape 3 → crée le compte AVEC le branding, puis connecte.
  // (Création repoussée ici : tant que l'onboarding n'est pas validé,
  //  aucun compte n'existe — un signup abandonné ne laisse rien derrière.)
  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email,
        password,
        coachingType,
        referralCode: referralCode.trim() || null,
        marketingConsent: acceptMarketing,
        cguAccepted: acceptCgu,
        privacyAccepted: acceptPrivacy,
        brandColorPrimary,
        brandColorAccent,
        brandFont,
        brandIcon: brandIcon.trim() || null,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      const msg = data.error ?? 'Une erreur est survenue. Réessayez.'
      // Email déjà utilisé → on renvoie à l'étape 1 corriger l'email
      if (/déjà|existe|already/i.test(msg)) { setError(msg); setStep(1); return }
      setError(msg)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Compte créé. Connectez-vous manuellement.')
      setLoading(false)
      return
    }

    if (referralCode.trim()) {
      toast.success('Code de parrainage appliqué ! +7 jours offerts (21j d\'essai total)')
    }

    setLoading(false)
    setStep(4)
  }

  // Étape 4 → génère le lien privé (sans email)
  async function handleGenerateLink() {
    if (!clientName.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientName.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Erreur lors de la génération.'); setLoading(false); return }
      setInviteLink(data.magicLink)
    } catch {
      setError('Erreur reseau.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleFinish() {
    if (!planParam || planParam === 'free') {
      // Rechargement complet pour que le middleware lise le cookie de session
      window.location.href = '/dashboard'
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey: planParam }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      toast.error(data.error ?? 'Impossible de créer la session de paiement. Réessayez.')
      setLoading(false)
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion et réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Barre de progression */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] text-[#64748B]">{STEP_LABELS[step - 1]}</p>
          <span className="text-[12px] text-[#94A3B8] font-medium">{step}/{totalSteps}</span>
        </div>
        <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 signup-brand-bar"
            style={{
              width: `${(step / totalSteps) * 100}%`,
              backgroundColor: step === 3 ? brandColorPrimary : '#4E9B6F',
            }}
          />
        </div>
      </div>

      {/* ─── Étape 1 : Email + Mot de passe ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required maxLength={254} placeholder="vous@exemple.com"
              className={inputCls} autoFocus
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={8} maxLength={128} placeholder="8 caracteres minimum"
              className={inputCls}
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-[11px] text-[#D4A853] mt-1.5">
                Encore {8 - password.length} caractere{8 - password.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {error && <ErrorBox>{error}</ErrorBox>}
          <button
            type="button"
            onClick={() => { if (canStep1()) { setStep(2); setError(null) } }}
            disabled={!canStep1()}
            className="w-full py-3 bg-[#0D1F3C] text-white text-[14px] font-semibold rounded-xl transition-all hover:bg-[#162847] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuer
          </button>
        </div>
      )}

      {/* ─── Étape 2 : Profil ─── */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Prénom</label>
              <input
                type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                required maxLength={40} placeholder="Marie" className={inputCls} autoFocus
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Nom</label>
              <input
                type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                required maxLength={40} placeholder="Dupont" className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Type de coaching</label>
            <select
              value={coachingType} onChange={e => setCoachingType(e.target.value)} required
              className={`${inputCls} appearance-none`}
            >
              <option value="" disabled>Selectionner...</option>
              {COACHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">
              Code de parrainage
              <span className="text-[11px] font-normal text-[#94A3B8] ml-2">(facultatif)</span>
            </label>
            <input
              type="text" value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="EV-XXXXXX" maxLength={12}
              className={`${inputCls} font-mono tracking-wider`}
            />
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" checked={acceptCgu} onChange={e => setAcceptCgu(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#4E9B6F] focus:ring-[#4E9B6F]/20 flex-shrink-0"
              />
              <span className="text-[12px] text-[#64748B] leading-relaxed">
                J'ai lu et j'accepte les{' '}
                <a href="/cgu" target="_blank" className="text-[#4E9B6F] underline">conditions générales d'utilisation</a>
                <span className="text-red-500 ml-0.5">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#4E9B6F] focus:ring-[#4E9B6F]/20 flex-shrink-0"
              />
              <span className="text-[12px] text-[#64748B] leading-relaxed">
                J'ai lu et j'accepte la{' '}
                <a href="/politique-confidentialite" target="_blank" className="text-[#4E9B6F] underline">politique de confidentialité</a>
                {' '}et le traitement de mes données conformément au RGPD
                <span className="text-red-500 ml-0.5">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" checked={acceptMarketing} onChange={e => setAcceptMarketing(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#4E9B6F] focus:ring-[#4E9B6F]/20 flex-shrink-0"
              />
              <span className="text-[12px] text-[#64748B] leading-relaxed">
                J'accepte de recevoir des conseils, actualités et offres d'Evolya par email
                <span className="text-[#9CA3AF] ml-1">(optionnel — résiliable à tout moment)</span>
              </span>
            </label>
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={() => { setStep(1); setError(null) }}
              className="px-5 py-3 border border-[#E2E8F0] text-[14px] font-medium text-[#64748B] rounded-xl hover:bg-[#F8FAFB] transition-colors"
            >
              Retour
            </button>
            <button
              type="submit" disabled={loading || !canStep2()}
              className="flex-1 py-3 bg-[#4E9B6F] text-white text-[14px] font-semibold rounded-xl transition-all hover:bg-[#3d8058] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner text="Creation..." /> : 'Continuer'}
            </button>
          </div>
        </form>
      )}

      {/* ─── Étape 3 : Personnalisation ─── */}
      {step === 3 && (
        <form onSubmit={handleSaveBranding} className="space-y-5">

          {/* Couleur principale */}
          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-3">Couleur principale</label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c} type="button" onClick={() => setBrandColorPrimary(c)}
                  className="w-8 h-8 rounded-lg transition-all duration-150"
                  style={{
                    backgroundColor: c,
                    outline: brandColorPrimary === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    transform: brandColorPrimary === c ? 'scale(1.18)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color" value={brandColorPrimary} onChange={e => setBrandColorPrimary(e.target.value)}
                className="w-8 h-8 rounded-md cursor-pointer border border-[#E2E8F0] p-0.5"
              />
              <input
                type="text" value={brandColorPrimary} onChange={e => setBrandColorPrimary(e.target.value)}
                maxLength={7} placeholder="#4E9B6F"
                className="w-28 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-mono text-[#0D1F3C] focus:outline-none focus:border-[#4E9B6F]"
              />
            </div>
          </div>

          {/* Couleur secondaire */}
          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-3">Couleur secondaire</label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c} type="button" onClick={() => setBrandColorAccent(c)}
                  className="w-8 h-8 rounded-lg transition-all duration-150"
                  style={{
                    backgroundColor: c,
                    outline: brandColorAccent === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    transform: brandColorAccent === c ? 'scale(1.18)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color" value={brandColorAccent} onChange={e => setBrandColorAccent(e.target.value)}
                className="w-8 h-8 rounded-md cursor-pointer border border-[#E2E8F0] p-0.5"
              />
              <input
                type="text" value={brandColorAccent} onChange={e => setBrandColorAccent(e.target.value)}
                maxLength={7} placeholder="#0D1F3C"
                className="w-28 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-mono text-[#0D1F3C] focus:outline-none focus:border-[#4E9B6F]"
              />
            </div>
          </div>

          {/* Police */}
          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Police</label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setBrandFont(f.value)}
                  className="px-4 py-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    fontFamily: f.value === 'Geist' ? 'inherit' : f.value,
                    borderColor: brandFont === f.value ? brandColorPrimary : '#E2E8F0',
                    backgroundColor: brandFont === f.value ? brandColorPrimary + '12' : '#F8FAFB',
                    color: brandFont === f.value ? brandColorPrimary : '#0D1F3C',
                  }}
                >
                  <span className="block text-[14px] font-semibold">{f.value}</span>
                  <span className="block text-[11px] opacity-60 mt-0.5" style={{ fontFamily: f.value === 'Geist' ? 'inherit' : f.value }}>
                    Aa Bb Cc 123
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Icone */}
          <div>
            <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">
              Icone / Emoji
              <span className="text-[11px] font-normal text-[#94A3B8] ml-2">(2 caracteres max — facultatif)</span>
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 select-none"
                style={{ backgroundColor: brandColorPrimary + '22', border: `2px solid ${brandColorPrimary}44` }}
              >
                {brandIcon
                  ? <span>{brandIcon}</span>
                  : <span style={{ color: brandColorPrimary, fontSize: 14, fontWeight: 700 }}>{firstName.slice(0, 1).toUpperCase() || 'E'}</span>
                }
              </div>
              <input
                type="text" value={brandIcon} onChange={e => setBrandIcon(e.target.value.slice(0, 2))}
                maxLength={2} placeholder="🏋 ou AB"
                className={`${inputCls} max-w-[140px]`}
              />
            </div>
          </div>

          {/* Aperçu */}
          <div className="rounded-xl border border-[#E2E8F0] p-4 bg-white">
            <p className="text-[10px] text-[#94A3B8] mb-2.5 uppercase tracking-widest font-semibold">Aperçu</p>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                style={{ backgroundColor: brandColorPrimary }}
              >
                {brandIcon || firstName.slice(0, 1).toUpperCase() || 'E'}
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight" style={{ color: brandColorAccent, fontFamily: brandFont }}>
                  {firstName || 'Prénom'} {lastName || 'Nom'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: brandColorPrimary }}>{coachingType || 'Type de coaching'}</p>
              </div>
            </div>
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 text-white text-[14px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed signup-brand-btn"
            style={{ backgroundColor: brandColorPrimary }}
          >
            {loading ? <Spinner text="Création du compte..." /> : 'Continuer'}
          </button>
        </form>
      )}

      {/* ─── Étape 4 : Premier client via lien privé ─── */}
      {step === 4 && (
        <div className="space-y-4">
          {!inviteLink ? (
            <>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                Générez un lien privé à partager directement avec votre premier client — par SMS, WhatsApp ou tout autre canal.
              </p>

              <div>
                <label className="block text-[13px] font-medium text-[#0D1F3C] mb-2">Nom du client</label>
                <input
                  type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  maxLength={60} placeholder="Thomas Martin" className={inputCls} autoFocus
                />
              </div>

              {error && <ErrorBox>{error}</ErrorBox>}

              <button
                type="button" onClick={handleGenerateLink}
                disabled={loading || !clientName.trim()}
                className="w-full py-3 bg-[#0D1F3C] text-white text-[14px] font-semibold rounded-xl transition-all hover:bg-[#162847] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner text="Génération..." /> : 'Générer le lien privé'}
              </button>

              <button
                type="button" onClick={handleFinish}
                className="w-full py-2 text-[13px] text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                Passer cette étape
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#EEF9F3] border border-[#4E9B6F]/25 rounded-xl p-4">
                <p className="text-[12px] font-semibold text-[#4E9B6F] mb-2">
                  Lien généré pour {clientName}
                </p>
                <p className="text-[11px] text-[#334155] font-mono break-all leading-relaxed bg-white rounded-lg px-3 py-2 border border-[#E2E8F0]">
                  {inviteLink}
                </p>
              </div>

              <button
                type="button" onClick={handleCopyLink}
                className="w-full py-3 border-2 border-[#4E9B6F] text-[14px] font-semibold text-[#4E9B6F] rounded-xl transition-all hover:bg-[#EEF9F3]"
              >
                {linkCopied ? 'Copié !' : 'Copier le lien'}
              </button>

              <button
                type="button" onClick={handleFinish} disabled={loading}
                className="w-full py-3 bg-[#4E9B6F] text-white text-[14px] font-semibold rounded-xl transition-all hover:bg-[#3d8058] disabled:opacity-40"
              >
                {loading
                  ? <Spinner text="Redirection..." />
                  : planParam && planParam !== 'free'
                    ? 'Choisir mon plan'
                    : 'Accéder à mon interface'
                }
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
      <p className="text-[13px] text-red-700">{children}</p>
    </div>
  )
}

function Spinner({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      {text}
    </span>
  )
}
