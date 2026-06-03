'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const NumberFlow = dynamic(() => import('@number-flow/react'), { ssr: false })

/* ─── Données ─────────────────────────────────────────── */

const ANNUAL_DISCOUNT = 0.2

const PLANS = [
  {
    id: 'decouverte',
    name: 'Découverte',
    tagline: 'Pour démarrer, gratuitement',
    priceMonthly: 0,
    isFree: true,
    cta: 'Commencer gratuitement',
    footnote: 'Aucune carte bancaire requise · Résiliable à tout moment',
    content: [
      '1 membre maximum',
      '100 exercices de bibliothèque',
      "10 générations IA d'exercices",
      '1 génération de programme',
    ],
  },
  {
    id: 'lancement',
    name: 'Lancement',
    tagline: 'Lancez votre activité de coach',
    priceMonthly: 19,
    isFree: false,
    cta: 'Commencer',
    footnote: 'Essai gratuit 14 jours · Sans carte bancaire',
    content: [
      '10 membres maximum',
      '500 exercices de bibliothèque',
      "150 générations IA d'exercices / mois",
      '100 générations de programmes',
    ],
  },
  {
    id: 'croissance',
    name: 'Croissance',
    tagline: 'Pour faire grandir votre clientèle',
    priceMonthly: 29,
    isFree: false,
    recommended: true,
    cta: 'Commencer',
    footnote: 'Essai gratuit 14 jours · Sans carte bancaire',
    content: [
      '25 membres maximum',
      '1 000 exercices de bibliothèque',
      "300 générations IA d'exercices / mois",
      '200 générations de programmes',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Aucune limite, tout inclus',
    priceMonthly: 49,
    isFree: false,
    cta: 'Commencer',
    footnote: 'Essai gratuit 14 jours · Sans carte bancaire',
    content: [
      '45 membres maximum',
      'Exercices de bibliothèque illimités',
      "Générations IA d'exercices illimitées",
      'Générations de programmes illimitées',
    ],
  },
]

const CATEGORIES = [
  {
    name: 'Elève & contenu',
    features: [
      { label: 'Elève maximum', values: ['1', '10', '25', '45'] },
      { label: 'Exercices de bibliothèque', values: ['100', '500', '1 000', 'Illimités'] },
      { label: "Générations IA d'exercices", values: ['10 / mois', '150 / mois', '300 / mois', 'Illimitées'] },
      { label: 'Générations de programmes', values: ['1', '100', '200', 'Illimitées'] },
    ],
  },
  {
    name: 'Coaching & séances',
    features: [
      { label: 'Agenda intégré', values: [true, true, true, true] },
      { label: 'Chrono & validation de séance', values: [true, true, true, true] },
      { label: 'Notes de séance', values: [false, true, true, true] },
      { label: 'Check-in hebdomadaire', values: [true, true, true, true] },
      { label: 'Suivi des séances en direct', values: [false, true, true, true] },
      { label: 'Rappels automatiques de check-in', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Suivi des progrès',
    features: [
      { label: 'Suivi du poids', values: [true, true, true, true] },
      { label: 'Suivi sportif', values: [true, true, true, true] },
      { label: 'Suivi nutritionnel', values: [true, true, true, true] },
      { label: 'Statistiques de performance & PR', values: [false, true, true, true] },
      { label: 'Suivi des mensurations', values: [false, false, true, true] },
      { label: 'Suivi des habitudes', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Communication & engagement',
    features: [
      { label: 'Messagerie intégrée', values: [false, true, true, true] },
      { label: 'Relance des membres inactifs', values: [false, true, true, true] },
    ],
  },
  {
    name: 'Paiements & analytics',
    features: [
      { label: 'Gestion des impayés', values: [true, true, true, true] },
      { label: 'Rappels automatiques de paiement', values: [false, true, true, true] },
      { label: 'Rapports hebdomadaires automatiques', values: [false, true, true, true] },
      { label: 'Statistiques de croissance', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Personnalisation',
    features: [
      { label: 'Thèmes disponibles', values: ['2', '5', 'Illimités', 'Illimités'] },
      { label: 'Mode clair / sombre', values: [true, true, true, true] },
      { label: 'Photo de profil', values: [false, false, true, true] },
      { label: 'Calculatrice intégrée', values: [false, false, true, true] },
      { label: 'Blog', values: [false, false, 'Limité', 'Complet'] },
    ],
  },
]

/* ─── Helpers ──────────────────────────────────────────── */

function priceFor(plan: typeof PLANS[0], annual: boolean) {
  if (plan.isFree) return { big: '0', sub: null, strike: null }
  if (!annual) return { big: String(plan.priceMonthly), sub: 'par mois', strike: null }
  const monthly = plan.priceMonthly * (1 - ANNUAL_DISCOUNT)
  const big = monthly % 1 === 0 ? String(Math.round(monthly)) : monthly.toFixed(2).replace('.', ',')
  const yearly = Math.round(plan.priceMonthly * 12 * (1 - ANNUAL_DISCOUNT))
  return { big, sub: `soit ${yearly} € / an`, strike: `${plan.priceMonthly} €` }
}

/* ─── Icônes ───────────────────────────────────────────── */

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
function IconSpark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4z" />
    </svg>
  )
}

/* ─── Composants ───────────────────────────────────────── */

function PlanCard({ plan, annual, selected, onSelect }: {
  plan: typeof PLANS[0]
  annual: boolean
  selected: boolean
  onSelect: (id: string) => void
}) {
  const featured = !!plan.recommended
  const p = priceFor(plan, annual)

  return (
    <div
      onClick={() => onSelect(plan.id)}
      style={{
        position: 'relative',
        background: featured
          ? 'linear-gradient(168deg, #13294f 0%, #0D1F3C 62%)'
          : '#ffffff',
        border: selected
          ? featured ? '1px solid #4E9B6F' : '1px solid #4E9B6F'
          : featured ? '1px solid transparent' : '1px solid #e7edf2',
        borderRadius: 18,
        padding: '26px 22px 22px',
        display: 'flex',
        flexDirection: 'column' as const,
        boxShadow: selected
          ? featured
            ? '0 0 0 3px rgba(78,155,111,0.28), 0 30px 70px -28px rgba(13,31,60,0.45), 0 10px 24px -16px rgba(13,31,60,0.25)'
            : '0 0 0 3px rgba(78,155,111,0.28), 0 8px 30px -12px rgba(13,31,60,0.16)'
          : featured
            ? '0 30px 70px -28px rgba(13,31,60,0.45), 0 10px 24px -16px rgba(13,31,60,0.25)'
            : '0 1px 2px rgba(13,31,60,0.05)',
        transform: featured ? 'translateY(-10px)' : 'none',
        cursor: 'pointer',
        transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease',
      }}
    >
      {/* Ribbon recommandé */}
      {featured && (
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#4E9B6F', color: '#fff',
          fontWeight: 700, fontSize: 11.5,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '7px 15px', borderRadius: 999, whiteSpace: 'nowrap',
          boxShadow: '0 8px 20px -8px rgba(78,155,111,0.7)',
        }}>
          <IconSpark /> Notre recommandation
        </div>
      )}

      {/* Nom du plan */}
      <h3 style={{
        fontWeight: 600, fontSize: 15, letterSpacing: '0.02em',
        color: featured ? '#fff' : '#0D1F3C', margin: 0,
      }}>
        {plan.name}
      </h3>

      {/* Tagline */}
      <p style={{
        fontSize: 13.5, color: featured ? 'rgba(255,255,255,0.62)' : '#5d6b80',
        margin: '5px 0 0', minHeight: 20,
      }}>
        {plan.tagline}
      </p>

      {/* Prix */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, margin: '20px 0 2px' }}>
        <span style={{
          fontWeight: 800, fontSize: 46, lineHeight: 0.9,
          letterSpacing: '-0.035em', color: featured ? '#fff' : '#0D1F3C',
        }}>
          {plan.isFree ? (
            p.big
          ) : (
            <NumberFlow value={Number(p.big.replace(',', '.'))} />
          )}
          <span style={{ fontSize: 22, fontWeight: 600, verticalAlign: 'super', marginLeft: 2 }}>€</span>
        </span>
        {plan.isFree
          ? <span style={{ fontSize: 13.5, color: featured ? 'rgba(255,255,255,0.6)' : '#5d6b80', paddingBottom: 5 }}>pour toujours</span>
          : <span style={{ fontSize: 13.5, color: featured ? 'rgba(255,255,255,0.6)' : '#5d6b80', paddingBottom: 5 }}>/ mois</span>
        }
      </div>
      <p style={{ fontSize: 12.5, color: featured ? 'rgba(255,255,255,0.5)' : '#8a97a8', margin: '6px 0 18px', minHeight: 17 }}>
        {p.strike && <span style={{ textDecoration: 'line-through', opacity: 0.7, marginRight: 6 }}>{p.strike}</span>}
        {p.sub}
      </p>

      {/* CTA */}
      <Link
        href={`/auth/signup?plan=${plan.id}_${annual ? 'annual' : 'monthly'}`}
        onClick={(e) => e.stopPropagation()}
        className="pricing-cta-btn"
        style={{
          width: '100%', border: featured ? 'none' : plan.isFree ? '1.5px solid #0D1F3C' : '1.5px solid #e7edf2',
          cursor: 'pointer', fontWeight: 600, fontSize: 15,
          padding: '13px 18px', borderRadius: 12,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          textDecoration: 'none',
          background: featured ? '#4E9B6F' : plan.isFree ? '#fff' : '#fff',
          color: featured ? '#fff' : '#0D1F3C',
          boxShadow: featured ? '0 6px 16px -8px rgba(78,155,111,0.8)' : 'none',
          transition: 'background 0.18s ease, transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {plan.cta} <IconArrow />
      </Link>

      {/* Note sous le bouton */}
      <p style={{
        fontSize: 11.5, color: featured ? 'rgba(255,255,255,0.5)' : '#8a97a8',
        textAlign: 'center', margin: '12px 0 0',
      }}>
        {plan.footnote}
      </p>

      {/* Liste inclus */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: featured ? 'rgba(255,255,255,0.5)' : '#8a97a8', margin: '22px 0 12px',
      }}>
        {plan.isFree ? 'Inclus' : 'Tout le plan précédent, plus'}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        {plan.content.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: featured ? 'rgba(255,255,255,0.88)' : '#0D1F3C', lineHeight: 1.35 }}>
            <span style={{
              flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
              background: featured ? 'rgba(78,155,111,0.22)' : '#eef6f1',
              color: featured ? '#8fdcae' : '#3f8a60',
              display: 'grid', placeItems: 'center', marginTop: 1,
            }}>
              <IconCheck size={11} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BillingToggle({ annual, setAnnual }: { annual: boolean; setAnnual: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 30 }}>
      <div style={{
        display: 'inline-flex', position: 'relative',
        background: '#fff', border: '1px solid #e7edf2',
        padding: 5, borderRadius: 999,
        boxShadow: '0 1px 2px rgba(13,31,60,0.05)',
      }}>
        {/* Thumb glissant */}
        <div style={{
          position: 'absolute', zIndex: 1, top: 5, left: 5, bottom: 5,
          background: '#0D1F3C', borderRadius: 999,
          width: annual ? 'calc(50% + 18px)' : 'calc(50% - 18px)',
          transform: annual ? 'translateX(calc(100% - 36px))' : 'translateX(0)',
          transition: 'transform 0.32s cubic-bezier(0.22,1,0.36,1), width 0.32s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '0 4px 12px -4px rgba(13,31,60,0.4)',
        }} />
        <button
          onClick={() => setAnnual(false)}
          style={{
            position: 'relative', zIndex: 2, border: 0, background: 'transparent', cursor: 'pointer',
            fontWeight: 600, fontSize: 14.5, color: !annual ? '#fff' : '#5d6b80',
            padding: '9px 20px', borderRadius: 999,
          }}
        >
          Mensuel
        </button>
        <button
          onClick={() => setAnnual(true)}
          style={{
            position: 'relative', zIndex: 2, border: 0, background: 'transparent', cursor: 'pointer',
            fontWeight: 600, fontSize: 14.5, color: annual ? '#fff' : '#5d6b80',
            padding: '9px 20px', borderRadius: 999,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          Annuel{' '}
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            background: annual ? '#4E9B6F' : '#eef6f1',
            color: annual ? '#fff' : '#3f8a60',
            padding: '2px 7px', borderRadius: 6,
          }}>
            −{Math.round(ANNUAL_DISCOUNT * 100)}%
          </span>
        </button>
      </div>
      <span style={{ fontSize: 13.5, color: '#8a97a8' }}>
        {annual ? '2,4 mois offerts sur l\'abonnement annuel' : 'Sans engagement · changez ou annulez quand vous voulez'}
      </span>
    </div>
  )
}

function TableCell({ v }: { v: boolean | string }) {
  if (v === true) return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: '50%', background: '#eef6f1', color: '#3f8a60' }}>
      <IconCheck size={12} />
    </span>
  )
  if (v === false) return <span style={{ color: '#cdd6e0', fontSize: 18 }}>—</span>
  return <span style={{ fontWeight: 600, fontSize: 14, color: '#0D1F3C' }}>{v}</span>
}

function ComparisonTable({ annual }: { annual: boolean }) {
  return (
    <section style={{ marginTop: 88 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{
          fontWeight: 700, fontSize: 'clamp(24px, 3vw, 32px)',
          letterSpacing: '-0.02em', color: '#0D1F3C', margin: '0 0 8px',
        }}>
          Comparez les formules en détail
        </h2>
        <p style={{ color: '#5d6b80', margin: 0, fontSize: 15.5 }}>
          Toutes les fonctionnalités, catégorie par catégorie.
        </p>
      </div>

      {/* Desktop table */}
      <div style={{
        background: '#fff', border: '1px solid #e7edf2', borderRadius: 18,
        boxShadow: '0 1px 2px rgba(13,31,60,0.05)', overflow: 'hidden',
        display: 'block',
      }} className="pricing-table-desktop">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ minWidth: 240, textAlign: 'left', padding: '13px 22px', position: 'sticky', left: 0, background: '#fff', zIndex: 2, fontWeight: 500, fontSize: 14, color: '#0D1F3C', borderBottom: '1px solid #e7edf2' }} />
                {PLANS.map((pl) => {
                  const p = priceFor(pl, annual)
                  return (
                    <th key={pl.id} style={{
                      padding: '18px 12px 16px', borderBottom: '1px solid #e7edf2',
                      verticalAlign: 'bottom', textAlign: 'center',
                      background: pl.recommended ? '#0D1F3C' : '#fff',
                    }}>
                      {pl.recommended && (
                        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4E9B6F', marginBottom: 5 }}>
                          Recommandé
                        </div>
                      )}
                      <div style={{ fontWeight: 600, fontSize: 16, color: pl.recommended ? '#fff' : '#0D1F3C' }}>{pl.name}</div>
                      <div style={{ fontWeight: 700, fontSize: 22, color: pl.recommended ? '#fff' : '#0D1F3C', marginTop: 3 }}>
                        {p.big}€ <small style={{ fontSize: 12, fontWeight: 500, color: pl.recommended ? 'rgba(255,255,255,0.6)' : '#8a97a8' }}>{pl.isFree ? '/ toujours' : '/ mois'}</small>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <>
                  <tr key={cat.name + '-header'}>
                    <td colSpan={PLANS.length + 1} style={{
                      textAlign: 'left', padding: '16px 22px 9px',
                      fontWeight: 600, fontSize: 12,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f8a60',
                      background: '#eef6f1',
                    }}>
                      {cat.name}
                    </td>
                  </tr>
                  {cat.features.map((f) => (
                    <tr key={f.label} style={{ borderBottom: '1px solid #eef2f6' }}>
                      <td style={{
                        textAlign: 'left', padding: '13px 22px', fontWeight: 500, fontSize: 14, color: '#0D1F3C',
                        position: 'sticky', left: 0, background: '#fff', zIndex: 1, minWidth: 240,
                        borderBottom: '1px solid #eef2f6',
                      }}>
                        {f.label}
                      </td>
                      {f.values.map((v, i) => (
                        <td key={i} style={{
                          textAlign: 'center', fontSize: 14, color: '#0D1F3C',
                          borderBottom: '1px solid #eef2f6', padding: '13px 12px',
                          background: PLANS[i].recommended ? '#fafcfd' : undefined,
                        }}>
                          <TableCell v={v as boolean | string} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '18px 12px 22px', borderTop: '1px solid #e7edf2', background: '#fff' }} />
                {PLANS.map((pl) => (
                  <td key={pl.id} style={{
                    padding: '18px 12px 22px', borderTop: '1px solid #e7edf2', textAlign: 'center',
                    background: pl.recommended ? '#fafcfd' : undefined,
                  }}>
                    <Link
                      href={`/auth/signup?plan=${pl.id}_${annual ? 'annual' : 'monthly'}`}
                      style={{
                        border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 13.5,
                        padding: '9px 16px', borderRadius: 10,
                        background: pl.recommended ? '#4E9B6F' : '#eef6f1',
                        color: pl.recommended ? '#fff' : '#3f8a60',
                        textDecoration: 'none', display: 'inline-block',
                      }}
                    >
                      Choisir
                    </Link>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile comparison */}
      <ComparisonMobile annual={annual} />
    </section>
  )
}

function ComparisonMobile({ annual }: { annual: boolean }) {
  const initial = (PLANS.find((p) => p.recommended) || PLANS[0]).id
  const [active, setActive] = useState(initial)
  const idx = PLANS.findIndex((p) => p.id === active)
  const plan = PLANS[idx]
  const p = priceFor(plan, annual)

  return (
    <div className="pricing-cmp-mobile" style={{ display: 'none' }}>
      {/* Tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5,
        background: '#fff', border: '1px solid #e7edf2', borderRadius: 12, padding: 5,
        position: 'sticky', top: 8, zIndex: 10,
        boxShadow: '0 1px 2px rgba(13,31,60,0.05)',
      }}>
        {PLANS.map((pl) => (
          <button
            key={pl.id}
            onClick={() => setActive(pl.id)}
            style={{
              border: 0, background: pl.id === active ? '#0D1F3C' : 'transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontWeight: 600, fontSize: 12,
              color: pl.id === active ? '#fff' : '#5d6b80',
              padding: '10px 2px', borderRadius: 8,
            }}
          >
            {pl.name}
          </button>
        ))}
      </div>

      {/* Header plan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, margin: '20px 2px 4px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 21, color: '#0D1F3C' }}>{plan.name}</div>
          <div style={{ fontSize: 13, color: '#5d6b80', marginTop: 3 }}>{plan.tagline}</div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 25, color: '#0D1F3C', whiteSpace: 'nowrap' }}>
          {p.big}€ <small style={{ fontSize: 12, fontWeight: 500, color: '#8a97a8' }}>{plan.isFree ? '/ toujours' : '/ mois'}</small>
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map((cat) => (
        <div key={cat.name} style={{ marginTop: 16 }}>
          <div style={{
            fontWeight: 600, fontSize: 11.5,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3f8a60',
            background: '#eef6f1', padding: '9px 13px', borderRadius: 9,
          }}>
            {cat.name}
          </div>
          <ul style={{ listStyle: 'none', margin: '2px 0 0', padding: 0 }}>
            {cat.features.map((f) => {
              const v = f.values[idx]
              const off = v === false
              return (
                <li key={f.label} style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '12px 13px', borderBottom: '1px solid #eef2f6',
                  fontSize: 14.5, color: off ? '#8a97a8' : '#0D1F3C',
                }}>
                  <span style={{ flexShrink: 0, width: 18, display: 'grid', placeItems: 'center', color: '#3f8a60' }}>
                    {off ? <span style={{ color: '#cdd6e0', fontSize: 18 }}>—</span> : <IconCheck size={13} />}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.3 }}>{f.label}</span>
                  {typeof v === 'string' && <span style={{ fontWeight: 700, color: '#0D1F3C', fontSize: 13.5, whiteSpace: 'nowrap' }}>{v}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <Link
        href={`/auth/signup?plan=${plan.id}_${annual ? 'annual' : 'monthly'}`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 22, width: '100%', fontWeight: 600, fontSize: 15,
          padding: '13px 18px', borderRadius: 12,
          background: plan.recommended ? '#4E9B6F' : plan.isFree ? '#fff' : '#fff',
          color: plan.recommended ? '#fff' : '#0D1F3C',
          border: plan.isFree ? '1.5px solid #0D1F3C' : plan.recommended ? 'none' : '1.5px solid #e7edf2',
          textDecoration: 'none',
        }}
      >
        {plan.cta} <IconArrow />
      </Link>
      <p style={{ fontSize: 11.5, color: '#8a97a8', textAlign: 'center', marginTop: 12 }}>{plan.footnote}</p>
    </div>
  )
}

function Reassure() {
  const items = [
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: 'Sans carte bancaire',
      desc: "Testez gratuitement 14 jours. On ne vous demande rien avant que vous soyez convaincu.",
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h13l-3-3M20 16H7l3 3" />
        </svg>
      ),
      title: 'Changez à tout moment',
      desc: "Montez ou descendez de formule en un clic, sans frais ni engagement.",
    },
    {
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z" />
        </svg>
      ),
      title: 'Pensé pour les coachs indépendants',
      desc: "Un outil conçu pour le quotidien des coachs sportifs, pas une usine à gaz.",
    },
  ]
  return (
    <div style={{
      marginTop: 64,
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
    }} className="pricing-reassure">
      {items.map((it, i) => (
        <div key={i} style={{
          background: '#fff', border: '1px solid #e7edf2', borderRadius: 12,
          padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <span style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: 10,
            background: '#eef6f1', color: '#3f8a60',
            display: 'grid', placeItems: 'center',
          }}>
            {it.icon}
          </span>
          <div>
            <h4 style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 15, color: '#0D1F3C' }}>{it.title}</h4>
            <p style={{ margin: 0, fontSize: 13, color: '#5d6b80', lineHeight: 1.45 }}>{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Export principal ─────────────────────────────────── */

export function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [selected, setSelected] = useState('croissance')

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .pricing-table-desktop { display: none !important; }
          .pricing-cmp-mobile { display: block !important; }
          .pricing-reassure { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1080px) {
          .pricing-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .pricing-wrap { padding: 44px 16px 72px !important; }
          .pricing-cards-grid { grid-template-columns: 1fr !important; }
        }
        .pricing-cta-link:hover { opacity: 0.88; }
      `}</style>

      <section id="pricing" style={{
        background: 'radial-gradient(1200px 520px at 50% -8%, #eef3f8 0%, rgba(238,243,248,0) 70%), #F8FAFB',
        color: '#0D1F3C',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}>
        <div className="pricing-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px 96px' }}>

          {/* Header */}
          <header style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 44px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontWeight: 600, fontSize: 12.5, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#3f8a60', background: '#eef6f1',
              border: '1px solid rgba(78,155,111,0.18)',
              padding: '6px 13px', borderRadius: 999, marginBottom: 20,
            }}>
              <span className="tag-dot-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4E9B6F', display: 'inline-block', flexShrink: 0 }} />
              Tarifs Coach
            </span>
            <h1 style={{
              fontWeight: 700, fontSize: 'clamp(32px, 4.6vw, 50px)',
              lineHeight: 1.04, letterSpacing: '-0.025em',
              margin: '0 0 14px', color: '#0D1F3C',
            }}>
              Choisissez la formule qui suit votre rythme
            </h1>
            <p style={{ fontSize: 17.5, color: '#5d6b80', margin: '0 auto', maxWidth: 540 }}>
              Des formules claires pour les coachs sportifs indépendants. À partir de 0€, puis évoluez quand votre clientèle grandit.
            </p>
            <BillingToggle annual={annual} setAnnual={setAnnual} />
          </header>

          {/* Grille des 4 cartes */}
          <section className="pricing-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
            alignItems: 'stretch',
            marginTop: 8,
          }}>
            {PLANS.map((pl) => (
              <PlanCard
                key={pl.id}
                plan={pl}
                annual={annual}
                selected={selected === pl.id}
                onSelect={setSelected}
              />
            ))}
          </section>

          {/* Tableau comparatif */}
          <ComparisonTable annual={annual} />

          {/* Bandeau réassurance */}
          <Reassure />

        </div>
      </section>
    </>
  )
}
