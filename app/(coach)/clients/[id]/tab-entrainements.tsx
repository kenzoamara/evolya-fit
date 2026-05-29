'use client'

import { useState } from 'react'
import type { WorkoutLog } from './_shared'

export function EntrainementsTab({ workoutLogs }: { workoutLogs: WorkoutLog[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (workoutLogs.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-8 text-center">
        <p className="text-sm text-[#94A3B8]">Aucune séance enregistrée pour ce client.</p>
        <p className="text-xs text-[#CBD5E1] mt-1">Les logs apparaîtront dès que le client aura complété une séance.</p>
      </div>
    )
  }

  const grouped: Record<string, WorkoutLog[]> = {}
  for (const log of workoutLogs) {
    const month = log.log_date.slice(0, 7)
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(log)
  }

  const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  function monthLabel(ym: string) {
    const [y, m] = ym.split('-')
    return `${MONTHS[parseInt(m) - 1]} ${y}`
  }

  function groupExercises(logs: WorkoutLog['exercise_logs']) {
    const map: Record<string, { reps: number[]; weights: number[] }> = {}
    for (const l of logs) {
      const name = l.programme_day_exercises?.exercise_name ?? 'Exercice'
      if (!map[name]) map[name] = { reps: [], weights: [] }
      if (l.reps_done != null) map[name].reps.push(l.reps_done)
      if (l.weight_kg != null) map[name].weights.push(l.weight_kg)
    }
    return map
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([month, logs]) => (
        <div key={month}>
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
            {monthLabel(month)} · {logs.length} séance{logs.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {logs.map(log => {
              const progTitle = (log.programme_assignments as { programmes: { title: string } | null } | null)?.programmes?.title ?? 'Programme'
              const dayTitle = log.programme_days?.title ?? `Jour ${log.programme_days?.day_number ?? '?'}`
              const isOpen = openId === log.id
              const exercises = groupExercises(log.exercise_logs)
              return (
                <div key={log.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <button onClick={() => setOpenId(isOpen ? null : log.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFBFD] transition-colors text-left">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.completed ? 'bg-[#4E9B6F]' : 'bg-[#CBD5E1]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0D1F3C] truncate">{dayTitle}</p>
                      <p className="text-[11px] text-[#94A3B8] truncate">{progTitle}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(log.log_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${log.completed ? 'bg-[#EEF9F3] text-[#4E9B6F]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                        {log.completed ? 'Complété' : 'Partiel'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#CBD5E1] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#F1F5F9]">
                      {Object.keys(exercises).length === 0 ? (
                        <p className="text-[12px] text-[#CBD5E1] pt-3 text-center">Aucune donnée enregistrée.</p>
                      ) : (
                        <div className="pt-3 space-y-2">
                          {Object.entries(exercises).map(([name, data]) => (
                            <div key={name} className="flex items-center justify-between gap-4">
                              <p className="text-[12px] font-medium text-[#0D1F3C] flex-1 min-w-0 truncate">{name}</p>
                              <div className="flex items-center gap-3 shrink-0">
                                {data.reps.length > 0 && <span className="text-[11px] text-[#64748B]">{data.reps.join(' / ')} reps</span>}
                                {data.weights.length > 0 && <span className="text-[11px] font-semibold text-[#0D1F3C]">{Math.max(...data.weights)} kg</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
