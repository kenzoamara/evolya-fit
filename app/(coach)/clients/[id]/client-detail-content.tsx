'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PlanGate } from '@/components/ui/plan-gate'
import type { Client, Session, Checkin, ClientNote, WeightEntry, BodyMeasurement, SleepEntry, PerformanceEntry, WorkoutLog } from './_shared'
import { avatarColor } from './_shared'
import { ApercuTab }       from './tab-apercu'
import { SessionsTab }     from './tab-seances'
import { ProfilTab }       from './tab-profil'
import { EntrainementsTab } from './tab-entrainements'
import { NotesTab }        from './tab-notes'

export type { ClientNote, WeightEntry, BodyMeasurement, SleepEntry, PerformanceEntry, WorkoutLog }

type Props = {
  client: Client
  sessions: Session[]
  checkins: Checkin[]
  clientNotes?: ClientNote[]
  coachNotes?: ClientNote[]
  weightEntries?: WeightEntry[]
  bodyMeasurements?: BodyMeasurement[]
  sleepEntries?: SleepEntry[]
  performanceEntries?: PerformanceEntry[]
  workoutLogs?: WorkoutLog[]
  latePaymentsCount?: number
  isCoach: boolean
  userPlan?: string
}

type TabId = 'apercu' | 'seances' | 'profil' | 'notes' | 'entrainements'

const LS_KEY = 'evolya_recent_client_visits'

export function ClientDetailContent({
  client, sessions, checkins,
  clientNotes = [], coachNotes = [],
  weightEntries = [], bodyMeasurements = [],
  sleepEntries = [], performanceEntries = [],
  workoutLogs = [], latePaymentsCount = 0,
  isCoach, userPlan = 'free',
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('apercu')
  const [waPhone, setWaPhone] = useState(client.whatsapp_phone ?? '')
  const [savingWa, setSavingWa] = useState(false)
  const router = useRouter()

  async function saveWhatsAppPhone() {
    setSavingWa(true)
    const supabase = createClient()
    const { error } = await supabase.from('clients').update({ whatsapp_phone: waPhone.trim() || null }).eq('id', client.id)
    setSavingWa(false)
    if (error) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Numéro WhatsApp enregistré.')
    router.refresh()
  }

  useEffect(() => {
    if (!isCoach) return
    try {
      const raw = localStorage.getItem(LS_KEY)
      const visits: Array<{ clientId: string; clientName: string; href: string; at: string }> = raw ? JSON.parse(raw) : []
      const updated = [
        { clientId: client.id, clientName: client.full_name, href: `/clients/${client.id}`, at: new Date().toISOString() },
        ...visits.filter(v => v.clientId !== client.id),
      ].slice(0, 10)
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
    } catch { /* ignore */ }
  }, [client.id, client.full_name, isCoach])

  const tabs: { key: TabId; label: string }[] = [
    { key: 'apercu',        label: 'Aperçu' },
    { key: 'seances',       label: 'Séances' },
    { key: 'profil',        label: 'Profil' },
    ...(isCoach ? [
      { key: 'entrainements' as TabId, label: 'Entraînements' },
      { key: 'notes'         as TabId, label: 'Notes' },
    ] : []),
  ]

  return (
    <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-6 pb-24 sm:py-8 max-w-7xl w-full mx-auto">

      {/* Header client */}
      <div className="flex items-center gap-3 mb-6">
        {isCoach && (
          <button onClick={() => router.back()} className="text-sm text-[#64748B] hover:text-[#0D1F3C] transition-colors flex-shrink-0">
            ← Retour
          </button>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor(client.full_name).bg, color: avatarColor(client.full_name).text }}>
            {client.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-[#0D1F3C] truncate">{client.full_name}</h1>
            <p className="text-xs text-[#64748B] truncate">{client.email}</p>
            {isCoach && (
              <div className="flex items-center gap-1.5 mt-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366" className="shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <input
                  type="tel"
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  onBlur={saveWhatsAppPhone}
                  onKeyDown={e => e.key === 'Enter' && saveWhatsAppPhone()}
                  placeholder="Numéro WhatsApp (ex: 0612345678)"
                  className="text-xs text-[#64748B] bg-transparent border-b border-dashed border-[#E2E8F0] focus:border-[#25D366] focus:outline-none placeholder:text-[#CBD5E1] w-52"
                />
                {savingWa && <span className="w-3 h-3 border border-[#25D366] border-t-transparent rounded-full animate-spin" />}
              </div>
            )}
          </div>
        </div>
        <div className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${client.status === 'active' ? 'bg-brand-bg text-brand' : 'bg-[#94A3B8]/20 text-[#64748B]'}`}>
          {client.status === 'active' ? 'Actif' : 'Inactif'}
        </div>
        {isCoach && latePaymentsCount > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-[#FEE2E2] text-[#DC2626]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#DC2626" strokeWidth="1.2"/><path d="M5 3v2.5M5 7v.3" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {latePaymentsCount} impayé{latePaymentsCount > 1 ? 's' : ''}
          </div>
        )}
        {isCoach && client.magic_token && (
          <a href={`/c/${client.magic_token}/dashboard?coach=1`} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-white btn-brand px-3 py-1.5 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2h3v3M10 2L5.5 6.5M3 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Espace client
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'apercu' && (
          <ApercuTab client={client} sessions={sessions} checkins={checkins} isCoach={isCoach} onNewSession={() => setActiveTab('seances')} />
        )}
        {activeTab === 'seances' && (
          <SessionsTab client={client} sessions={sessions} isCoach={isCoach} />
        )}
        {activeTab === 'profil' && (
          <ProfilTab client={client} sessions={sessions} checkins={checkins} weightEntries={weightEntries}
            bodyMeasurements={bodyMeasurements} sleepEntries={sleepEntries} performanceEntries={performanceEntries}
            isCoach={isCoach} userPlan={userPlan} />
        )}
        {activeTab === 'entrainements' && (
          <EntrainementsTab workoutLogs={workoutLogs} />
        )}
        {activeTab === 'notes' && (
          <PlanGate featureKey="notes_seance" userPlan={userPlan}>
            <NotesTab clientNotes={clientNotes} coachNotes={coachNotes} clientId={client.id} />
          </PlanGate>
        )}
      </div>
    </main>
  )
}
