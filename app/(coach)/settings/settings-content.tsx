'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getPlanLabel, formatDate, getDaysUntil } from '@/lib/utils'
import type { Profile } from '@/types/database'

// ── Modale suppression compte ──────────────────────────────────────────────
function DeleteAccountModal({
  profile,
  onClose,
}: {
  profile: Profile
  onClose: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  const trialDaysLeft = profile.trial_ends_at ? getDaysUntil(profile.trial_ends_at) : 0
  const isOnTrial = profile.plan_status === 'trial' && trialDaysLeft > 0
  const isOnPaidPlan = profile.plan_status === 'active' && !!profile.stripe_subscription_id

  async function handleDelete() {
    if (!confirmed || confirmEmail !== profile.email) return
    setLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la suppression.')
        setLoading(false)
        return
      }
      // Déconnexion + redirection
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login?deleted=1')
    } catch {
      toast.error('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* ─── Étape 1 : Avertissement ─────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="p-6 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L16.5 15H1.5L9 2z" stroke="#DC2626" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M9 7v4M9 13v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="text-[17px] font-semibold text-[#0D1F3C]">Supprimer votre compte ?</h2>
              </div>
              <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                Cette action est <strong className="text-[#DC2626]">irréversible</strong>. Voici ce qui sera définitivement effacé :
              </p>
            </div>

            <div className="px-6 py-4 space-y-2">
              {[
                'Votre profil coach et toutes vos informations',
                'Tous vos clients et leurs données (mesures, check-ins, objectifs)',
                'Tous vos programmes et séances',
                'Tous vos messages et échanges',
                'Vos statistiques et historiques',
                'Votre abonnement Stripe sera résilié immédiatement',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[13px] text-[#374151]">{item}</span>
                </div>
              ))}

              {isOnTrial && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-[13px] font-medium text-amber-800">
                    Il vous reste <strong>{trialDaysLeft} jours</strong> d'essai gratuit — vous pouvez continuer sans rien payer.
                  </p>
                </div>
              )}
              {isOnPaidPlan && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-[13px] font-medium text-amber-800">
                    Votre abonnement en cours sera résilié <strong>sans remboursement</strong> de la période restante.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2.5">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#4E9B6F] text-white text-sm font-semibold rounded-xl hover:bg-[#3D7A5F] transition-colors"
              >
                Non, garder mon compte
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 text-sm font-medium text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                Continuer quand même
              </button>
            </div>
          </>
        )}

        {/* ─── Étape 2 : Alternatives ──────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="p-6 border-b border-[#F1F5F9]">
              <h2 className="text-[17px] font-semibold text-[#0D1F3C]">Avant de partir…</h2>
              <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
                Avez-vous considéré ces alternatives plutôt que de supprimer votre compte ?
              </p>
            </div>

            <div className="px-6 py-4 space-y-3">
              {isOnPaidPlan && (
                <div className="border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">Passer au plan gratuit</p>
                  <p className="text-[12px] text-[#64748B] mb-3">
                    Conservez votre compte et vos données — sans payer. Vous pouvez reprendre un plan payant quand vous voulez.
                  </p>
                  <a
                    href="/plans"
                    className="inline-block px-3 py-1.5 bg-[#F0FAF4] text-[#4E9B6F] text-[12px] font-semibold rounded-lg hover:bg-[#D5F0E2] transition-colors"
                  >
                    Voir les plans
                  </a>
                </div>
              )}

              <div className="border border-[#E2E8F0] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">Mettre en pause votre activité</p>
                <p className="text-[12px] text-[#64748B]">
                  Archivez vos clients et désactivez les notifications — vos données restent intactes et vous reprenez quand vous voulez.
                </p>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-[#0D1F3C] mb-1">Un problème à régler ?</p>
                <p className="text-[12px] text-[#64748B] mb-2">
                  Notre équipe peut vous aider si vous rencontrez des difficultés.
                </p>
                <a
                  href="mailto:contact@evolya.fr"
                  className="inline-block text-[12px] font-medium text-[#4E9B6F] hover:underline"
                >
                  contact@evolya.fr
                </a>
              </div>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2.5">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#4E9B6F] text-white text-sm font-semibold rounded-xl hover:bg-[#3D7A5F] transition-colors"
              >
                Rester sur Evolya
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full py-2.5 text-sm font-medium text-[#DC2626] hover:text-red-700 transition-colors"
              >
                Non, je veux supprimer définitivement
              </button>
            </div>
          </>
        )}

        {/* ─── Étape 3 : Confirmation finale ───────────────────────── */}
        {step === 3 && (
          <>
            <div className="p-6 border-b border-red-100 bg-red-50/40">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 5v4M8 11v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="text-[17px] font-semibold text-[#DC2626]">Confirmation finale</h2>
              </div>
              <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                Tapez votre adresse email pour confirmer la suppression définitive de votre compte.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">
                  Votre adresse email
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={profile.email ?? ''}
                  className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-red-400 transition-colors"
                  autoFocus
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] accent-red-600"
                />
                <span className="text-[12px] text-[#64748B] leading-relaxed">
                  Je comprends que cette suppression est <strong className="text-[#374151]">irréversible</strong> et que toutes mes données seront définitivement effacées.
                </span>
              </label>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2.5">
              <button
                onClick={handleDelete}
                disabled={loading || confirmEmail !== profile.email || !confirmed}
                className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Suppression en cours…
                  </>
                ) : 'Supprimer définitivement mon compte'}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium text-[#64748B] hover:text-[#374151] transition-colors disabled:opacity-40"
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}



type Props = { profile: Profile }

export function SettingsContent({ profile }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [coachingType, setCoachingType] = useState(profile.coaching_type ?? '')
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resyncLoading, setResyncLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [inactivityThreshold, setInactivityThreshold] = useState(profile.inactivity_threshold_days ?? 7)
  const [savingAutomation, setSavingAutomation] = useState(false)

  const isActive = profile.plan_status === 'active' && profile.plan !== 'trial'
  const trialDaysLeft = profile.trial_ends_at ? getDaysUntil(profile.trial_ends_at) : 0
  const referralCode = profile.referral_code
  const referralCount = profile.referral_count ?? 0
  const referralDiscountPending = profile.referral_discount_pending ?? false
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const referralLink = referralCode ? `${appUrl}/auth/signup?ref=${referralCode}` : null

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, coaching_type: coachingType })
      .eq('id', profile.id)
    setSaving(false)
    if (error) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Profil mis à jour avec succès.')
    router.refresh()
  }

  async function handleManageSubscription() {
    if (!isActive) return
    setPortalLoading(true)
    try {
      // Le portal redirige côté serveur, on navigue vers l'URL
      window.location.href = '/api/stripe/portal'
    } catch {
      toast.error("Erreur lors de l'ouverture du portail.")
      setPortalLoading(false)
    }
  }

  async function handleResync() {
    setResyncLoading(true)
    try {
      const res = await fetch('/api/stripe/resync', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(`Plan ${data.plan} synchronisé — ${data.client_limit === 9999 ? 'illimité' : data.client_limit + ' clients'}`)
        router.refresh()
      }
    } catch {
      toast.error('Erreur lors de la synchronisation.')
    } finally {
      setResyncLoading(false)
    }
  }

  async function handleSaveAutomation() {
    setSavingAutomation(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ inactivity_threshold_days: inactivityThreshold })
      .eq('id', profile.id)
    setSavingAutomation(false)
    if (error) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Seuil d\'inactivité mis à jour.')
    router.refresh()
  }

  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) { toast.error('Erreur lors de l\'export.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evolya-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé.')
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setExportLoading(false)
    }
  }

  async function handleCopyReferral() {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Lien de parrainage copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex-1 px-4 sm:px-8 pt-6 pb-24 sm:py-8 max-w-2xl w-full mx-auto space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#0D1F3C]">⚙️ Paramètres</h1>

      {/* ── Profil ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0D1F3C] mb-5">👤 Profil coach</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Nom complet</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Type de coaching</label>
            <input
              type="text" value={coachingType} onChange={(e) => setCoachingType(e.target.value)}
              placeholder="Ex : Coach musculation, Préparateur physique..."
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D1F3C] mb-1.5">Email</label>
            <input
              type="email" value={profile.email ?? ''} disabled
              className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm text-[#94A3B8] cursor-not-allowed"
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full sm:w-auto px-4 py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </form>
      </section>

      {/* ── Abonnement ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0D1F3C] mb-5">💳 Abonnement</h2>

        <div className="space-y-0 mb-5 divide-y divide-[#E2E8F0]">
          <div className="flex items-center justify-between py-3 gap-3">
            <span className="text-sm text-[#64748B]">Plan actuel</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#0D1F3C]">{getPlanLabel(profile.plan)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                profile.plan_status === 'trial'     ? 'bg-[#D4A853]/10 text-[#D4A853]' :
                profile.plan_status === 'active'    ? 'bg-[#4E9B6F]/10 text-[#4E9B6F]' :
                profile.plan_status === 'cancelled' ? 'bg-[#94A3B8]/20 text-[#64748B]' :
                'bg-red-50 text-red-600'
              }`}>
                {profile.plan_status === 'trial'     ? 'En essai' :
                 profile.plan_status === 'active'    ? 'Actif' :
                 profile.plan_status === 'cancelled' ? 'Annulé' : 'En attente'}
              </span>
            </div>
          </div>

          {profile.plan_status === 'trial' && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#64748B]">Fin d'essai</span>
              <span className="text-sm font-medium text-[#0D1F3C]">
                {profile.trial_ends_at ? formatDate(profile.trial_ends_at) : '—'}
                {trialDaysLeft > 0 && (
                  <span className="text-[#D4A853] ml-2 text-xs">({trialDaysLeft} jours restants)</span>
                )}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-[#64748B]">Limite clients</span>
            <span className="text-sm font-medium text-[#0D1F3C]">
              {profile.client_limit === 9999 ? 'Illimité' : `${profile.client_limit} membres`}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isActive ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full sm:w-auto px-4 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9] text-sm text-[#0D1F3C] font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {portalLoading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#94A3B8] border-t-transparent rounded-full animate-spin" />
                  Ouverture...
                </>
              ) : 'Gérer mon abonnement →'}
            </button>
          ) : (
            <a
              href="/plans"
              className="w-full sm:w-auto text-center px-4 py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors"
            >
              Choisir un plan →
            </a>
          )}
          <button
            onClick={handleResync}
            disabled={resyncLoading}
            className="w-full sm:w-auto px-4 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9] text-sm text-[#64748B] font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {resyncLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-[#94A3B8] border-t-transparent rounded-full animate-spin" />
                Synchronisation...
              </>
            ) : 'Synchroniser le plan'}
          </button>
        </div>
      </section>

      {/* ── Automatisations ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0D1F3C] mb-1">⚡ Automatisations</h2>
        <p className="text-sm text-[#64748B] mb-5 leading-relaxed">
          Evolya surveille l&apos;activité de tes membres et t&apos;alerte automatiquement sur le tableau de bord quand quelqu&apos;un décroche.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0D1F3C] mb-1">
              Seuil d&apos;inactivité (check-in)
            </label>
            <p className="text-xs text-[#94A3B8] mb-2.5">
              Si un membre n&apos;a pas soumis de check-in depuis X jours, une alerte s&apos;affiche sur ton tableau de bord avec un bouton Relancer en 1 clic.
            </p>
            <select
              value={inactivityThreshold}
              onChange={e => setInactivityThreshold(Number(e.target.value))}
              className="w-full sm:w-auto px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors"
            >
              {[3, 5, 7, 14, 30].map(d => (
                <option key={d} value={d}>{d} jours{d === 7 ? ' (défaut)' : ''}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveAutomation}
            disabled={savingAutomation}
            className="w-full sm:w-auto px-4 py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {savingAutomation ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </section>

      {/* ── Parrainage ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 sm:p-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-base font-semibold text-[#0D1F3C]">🎁 Parrainage</h2>
          {referralCount > 0 && (
            <span className="text-xs bg-[#4E9B6F]/10 text-[#4E9B6F] px-2.5 py-1 rounded-full font-medium">
              {referralCount} filleul{referralCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-[#64748B] mb-4">
          La personne qui utilise votre code reçoit{' '}
          <span className="font-medium text-[#0D1F3C]">+7 jours offerts</span> (21j d&apos;essai total).
          Vous obtenez{' '}
          <span className="font-medium text-[#0D1F3C]">1 mois offert</span> dès que votre filleul souscrit à un plan payant.
        </p>

        {referralDiscountPending && (
          <div className="mb-4 bg-[#4E9B6F]/8 border border-[#4E9B6F]/30 rounded-lg px-4 py-3 flex items-center gap-2.5">
            <span className="text-lg">🎁</span>
            <p className="text-sm font-medium text-[#4E9B6F]">
              1 mois offert en attente — sera appliqué automatiquement à votre prochain abonnement.
            </p>
          </div>
        )}

        {referralCode ? (
          <div className="space-y-3">
            {/* Code */}
            <div>
              <p className="text-xs font-medium text-[#64748B] mb-1.5">Votre code</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-semibold text-[#0D1F3C] tracking-widest bg-[#F1F5F9] px-4 py-2 rounded-lg">
                  {referralCode}
                </span>
              </div>
            </div>

            {/* Lien */}
            <div>
              <p className="text-xs font-medium text-[#64748B] mb-1.5">Lien d'invitation</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink ?? ''}
                  className="flex-1 px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B] font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyReferral}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    copied
                      ? 'bg-[#4E9B6F] text-white'
                      : 'border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0D1F3C]'
                  }`}
                >
                  {copied ? '✓ Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Stats */}
            {referralCount > 0 && (
              <div className="bg-[#4E9B6F]/5 border border-[#4E9B6F]/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-medium text-[#0D1F3C]">
                    {referralCount} coach{referralCount > 1 ? 's' : ''} inscrit{referralCount > 1 ? 's' : ''} via votre code
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {referralCount} mois offert{referralCount > 1 ? 's' : ''} gagné{referralCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#F1F5F9] rounded-lg px-4 py-3 text-sm text-[#64748B]">
            Votre code de parrainage est en cours de génération…
          </div>
        )}
      </section>

      {/* ── Données personnelles (RGPD) ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0D1F3C] mb-1">Mes données (RGPD)</h2>
        <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
          Conformément aux Art. 15 et 20 du RGPD, vous pouvez télécharger l'intégralité de vos données personnelles dans un format structuré (JSON).
        </p>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="px-4 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9] text-sm text-[#0D1F3C] font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {exportLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-[#94A3B8] border-t-transparent rounded-full animate-spin" />
              Préparation...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Exporter mes données
            </>
          )}
        </button>
      </section>

      {/* ── Zone dangereuse ── */}
      <section className="border border-red-200 bg-red-50/30 rounded-lg p-5 sm:p-6">
        <h2 className="text-base font-semibold text-red-700 mb-1">Zone dangereuse</h2>
        <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
          La suppression de votre compte est <strong className="text-[#374151]">définitive et irréversible</strong>. Toutes vos données seront effacées conformément au RGPD (Art. 17 — droit à l'effacement).
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors"
        >
          Supprimer mon compte
        </button>
      </section>

      {showDeleteModal && (
        <DeleteAccountModal
          profile={profile}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </main>
  )
}

