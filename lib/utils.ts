import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) < new Date()
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    trial: 'Essai gratuit',
    free: 'Gratuit',
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    scale: 'Scale',
    elite: 'Elite',
    unlimited: 'Unlimited',
    standard: 'Growth',
  }
  return labels[plan] ?? plan
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: '#94A3B8',
    in_progress: '#D4A853',
    done: '#4E9B6F',
    active: '#4E9B6F',
    inactive: '#94A3B8',
    cancelled: '#94A3B8',
    past_due: '#D4A853',
  }
  return colors[status] ?? '#94A3B8'
}
