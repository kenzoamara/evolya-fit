'use client'

import { formatDateShort } from '@/lib/utils'
import type { Checkin, Objective } from '@/types/database'

type Props = {
  checkins: Checkin[]
  objectives: Objective[]
  isCoach: boolean
  client: { id: string; full_name: string }
}

export function ProgressionTab({ checkins, objectives }: Props) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const checkinsThisMonth = checkins.filter(c =>
    new Date(c.submitted_at) >= startOfMonth
  ).length

  const doneThisMonth = objectives.filter((o) => {
    if (o.status !== 'done' || !o.completed_at) return false
    return new Date(o.completed_at) >= startOfMonth
  }).length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3">
          <p className="text-xs text-[#64748B] mb-1">Check-ins (ce mois)</p>
          <p className="text-xl font-semibold text-[#0D1F3C]">{checkinsThisMonth}</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3">
          <p className="text-xs text-[#64748B] mb-1">Objectifs atteints (mois)</p>
          <p className="text-xl font-semibold text-[#4E9B6F]">{doneThisMonth}</p>
        </div>
      </div>

      {/* Résumé textuel */}
      <div className="bg-[#4E9B6F]/5 border border-[#4E9B6F]/20 rounded-lg px-4 py-3">
        <p className="text-sm text-[#0D1F3C]">
          Ce mois : <strong>{checkinsThisMonth} check-in{checkinsThisMonth > 1 ? 's' : ''}</strong> complété{checkinsThisMonth > 1 ? 's' : ''}, <strong>{doneThisMonth} objectif{doneThisMonth > 1 ? 's' : ''}</strong> atteint{doneThisMonth > 1 ? 's' : ''}.
        </p>
      </div>

      {/* Tableau check-ins */}
      {checkins.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-medium text-[#0D1F3C]">Historique des check-ins</h3>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {checkins.slice(0, 10).map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#64748B]">
                    Semaine {c.week_number} · {formatDateShort(c.submitted_at)}
                  </span>
                </div>
                {c.q1_answer && (
                  <p className="text-xs text-[#0D1F3C] mb-1">
                    <span className="text-[#64748B]">Semaine : </span>{c.q1_answer}
                  </p>
                )}
                {c.q2_answer && (
                  <p className="text-xs text-[#0D1F3C] mb-1">
                    <span className="text-[#64748B]">Objectifs : </span>{c.q2_answer}
                  </p>
                )}
                {c.q3_answer && (
                  <p className="text-xs text-[#0D1F3C]">
                    <span className="text-[#64748B]">Blocage : </span>{c.q3_answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
