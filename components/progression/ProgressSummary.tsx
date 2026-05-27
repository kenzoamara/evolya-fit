import type { Checkin, Objective } from '@/types/database'
import { calcBestStreak } from './utils'

type Props = {
  checkins: Checkin[]
  objectives: Objective[]
  periodLabel?: string
}

function generateSummary(data: {
  periodLabel: string
  checkinsCount: number
  objectivesDone: number
  objectivesTotal: number
  bestStreak: number
}): string {
  const parts: string[] = []

  if (data.checkinsCount === 0) {
    return `Aucun check-in ${data.periodLabel}. Envoyez un rappel à votre client.`
  }

  parts.push(
    `${data.periodLabel.charAt(0).toUpperCase() + data.periodLabel.slice(1)} : ${data.checkinsCount} check-in${data.checkinsCount > 1 ? 's' : ''} complété${data.checkinsCount > 1 ? 's' : ''}`
  )

  if (data.objectivesTotal > 0) {
    parts.push(
      `${data.objectivesDone} objectif${data.objectivesDone > 1 ? 's' : ''} atteint${data.objectivesDone > 1 ? 's' : ''} sur ${data.objectivesTotal}`
    )
  }

  if (data.bestStreak >= 3) {
    parts.push(`meilleure série : ${data.bestStreak} jours consécutifs`)
  }

  return parts.join(', ') + '.'
}

export function ProgressSummary({ checkins, objectives, periodLabel = 'ce mois' }: Props) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const monthCheckins = checkins.filter(c => {
    const d = new Date(c.submitted_at)
    return d >= startOfMonth && d <= endOfMonth
  })

  const objectivesDone = objectives.filter(o => {
    if (o.status !== 'done' || !o.completed_at) return false
    const d = new Date(o.completed_at)
    return d >= startOfMonth && d <= endOfMonth
  }).length

  const summary = generateSummary({
    periodLabel,
    checkinsCount: monthCheckins.length,
    objectivesDone,
    objectivesTotal: objectives.length,
    bestStreak: calcBestStreak(checkins),
  })

  return (
    <div className="flex items-start gap-0 rounded-lg overflow-hidden border border-[#E2E8F0]">
      <div className="w-1 self-stretch bg-[#4E9B6F] flex-shrink-0" />
      <div className="bg-[#F7F7F4] px-4 py-3 flex-1">
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">Résumé</p>
        <p className="text-sm text-[#0D1F3C] leading-relaxed">{summary}</p>
      </div>
    </div>
  )
}
