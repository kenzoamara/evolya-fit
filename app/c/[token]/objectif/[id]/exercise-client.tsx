'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Objective } from '@/types/database'

const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function DonutChart({ progress, label }: { progress: number; label: string }) {
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = CIRCUMFERENCE * (1 - clamped)
  const pct = Math.round(clamped * 100)

  return (
    <svg width="160" height="160" viewBox="0 0 100 100" className="drop-shadow-sm">
      <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#E2E8F0" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={RADIUS}
        fill="none"
        stroke={pct === 100 ? 'var(--brand-dark)' : 'var(--brand)'}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
        fill="#0D1F3C" fontSize="18" fontWeight="700" fontFamily="inherit">
        {pct}%
      </text>
      <text x="50" y="60" textAnchor="middle" dominantBaseline="middle"
        fill="#64748B" fontSize="8" fontFamily="inherit">
        {label}
      </text>
    </svg>
  )
}

type Props = {
  objective: Objective
  token: string
  coachView?: boolean
}

export function ExerciseClient({ objective, token, coachView = false }: Props) {
  const router = useRouter()
  const totalSeries = objective.series_count ?? 1

  const [completedSeries, setCompletedSeries] = useState<boolean[]>(
    () => Array(totalSeries).fill(false)
  )
  const [elapsed, setElapsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)

  const completedCount = completedSeries.filter(Boolean).length
  const isDistanceType = objective.type === 'distance'

  const allDone = isDistanceType
    ? completedSeries[0] === true
    : completedCount === totalSeries

  // Chrono
  useEffect(() => {
    if (saved) return
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [saved])

  // Blocage navigation navigateur
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!saved && completedCount > 0) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saved, completedCount])

  // Overlay quand tout est terminé
  useEffect(() => {
    if (allDone && !saved) setShowOverlay(true)
  }, [allDone, saved])

  function toggleSeries(index: number) {
    if (saved) return
    setCompletedSeries(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  function markDistanceDone() {
    if (saved) return
    setCompletedSeries([true])
  }

  const handleSave = useCallback(async () => {
    if (saving || saved) return
    setSaving(true)

    const res = await fetch('/api/exercise-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        objectiveId: objective.id,
        seriesCompleted: isDistanceType ? 1 : completedCount,
        totalDurationSeconds: elapsed,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (data.error) {
      toast.error('Erreur lors de la sauvegarde.')
      return
    }

    setSaved(true)
    setShowOverlay(false)
    toast.success('Séance enregistrée !')
  }, [saving, saved, token, objective.id, isDistanceType, completedCount, elapsed])

  function handleLeave() {
    router.push(`/c/${token}/dashboard`)
  }

  function seriesLabel(index: number): string {
    if (objective.type === 'timer' && objective.duration_seconds) {
      const sec = objective.duration_seconds
      return sec >= 60
        ? `${Math.floor(sec / 60)}min${sec % 60 ? `${sec % 60}s` : ''}`
        : `${sec}s`
    }
    if (objective.type === 'series' && objective.reps_count) {
      return `${objective.reps_count} reps`
    }
    return `Série ${index + 1}`
  }

  function donutLabel(): string {
    if (isDistanceType) return saved || completedSeries[0] ? 'Terminé' : `${objective.distance_km} km`
    return `${completedCount}/${totalSeries}`
  }

  const progress = isDistanceType
    ? (completedSeries[0] ? 1 : 0)
    : totalSeries > 0 ? completedCount / totalSeries : 0

  return (
    <div className="min-h-dvh bg-[#F8FAFB] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[#0D1F3C] truncate">{objective.title}</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {objective.type === 'series' && objective.series_count && objective.reps_count && `${objective.series_count} séries × ${objective.reps_count} reps`}
            {objective.type === 'distance' && objective.distance_km && `${objective.distance_km} km`}
            {objective.type === 'timer' && objective.series_count && objective.duration_seconds && `${objective.series_count} séries × ${objective.duration_seconds}s`}
          </p>
        </div>
        {/* Bouton quitter */}
        <button
          onClick={saved || coachView ? handleLeave : undefined}
          disabled={!saved && !coachView}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${saved || coachView ? 'btn-brand' : 'border border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'}`}
          title={saved ? 'Quitter' : 'Enregistrez avant de quitter'}
        >
          {!saved && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="5" width="6" height="6" rx="1" stroke="#94A3B8" strokeWidth="1.2"/>
              <path d="M4 5V4C4 2.9 4.9 2 6 2C7.1 2 8 2.9 8 4V5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
          Quitter
        </button>
      </div>

      {/* Mention cadenas si pas sauvegardé */}
      {!saved && completedCount > 0 && !allDone && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-2">
          <p className="text-xs text-center text-[#94A3B8]">
            Enregistrez votre séance avant de quitter
          </p>
        </div>
      )}

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Chrono */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Temps écoulé</p>
            <p className="text-3xl font-mono font-semibold text-[#0D1F3C] mt-1 tabular-nums">
              {formatTime(elapsed)}
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2" style={{ color: 'var(--brand)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="var(--brand)" strokeWidth="1.5"/>
                <path d="M6 10L9 13L14 7" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-medium">Enregistré</span>
            </div>
          )}
        </div>

        {/* Donut */}
        <div className="flex justify-center">
          <DonutChart progress={progress} label={donutLabel()} />
        </div>

        {/* Séries ou Distance */}
        {isDistanceType ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-center">
            <p className="text-lg font-semibold text-[#0D1F3C] mb-1">{objective.distance_km} km</p>
            <p className="text-sm text-[#64748B] mb-6">à parcourir</p>
            {!completedSeries[0] ? (
              <button
                onClick={markDistanceDone}
                disabled={saved || coachView}
                className="w-full py-4 btn-brand font-semibold rounded-xl transition-colors disabled:opacity-50 text-base"
              >
                Marquer comme terminé
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2" style={{ color: 'var(--brand)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="var(--brand)" strokeWidth="1.5"/>
                  <path d="M6 10L9 13L14 7" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-semibold">Distance complétée</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#64748B] mb-4 uppercase tracking-wider">
              Séries — validez-les une par une
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {completedSeries.map((done, i) => (
                <button
                  key={i}
                  onClick={() => toggleSeries(i)}
                  disabled={saved || coachView}
                  className={`flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 transition-all font-medium disabled:cursor-default ${!done ? 'border-[#E2E8F0] bg-white text-[#0D1F3C]' : 'text-white shadow-sm'}`}
                  style={done ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand)' } : {}}
                >
                  {done ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 9L7.5 12.5L14 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-base font-semibold">{i + 1}</span>
                  )}
                  <span className="text-xs opacity-80">{seriesLabel(i)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bouton Enregistrer (visible quand tout est fait et pas encore sauvegardé) */}
        {allDone && !saved && !coachView && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 btn-brand font-semibold rounded-xl transition-colors disabled:opacity-60 text-base shadow-md"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </button>
        )}

        {/* Message après sauvegarde */}
        {saved && (
          <div className="rounded-xl p-5 text-center border" style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'color-mix(in srgb, var(--brand) 20%, transparent)' }}>
            <p className="font-semibold text-base mb-1" style={{ color: 'var(--brand)' }}>Séance enregistrée !</p>
            <p className="text-sm text-[#64748B]">Temps total : {formatTime(elapsed)}</p>
            <button onClick={handleLeave}
              className="mt-4 px-6 py-2.5 btn-brand text-sm font-medium rounded-lg transition-colors">
              Retour au tableau de bord
            </button>
          </div>
        )}
      </div>

      {/* Overlay plein écran quand tout est terminé */}
      {showOverlay && !saved && !coachView && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 flex flex-col items-center gap-5">
            {/* Cercle de validation */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="var(--brand)" strokeWidth="2"/>
                <path d="M12 20L17.5 25.5L28 13" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-[#0D1F3C]">Exercice terminé !</h2>
              <p className="text-[#64748B] text-sm mt-1">
                Temps : <span className="font-semibold text-[#0D1F3C]">{formatTime(elapsed)}</span>
              </p>
              {!isDistanceType && (
                <p className="text-[#64748B] text-sm">
                  {completedCount} / {totalSeries} série{totalSeries > 1 ? 's' : ''} complétée{totalSeries > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 btn-brand font-bold rounded-xl transition-colors disabled:opacity-60 text-base shadow-md"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
            </button>

            <div className="flex flex-col items-center gap-1">
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#94A3B8] text-sm rounded-lg cursor-not-allowed"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="5" width="6" height="6" rx="1" stroke="#94A3B8" strokeWidth="1.2"/>
                  <path d="M4 5V4C4 2.9 4.9 2 6 2C7.1 2 8 2.9 8 4V5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Quitter
              </button>
              <p className="text-xs text-[#94A3B8]">Enregistrez avant de quitter</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
