'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'hours' | 'billing' | 'price' | 'results'
type BillingType = 'session' | 'other'

// ── Constants ─────────────────────────────────────────────────────────────────
const QUICK_HOURS = [1, 2, 4, 6, 8]
const QUICK_PRICES = [50, 70, 100, 120, 150]
const WD_WEEK = 5
const WD_MONTH = 22
const WD_YEAR = 220

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

function fmtEur(n: number): string {
  return fmt(Math.round(n / 100) * 100) + ' €'
}

function fullDaysText(hYear: number): string {
  const d = Math.round(hYear / 8)
  if (d <= 20) return `soit ${d} jours de travail par an`
  if (d <= 35) return `soit près d'un mois entier de travail par an`
  if (d <= 55) return `soit l'équivalent de presque 2 mois de travail par an`
  if (d <= 72) return `soit plus de 2 mois et demi de travail par an`
  return `soit plus de 3 mois de travail par an`
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RealiteCheck() {
  const [step, setStep] = useState<Step>('hours')
  const [hours, setHours] = useState(2)
  const [billing, setBilling] = useState<BillingType | null>(null)
  const [price, setPrice] = useState(70)
  const [transitioning, setTransitioning] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Count-up display values
  const [countH, setCountH] = useState(0)
  const [countS, setCountS] = useState(0)
  const [countRM, setCountRM] = useState(0)
  const rafRef = useRef<number>()

  // ── Calculations ─────────────────────────────────────────────────────────────
  const hWeek  = hours * WD_WEEK
  const hMonth = hours * WD_MONTH
  const hYear  = hours * WD_YEAR
  const sMonth = Math.round(hMonth / 2)
  const sYear  = Math.round(hYear / 2)
  const rMonth = Math.round(sMonth * price)
  const rYear  = Math.round(sYear * price)

  const recoveryH = Math.min(hours, 3)
  const recoveryS = Math.round(recoveryH * WD_YEAR / 2)
  const recoveryR = Math.round(recoveryS * price)

  // Operational load label (Case B)
  const opLoad =
    hours <= 2 ? { label: 'Charge modérée',          sub: 'Gérable, mais chaque heure compte.',           color: '#D97706' } :
    hours <= 4 ? { label: 'Charge élevée',            sub: 'Ta croissance commence à en pâtir.',           color: '#EA580C' } :
    hours <= 6 ? { label: 'Limite de croissance',     sub: 'Ton système freine ton potentiel.',            color: '#DC2626' } :
                 { label: 'Dépendance opéra.',        sub: 'Trop de manuel, pas assez de levier.',         color: '#B91C1C' }

  // ── Step transition ───────────────────────────────────────────────────────────
  function goTo(next: Step) {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setStep(next)
      setTransitioning(false)
      if (next === 'results') {
        setShowResults(false)
        setTimeout(() => setShowResults(true), 60)
      } else {
        setShowResults(false)
      }
    }, 160)
  }

  // ── Count-up animation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showResults) {
      setCountH(0); setCountS(0); setCountRM(0)
      return
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const duration = 950
    const startTime = performance.now()

    function animate(now: number) {
      const p = Math.min((now - startTime) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setCountH(Math.round(hYear  * e))
      setCountS(Math.round(sYear  * e))
      setCountRM(Math.round(rMonth * e))
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [showResults, hYear, sYear, rMonth])

  function reset() {
    setShowResults(false)
    setTransitioning(true)
    setTimeout(() => {
      setStep('hours')
      setBilling(null)
      setHours(2)
      setPrice(70)
      setTransitioning(false)
    }, 160)
  }

  const progressPct =
    step === 'hours'   ? 0   :
    step === 'billing' ? 40  :
    step === 'price'   ? 70  : 100

  return (
    <section className="py-24 px-4 sm:px-6 bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto">

        {/* ── Header centré ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[10px] font-bold px-3 py-1.5 rounded-full mb-5 tracking-[0.12em] uppercase">
            Ce qui bloque ta croissance
          </div>
          <h2 className="text-[28px] sm:text-[36px] md:text-[42px] font-bold text-[#0D1F3C] tracking-[-0.025em] leading-[1.08] mb-4">
            Quand le système ne suit plus,<br className="hidden sm:block" /> c&apos;est ton temps qui disparaît.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#6B7280] leading-relaxed max-w-lg mx-auto">
            À partir d&apos;un certain volume d&apos;membres, la gestion prend le dessus sur le coaching. Chaque heure perdue sur un système qui casse est une heure qui t&apos;empêche de passer à +30 membres.
          </p>
        </div>

        {/* ── Calculateur centré ── */}
        <div className="w-full">
            <div
              className="rounded-2xl overflow-hidden bg-white border border-[#E5E7EB]"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)' }}
            >

              {/* Progress bar */}
              <div className="h-[3px]" style={{ background: '#F3F4F6' }}>
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct === 100 ? '#4E9B6F' : '#0D1F3C',
                  }}
                />
              </div>

              {/* Content with fade */}
              <div
                style={{
                  opacity:    transitioning ? 0 : 1,
                  transform:  transitioning ? 'translateY(5px)' : 'translateY(0)',
                  transition: 'opacity 0.16s ease, transform 0.16s ease',
                }}
              >

                {/* ══ STEP 1 — HOURS ══════════════════════════════════════════ */}
                {step === 'hours' && (
                  <div className="p-5 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Question 1 / 2</span>
                    </div>
                    <p className="text-[13px] mb-4" style={{ color: '#9CA3AF' }}>
                      Réponds à 2 questions pour voir l&apos;impact réel sur ton activité.
                    </p>

                    <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0D1F3C] leading-snug mb-4">
                      Combien d&apos;heures par jour passes-tu à gérer ton activité&nbsp;?
                    </h3>

                    {/* Big live number */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-bold text-[#0D1F3C] leading-none tabular-nums" style={{ fontSize: 'clamp(44px, 10vw, 56px)' }}>
                        {hours % 1 === 0 ? hours : hours.toFixed(1)}
                      </span>
                      <span className="text-[16px] font-medium pb-1" style={{ color: '#9CA3AF' }}>
                        heure{hours > 1 ? 's' : ''}&nbsp;/ jour
                      </span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range" min={0.5} max={8} step={0.5}
                      value={hours}
                      onChange={e => setHours(parseFloat(e.target.value))}
                      className="w-full mb-3 cursor-pointer"
                      style={{ accentColor: '#4E9B6F', height: 4 }}
                    />

                    {/* Quick values */}
                    <div className="flex gap-1.5 mb-5">
                      {QUICK_HOURS.map(h => (
                        <button
                          key={h}
                          onClick={() => setHours(h)}
                          className="flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-all duration-150"
                          style={{
                            background:   hours === h ? '#0D1F3C' : 'transparent',
                            color:        hours === h ? '#fff'    : '#9CA3AF',
                            borderColor:  hours === h ? '#0D1F3C' : '#E5E7EB',
                          }}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => goTo('billing')}
                      className="w-full py-3 bg-[#4E9B6F] text-white rounded-xl text-[14px] font-semibold hover:bg-[#3D8A60] transition-colors flex items-center justify-center gap-2"
                    >
                      Voir mon impact
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}

                {/* ══ STEP 2 — BILLING ════════════════════════════════════════ */}
                {step === 'billing' && (
                  <div className="p-5 sm:p-6 relative">
                    <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Question 2 / 2</span>

                    <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0D1F3C] leading-snug mt-4 mb-1.5">
                      Comment factures-tu tes séances&nbsp;?
                    </h3>
                    <p className="text-[12px] mb-5" style={{ color: '#9CA3AF' }}>
                      {hours % 1 === 0 ? hours : hours.toFixed(1)}h&nbsp;/ jour ={' '}
                      <span className="font-semibold text-[#0D1F3C]">{hWeek}h perdues cette semaine</span>
                    </p>

                    <div className="space-y-2.5 mb-5">
                      {[
                        { type: 'session' as BillingType, emoji: '💰', title: 'Par séance',               sub: 'Je facture un tarif fixe par session' },
                        { type: 'other'   as BillingType, emoji: '📊', title: 'Pas par séance',            sub: 'Forfait, abonnement mensuel…' },
                      ].map(opt => (
                        <button
                          key={opt.type}
                          onClick={() => { setBilling(opt.type); goTo(opt.type === 'session' ? 'price' : 'results') }}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 hover:border-[#0D1F3C] hover:bg-[#FAFAFA]"
                          style={{
                            borderColor: '#E5E7EB',
                            background: 'transparent',
                          }}
                        >
                          <span className="text-[20px] shrink-0">{opt.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#0D1F3C]">{opt.title}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{opt.sub}</p>
                          </div>
                          <svg style={{ color: '#9CA3AF' }} width="14" height="14" viewBox="0 0 15 15" fill="none">
                            <path d="M5.5 3l4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      ))}
                    </div>

                    <button onClick={() => goTo('hours')} className="text-[13px] transition-colors" style={{ color: '#6B7280' }}>
                      ← Modifier mes heures
                    </button>
                  </div>
                )}

                {/* ══ STEP 3 — PRICE ══════════════════════════════════════════ */}
                {step === 'price' && (
                  <div className="p-5 sm:p-6 relative">
                    <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Dernière étape</span>

                    <h3 className="text-[15px] sm:text-[17px] font-bold text-[#0D1F3C] leading-snug mt-4 mb-1">
                      Quel est ton tarif moyen par séance&nbsp;?
                    </h3>
                    <p className="text-[12px] mb-4" style={{ color: '#9CA3AF' }}>1 séance = 2 heures de coaching</p>

                    {/* Price big display */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-bold text-[#0D1F3C] leading-none tabular-nums" style={{ fontSize: 'clamp(44px, 10vw, 56px)' }}>
                        {price}
                      </span>
                      <span className="text-[22px] font-bold" style={{ color: '#9CA3AF' }}>€</span>
                    </div>
                    <input
                      type="range" min={30} max={200} step={5}
                      value={price}
                      onChange={e => setPrice(parseInt(e.target.value))}
                      className="w-full cursor-pointer mb-1"
                      style={{ accentColor: '#4E9B6F', height: 4 }}
                    />
                    <div className="flex justify-between text-[11px] mt-1 mb-4" style={{ color: '#9CA3AF' }}>
                      <span>30 €</span><span>200 €</span>
                    </div>

                    {/* Quick prices */}
                    <div className="flex gap-1.5 mb-5">
                      {QUICK_PRICES.map(p => (
                        <button
                          key={p}
                          onClick={() => setPrice(p)}
                          className="flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-all duration-150"
                          style={{
                            background:  price === p ? '#0D1F3C' : 'transparent',
                            color:       price === p ? '#fff'    : '#9CA3AF',
                            borderColor: price === p ? '#0D1F3C' : '#E5E7EB',
                          }}
                        >
                          {p}€
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => goTo('results')}
                      className="w-full py-3 bg-[#4E9B6F] text-white rounded-xl text-[14px] font-semibold hover:bg-[#3D8A60] transition-colors flex items-center justify-center gap-2"
                    >
                      Révéler ma perte réelle
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => goTo('billing')} className="w-full text-center text-[13px] transition-colors mt-2.5" style={{ color: '#6B7280' }}>
                      ← Retour
                    </button>
                  </div>
                )}

                {/* ══ STEP 4 — RESULTS ════════════════════════════════════════ */}
                {step === 'results' && (
                  <div
                    className="p-5 sm:p-6 relative"
                    style={{
                      opacity:    showResults ? 1 : 0,
                      transform:  showResults ? 'none' : 'translateY(8px)',
                      transition: 'opacity 0.4s ease, transform 0.4s ease',
                    }}
                  >

                    {billing === 'session' ? (
                      /* ─── CASE A — Revenue ──────────────────────────────── */
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-[12px] font-bold text-[#EF4444] uppercase tracking-[0.12em]">Ce que tu perds actuellement</span>
                            <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
                              {hours % 1 === 0 ? hours : hours.toFixed(1)}h / jour · {price} € / séance
                            </p>
                          </div>
                          <button
                            onClick={reset}
                            className="text-[12px] border px-2.5 py-1 rounded-lg transition-colors shrink-0 ml-3"
                            style={{ color: '#6B7280', borderColor: '#E5E7EB' }}
                          >
                            Recalculer
                          </button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { label: 'Temps perdu',    value: fmt(countH),  unit: 'h/an',  sub: `${hWeek}h par semaine`,      color: '#0D1F3C' },
                            { label: 'Séances perdues', value: fmt(countS),  unit: '/an',   sub: `${sMonth} par mois`,         color: '#0D1F3C' },
                            { label: 'Revenus perdus', value: fmt(countRM), unit: '€/mois', sub: `${fmtEur(rYear)} par an`,   color: '#EF4444' },
                          ].map(({ label, value, unit, sub, color }) => (
                            <div key={label} className="rounded-xl p-3 bg-[#F8FAFB] border border-[#E5E7EB]">
                              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>{label}</p>
                              <div className="flex items-baseline gap-1 leading-none mb-1">
                                <span className="text-[26px] font-bold tabular-nums" style={{ color }}>{value}</span>
                                <span className="text-[12px] font-medium" style={{ color: '#6B7280' }}>{unit}</span>
                              </div>
                              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{sub}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-[13px] mb-3 leading-relaxed" style={{ color: '#6B7280' }}>
                          {fullDaysText(hYear)} — tu laisses partir environ{' '}
                          <strong className="text-[#0D1F3C]">{fmtEur(rYear)}</strong>
                          {' '}sans t&apos;en rendre compte.
                        </p>

                        {/* Revelation */}
                        <div className="rounded-xl p-4 mb-4 bg-[#0D1F3C]">
                          <p className="text-[12px] font-bold text-white mb-0.5">Ce n&apos;est pas un problème de temps.</p>
                          <p className="text-[12px] font-bold text-[#4E9B6F] mb-3">C&apos;est un problème de système.</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {["Passer à +30 membres sans t'épuiser", "2 à 3h de coaching récupérées / jour", "Zéro check-in oublié, zéro relance manquée", "Un système qui suit ton volume, pas l'inverse", "Moins de gestion, plus de coaching"].map(item => (
                              <div key={item} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#4E9B6F] shrink-0" />
                                <p className="text-[12px] text-white/85">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Link
                          href="/auth/signup"
                          className="w-full flex items-center justify-center gap-2 py-3 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3D7A5F] transition-colors"
                        >
                          Récupérer {fmt(3 * WD_YEAR)}h et jusqu&apos;à {fmtEur(recoveryR)} / an
                          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                            <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </>
                    ) : (
                      /* ─── CASE B — Time only ────────────────────────────── */
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-[12px] font-bold text-[#D97706] uppercase tracking-[0.12em]">Ton coût réel aujourd&apos;hui</span>
                            <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
                              {hours % 1 === 0 ? hours : hours.toFixed(1)}h / jour en gestion
                            </p>
                          </div>
                          <button
                            onClick={reset}
                            className="text-[12px] border px-2.5 py-1 rounded-lg transition-colors shrink-0 ml-3"
                            style={{ color: '#6B7280', borderColor: '#E5E7EB' }}
                          >
                            Recalculer
                          </button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="rounded-xl p-3 bg-[#F8FAFB] border border-[#E5E7EB]">
                            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Temps perdu</p>
                            <div className="flex items-baseline gap-1 leading-none mb-1">
                              <span className="text-[26px] font-bold text-[#0D1F3C] tabular-nums">{fmt(countH)}</span>
                              <span className="text-[12px] font-medium" style={{ color: '#6B7280' }}>h/an</span>
                            </div>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{hWeek}h par semaine</p>
                          </div>

                          <div className="rounded-xl p-3 bg-[#F8FAFB] border border-[#E5E7EB]">
                            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Séances perdues</p>
                            <div className="flex items-baseline gap-1 leading-none mb-1">
                              <span className="text-[26px] font-bold text-[#0D1F3C] tabular-nums">{fmt(countS)}</span>
                              <span className="text-[12px] font-medium" style={{ color: '#6B7280' }}>/an</span>
                            </div>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>non exploitées</p>
                          </div>

                          <div className="rounded-xl p-3 bg-[#F8FAFB] border border-[#E5E7EB]">
                            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Charge opé.</p>
                            <p className="text-[15px] font-bold leading-tight mb-1" style={{ color: opLoad.color }}>{opLoad.label}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{opLoad.sub}</p>
                          </div>
                        </div>

                        <p className="text-[13px] mb-3 leading-relaxed" style={{ color: '#6B7280' }}>
                          Tu pourrais récupérer l&apos;équivalent de{' '}
                          <strong className="text-[#0D1F3C]">{recoveryS} séances</strong>{' '}
                          de coaching par an.
                        </p>

                        {/* Revelation */}
                        <div className="rounded-xl p-4 mb-4 bg-[#0D1F3C]">
                          <p className="text-[12px] font-bold text-white mb-0.5">Ce n&apos;est pas un problème de temps.</p>
                          <p className="text-[12px] font-bold text-[#4E9B6F] mb-3">C&apos;est un problème de système.</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {["Passer à +30 membres sans t'épuiser", "2 à 3h de coaching récupérées / jour", "Zéro check-in oublié, zéro relance manquée", "Un système qui suit ton volume, pas l'inverse", "Moins de gestion, plus de coaching"].map(item => (
                              <div key={item} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#4E9B6F] shrink-0" />
                                <p className="text-[12px] text-white/85">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Link
                          href="/auth/signup"
                          className="w-full flex items-center justify-center gap-2 py-3 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3D7A5F] transition-colors"
                        >
                          Récupérer {fmt(3 * WD_YEAR)}h de temps exploitable / an
                          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                            <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>

            <p className="text-[12px] text-[#9CA3AF] mt-4 text-center">
              Simulation estimative basée sur ton rythme actuel.
            </p>
        </div>

      </div>
    </section>
  )
}
