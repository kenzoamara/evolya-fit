export const dynamic = 'force-dynamic'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientDashboard } from './client-dashboard'
import type { Client, Objective, Checkin, Session, ClientReminder } from '@/types/database'

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  // Utilise la clé publique (anon) — les politiques RLS "USING (true)" suffisent
  // pour lire objectives/sessions/checkins sans avoir besoin du service_role_key
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date().toISOString()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('magic_token', token)
    .or(`token_expires_at.is.null,token_expires_at.gt.${now}`)
    .single()

  if (!client) redirect(`/c/${token}`)

  // Redirect to onboarding if not yet completed
  if (!(client as unknown as { onboarding_completed_at: string | null }).onboarding_completed_at) {
    redirect(`/c/${token}/onboarding`)
  }

  const admin = createAdminClient()
  const todayStr = new Date().toISOString().slice(0, 10)

  let objectives: Objective[] = []
  let checkins: Checkin[] = []
  let sessions: Session[] = []
  let messages: { id: string; content: string; sender_role: string; created_at: string; read_by_client: boolean }[] = []
  let profile: { full_name: string } | null = null
  let reminders: ClientReminder[] = []
  let rawPayments: { id: string; amount: number; due_date: string; claimed_at: string | null }[] = []

  try {
    const [r0, r1, r2, r3, r4, r5, r6] = await Promise.all([
      supabase.from('objectives').select('*').eq('client_id', client.id).order('created_at'),
      supabase.from('checkins').select('*').eq('client_id', client.id).order('submitted_at', { ascending: false }),
      supabase.from('sessions').select('id, session_date, notes, created_at').eq('client_id', client.id).order('session_date', { ascending: false }),
      supabase.from('messages').select('id, content, sender_role, created_at, read_by_client').eq('client_id', client.id).eq('sender_role', 'coach').order('created_at', { ascending: false }).limit(1),
      supabase.from('profiles').select('full_name').eq('id', client.coach_id).single(),
      supabase.from('client_reminders')
        .select('*')
        .eq('client_id', client.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false }),
      admin
        .from('client_payments')
        .select('id, amount, due_date, claimed_at')
        .eq('client_id', client.id)
        .is('paid_date', null),
    ])

    if (r0.error) console.error('[dashboard] objectives error:', r0.error.message, 'client_id:', client.id)
    if (r2.error) console.error('[dashboard] sessions error:', r2.error.message)

    objectives = (r0.data ?? []) as Objective[]
    checkins = (r1.data ?? []) as Checkin[]
    sessions = (r2.data ?? []) as Session[]
    messages = (r3.data ?? []) as typeof messages
    profile = (r4.data as unknown as { full_name: string } | null)
    reminders = (r5.data ?? []) as ClientReminder[]
    rawPayments = (r6.data ?? []) as typeof rawPayments
  } catch (err) {
    console.error('[client-dashboard] data fetch error:', err)
    throw err
  }

  // Compute payment alert data
  const unpaidPayments = rawPayments
  const latePayments = unpaidPayments.filter(p => p.due_date < todayStr && !p.claimed_at)
  const claimedPayments = unpaidPayments.filter(p => p.claimed_at)
  const pendingPayments = unpaidPayments.filter(p => p.due_date >= todayStr && !p.claimed_at)

  const paymentAlert = unpaidPayments.length > 0 ? {
    lateCount: latePayments.length,
    lateAmount: latePayments.reduce((s, p) => s + p.amount, 0),
    pendingCount: pendingPayments.length,
    pendingAmount: pendingPayments.reduce((s, p) => s + p.amount, 0),
    claimedCount: claimedPayments.length,
    totalDue: unpaidPayments.reduce((s, p) => s + p.amount, 0),
  } : null

  // Sélectionner le rappel le plus prioritaire
  const priorityOrder = { streak_fail: 0, inactivity: 1, daily: 2 }
  const pendingReminder = reminders
    .sort((a, b) => (priorityOrder[a.type as keyof typeof priorityOrder] ?? 9) - (priorityOrder[b.type as keyof typeof priorityOrder] ?? 9))[0] ?? null

  return (
    <ClientDashboard
      client={client as Client}
      objectives={objectives}
      checkins={checkins}
      sessions={sessions}
      lastCoachMessage={messages[0] ?? null}
      coachName={profile?.full_name ?? 'Votre coach'}
      token={token}
      pendingReminder={pendingReminder as ClientReminder | null}
      paymentAlert={paymentAlert}
    />
  )
}
