'use client'

import { useState } from 'react'
import type { Bilan, BilanSnapshot } from '@/types/database'

type Props = {
  clientName: string
  coachName: string
  bilans: Bilan[]
}

const MEAS_LABELS: Record<string, string> = {
  waist_cm: 'Tour de taille',
  hips_cm: 'Tour de hanches',
  chest_cm: 'Tour de poitrine',
  l_bicep_cm: 'Bicep gauche',
  r_bicep_cm: 'Bicep droit',
  l_thigh_cm: 'Cuisse gauche',
  r_thigh_cm: 'Cuisse droite',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DeltaChip({ value, unit = 'kg', invertPositive = false }: { value: number; unit?: string; invertPositive?: boolean }) {
  const isGood = invertPositive ? value < 0 : value > 0
  const isNeutral = value === 0
  const sign = value > 0 ? '+' : ''
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
      isNeutral ? 'bg-[#F1F5F9] text-[#64748B]'
      : isGood ? 'bg-[#F0FDF4] text-[#16A34A]'
      : 'bg-[#FEF2F2] text-[#DC2626]'
    }`}>
      {sign}{value} {unit}
    </span>
  )
}

function BilanCard({ bilan, coachName }: { bilan: Bilan; coachName: string }) {
  const s: BilanSnapshot = bilan.content_snapshot

  const measureKeys = s.measurements_delta
    ? Object.entries(s.measurements_delta).filter(([, v]) => v !== null)
    : []

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden print:shadow-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D1F3C] to-[#1E3A5F] px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest mb-1">Bilan de suivi</p>
            <p className="text-white font-semibold text-[15px]">{s.period_label}</p>
            <p className="text-[rgba(255,255,255,0.55)] text-[12px] mt-0.5">Envoyé le {fmtDate(bilan.sent_at!)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[rgba(255,255,255,0.5)] mb-0.5">Par</p>
            <p className="text-[13px] text-white font-medium">{coachName}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Assiduité */}
        <section>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Assiduité</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8FAFB] rounded-xl p-4">
              <p className="text-[11px] text-[#64748B] mb-1">Check-ins réalisés</p>
              <p className="text-[26px] font-bold text-[#0D1F3C] leading-none">{s.checkin_count}</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">sur {s.period_weeks} semaines</p>
            </div>
            <div className="bg-[#F8FAFB] rounded-xl p-4">
              <p className="text-[11px] text-[#64748B] mb-1">Taux de régularité</p>
              <p className="text-[26px] font-bold leading-none" style={{
                color: (s.checkin_rate_pct ?? 0) >= 75 ? '#16A34A' : (s.checkin_rate_pct ?? 0) >= 50 ? '#D97706' : '#DC2626'
              }}>
                {s.checkin_rate_pct ?? 0}%
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                {(s.checkin_rate_pct ?? 0) >= 75 ? 'Excellent' : (s.checkin_rate_pct ?? 0) >= 50 ? 'À maintenir' : 'À améliorer'}
              </p>
            </div>
          </div>
        </section>

        {/* Objectifs */}
        {s.objectives_total > 0 && (
          <section>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Objectifs</p>
            <div className="bg-[#F8FAFB] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-[#0D1F3C]">
                  <strong>{s.objectives_done}</strong> objectif{s.objectives_done > 1 ? 's' : ''} atteint{s.objectives_done > 1 ? 's' : ''} sur {s.objectives_total}
                </span>
                <span className="text-[12px] font-semibold text-[#4E9B6F]">
                  {Math.round((s.objectives_done / s.objectives_total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4E9B6F] transition-all"
                  style={{ width: `${Math.round((s.objectives_done / s.objectives_total) * 100)}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Évolution poids */}
        {s.weight_delta_kg !== null && (
          <section>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Évolution du poids</p>
            <div className="bg-[#F8FAFB] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {s.weight_start_kg && <p className="text-[12px] text-[#64748B]">Début : <span className="font-semibold text-[#0D1F3C]">{s.weight_start_kg} kg</span></p>}
                  {s.weight_end_kg && <p className="text-[12px] text-[#64748B]">Fin : <span className="font-semibold text-[#0D1F3C]">{s.weight_end_kg} kg</span></p>}
                </div>
                <DeltaChip value={s.weight_delta_kg} unit="kg" invertPositive />
              </div>
            </div>
          </section>
        )}

        {/* Mensurations */}
        {measureKeys.length > 0 && (
          <section>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Évolution des mensurations</p>
            <div className="grid grid-cols-2 gap-2">
              {measureKeys.map(([key, val]) => (
                <div key={key} className="bg-[#F8FAFB] rounded-xl px-4 py-3">
                  <p className="text-[11px] text-[#64748B] mb-1.5">{MEAS_LABELS[key] ?? key}</p>
                  <DeltaChip value={val!} unit="cm" invertPositive />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projection / objectif principal */}
        {s.main_goal && (
          <section>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Objectif principal</p>
            <div className="bg-[#FFF9F0] border border-[#FDE68A] rounded-xl p-4">
              <p className="text-[13px] text-[#92400E] leading-relaxed">{s.main_goal}</p>
              {s.roi_weeks !== null && s.roi_weeks > 0 && (
                <p className="text-[11px] text-[#B45309] mt-2">
                  Vous êtes accompagné depuis <strong>{s.roi_weeks} semaine{s.roi_weeks > 1 ? 's' : ''}</strong> — continuez sur cette lancée.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Note du coach */}
        {s.coach_note && (
          <section>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Message de votre coach</p>
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4">
              <p className="text-[13px] text-[#166534] leading-relaxed italic">&ldquo;{s.coach_note}&rdquo;</p>
              <p className="text-[11px] text-[#4E9B6F] mt-2 font-medium">— {coachName}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function EmptyState({ coachName }: { coachName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration sans visage */}
      <div className="mb-6 relative">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="60" cy="88" rx="28" ry="18" fill="#EEF9F3" />
          {/* Torso */}
          <rect x="44" y="62" width="32" height="30" rx="8" fill="#4E9B6F" opacity="0.15" />
          {/* Head - no face, just shape */}
          <ellipse cx="60" cy="50" rx="20" ry="22" fill="#F0FDF4" stroke="#D1FAE5" strokeWidth="1.5" />
          {/* Laurel left */}
          <path d="M22 72 Q18 60 26 52" stroke="#4E9B6F" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="24" cy="57" rx="5" ry="3" fill="#4E9B6F" opacity="0.3" transform="rotate(-20 24 57)" />
          <ellipse cx="20" cy="65" rx="5" ry="3" fill="#4E9B6F" opacity="0.3" transform="rotate(-10 20 65)" />
          {/* Laurel right */}
          <path d="M98 72 Q102 60 94 52" stroke="#4E9B6F" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="96" cy="57" rx="5" ry="3" fill="#4E9B6F" opacity="0.3" transform="rotate(20 96 57)" />
          <ellipse cx="100" cy="65" rx="5" ry="3" fill="#4E9B6F" opacity="0.3" transform="rotate(10 100 65)" />
          {/* Trophy top */}
          <path d="M52 30 L60 22 L68 30" stroke="#D4A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="60" cy="20" r="4" fill="#D4A853" opacity="0.6" />
          {/* Stars */}
          <circle cx="35" cy="30" r="2" fill="#D4A853" opacity="0.4" />
          <circle cx="85" cy="28" r="2" fill="#D4A853" opacity="0.4" />
          <circle cx="30" cy="45" r="1.5" fill="#4E9B6F" opacity="0.4" />
          <circle cx="90" cy="42" r="1.5" fill="#4E9B6F" opacity="0.4" />
        </svg>
      </div>

      <h2 className="text-[17px] font-semibold text-[#0D1F3C] mb-2">
        Votre bilan arrive bientôt
      </h2>
      <p className="text-[13px] text-[#64748B] leading-relaxed max-w-xs">
        {coachName} prépare votre bilan personnalisé. Continuez à remplir vos check-ins — chaque donnée compte.
      </p>
      <div className="mt-6 px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl max-w-xs">
        <p className="text-[12px] text-[#166534] leading-relaxed">
          Un bilan vous sera envoyé régulièrement pour suivre vos progrès sur la durée.
        </p>
      </div>
    </div>
  )
}

export function ClientBilanView({ coachName, bilans }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const hasBilan = bilans.length > 0

  return (
    <div className="flex-1 px-4 sm:px-6 pt-6 pb-24 sm:pb-8 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[#0D1F3C]">Mon Bilan</h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          {hasBilan ? `${bilans.length} bilan${bilans.length > 1 ? 's' : ''} envoyé${bilans.length > 1 ? 's' : ''} par votre coach` : 'Votre coach va bientôt vous envoyer un bilan'}
        </p>
      </div>

      {!hasBilan ? (
        <EmptyState coachName={coachName} />
      ) : (
        <>
          {/* Selector if multiple bilans */}
          {bilans.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
              {bilans.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    selectedIdx === i
                      ? 'bg-[#0D1F3C] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {b.content_snapshot.period_label}
                </button>
              ))}
            </div>
          )}

          <BilanCard bilan={bilans[selectedIdx]} coachName={coachName} />
        </>
      )}
    </div>
  )
}
