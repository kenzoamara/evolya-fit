'use client'

import { useState } from 'react'
import type { Checkin, Objective, Client } from '@/types/database'
import { WeeklyView } from './WeeklyView'
import { MonthlyTracker } from './MonthlyTracker'
import { YearView } from './YearView'
import { ProgressSummary } from './ProgressSummary'
import { CheckinsTable } from './CheckinsTable'
import { MetabolicShell } from './MetabolicShell'

type Period = 'week' | 'month' | 'year'
type Mode = 'sportif' | 'metabolique'

type Props = {
  checkins: Checkin[]
  objectives: Objective[]
  isCoach: boolean
  client: Client
  token?: string
}

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
]

export function ProgressionShell({ checkins, objectives, isCoach, client, token }: Props) {
  const [mode, setMode] = useState<Mode>('sportif')
  const [period, setPeriod] = useState<Period>(isCoach ? 'month' : 'week')

  const periodLabel = period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'

  return (
    <div className="space-y-5">
      {/* Toggle Sportif / Métabolique */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 w-fit">
        {(['sportif', 'metabolique'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-white text-[#0D1F3C] shadow-sm'
                : 'text-[#64748B] hover:text-[#0D1F3C]'
            }`}
          >
            {m === 'sportif' ? 'Sportif' : 'Métabolique'}
          </button>
        ))}
      </div>

      {/* ── Progrès Sportif ── */}
      {mode === 'sportif' && (
        <>
          {/* Switcher période */}
          <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 w-fit">
            {PERIOD_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === key
                    ? 'bg-white text-[#0D1F3C] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0D1F3C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {period === 'week' && (
            <WeeklyView
              checkins={checkins}
              objectives={objectives}
              clientId={client.id}
              isClient={!isCoach}
              token={token}
            />
          )}
          {period === 'month' && (
            <MonthlyTracker
              checkins={checkins}
              objectives={objectives}
              clientId={client.id}
              token={token}
            />
          )}
          {period === 'year' && (
            <YearView checkins={checkins} objectives={objectives} clientId={client.id} token={token} />
          )}

          <ProgressSummary checkins={checkins} objectives={objectives} periodLabel={periodLabel} />
          <CheckinsTable checkins={checkins} isClient={!isCoach} />
        </>
      )}

      {/* ── Progrès Métabolique ── */}
      {mode === 'metabolique' && (
        <MetabolicShell client={client} isCoach={isCoach} token={token} />
      )}
    </div>
  )
}
