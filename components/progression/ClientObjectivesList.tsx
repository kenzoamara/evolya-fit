'use client'

import Link from 'next/link'
import type { Client, Objective } from '@/types/database'

type Props = {
  client: Client
  objectives: Objective[]
  token: string
}

const STATUS_COLOR: Record<string, string> = {
  todo: '#94A3B8',
  in_progress: '#D4A853',
  done: '#4E9B6F',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Atteint',
}

function typeDetail(obj: Objective): string {
  if (obj.type === 'series' && obj.series_count && obj.reps_count) {
    return `${obj.series_count} × ${obj.reps_count} reps`
  }
  if (obj.type === 'distance' && obj.distance_km) {
    return `${obj.distance_km} km`
  }
  if (obj.type === 'timer' && obj.series_count && obj.duration_seconds) {
    const sec = obj.duration_seconds
    const label = sec >= 60 ? `${Math.floor(sec / 60)}min${sec % 60 ? `${sec % 60}s` : ''}` : `${sec}s`
    return `${obj.series_count} × ${label}`
  }
  return ''
}

function TypeIcon({ type }: { type: Objective['type'] }) {
  if (type === 'series') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <rect x="1" y="3" width="12" height="2" rx="1" fill="#4E9B6F" opacity="0.6"/>
      <rect x="1" y="6.5" width="12" height="2" rx="1" fill="#4E9B6F" opacity="0.8"/>
      <rect x="1" y="10" width="12" height="2" rx="1" fill="#4E9B6F"/>
    </svg>
  )
  if (type === 'distance') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <path d="M2 7C2 7 3.5 3 7 3C10.5 3 12 7 12 7C12 7 10.5 11 7 11C3.5 11 2 7 2 7Z" stroke="#4E9B6F" strokeWidth="1.4" fill="none"/>
      <circle cx="7" cy="7" r="1.5" fill="#4E9B6F"/>
    </svg>
  )
  if (type === 'timer') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <circle cx="7" cy="8" r="5" stroke="#4E9B6F" strokeWidth="1.4" fill="none"/>
      <path d="M7 5.5V8L8.5 9.5" stroke="#4E9B6F" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5.5 1.5H8.5" stroke="#4E9B6F" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  return null
}

export function ClientObjectivesList({ client: _client, objectives, token }: Props) {
  const exerciseObjectives = objectives.filter(o => o.type != null)
  const plainObjectives = objectives.filter(o => o.type == null)
  const allSorted = [...exerciseObjectives, ...plainObjectives]

  if (allSorted.length === 0) {
    return (
      <div>
        <h2 className="text-base font-semibold text-[#0D1F3C] mb-3">Mes exercices</h2>
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-10 text-center text-sm text-[#94A3B8]">
          Votre coach n&apos;a pas encore ajouté d&apos;exercice.
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-[#0D1F3C] mb-3">Mes exercices</h2>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#F1F5F9]">
          {allSorted.map(obj => {
            const detail = typeDetail(obj)
            const isExercise = obj.type != null && obj.status !== 'done'
            const isDone = obj.status === 'done'

            const inner = (
              <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${isExercise ? 'hover:bg-[#F8FAFB] cursor-pointer' : ''}`}>
                {/* Icône type */}
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  {isDone ? (
                    <span className="text-[#4E9B6F] text-sm font-medium">✓</span>
                  ) : obj.type ? (
                    <TypeIcon type={obj.type} />
                  ) : (
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[obj.status] ?? '#94A3B8' }} />
                  )}
                </div>

                {/* Titre + détail */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug truncate ${isDone ? 'text-[#4E9B6F] line-through' : 'text-[#0D1F3C]'}`}>
                    {obj.title}
                  </p>
                  {detail && !isDone && (
                    <p className="text-xs text-[#64748B] mt-0.5">{detail}</p>
                  )}
                </div>

                {/* Statut + flèche */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs hidden sm:block" style={{ color: STATUS_COLOR[obj.status] ?? '#94A3B8' }}>
                    {STATUS_LABEL[obj.status] ?? obj.status}
                  </span>
                  {isExercise && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3L9 7L5 11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            )

            if (isExercise) {
              return (
                <Link key={obj.id} href={`/c/${token}/objectif/${obj.id}`}>
                  {inner}
                </Link>
              )
            }
            return <div key={obj.id}>{inner}</div>
          })}
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] mt-2 text-center">
        Appuyez sur un exercice pour le démarrer
      </p>
    </div>
  )
}
