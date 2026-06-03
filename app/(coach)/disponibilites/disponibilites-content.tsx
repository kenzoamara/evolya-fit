'use client'

import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DURATIONS = [30, 45, 60, 90, 120]

type Availability = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

type Request = {
  id: string
  requested_date: string
  requested_time: string
  duration_minutes: number
  note: string | null
  status: string
  clients: { full_name: string } | null
}

type Props = {
  initialAvails: Availability[]
  initialRequests: Request[]
}

export function DisponibilitesContent({ initialAvails, initialRequests }: Props) {
  const [avails, setAvails] = useState<Availability[]>(initialAvails)
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ day_of_week: 0, start_time: '09:00', end_time: '18:00', slot_duration_minutes: 60 })
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAdd() {
    setSaving(true)
    setAddError(null)
    try {
      const res = await fetch('/api/availabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAddError(data.error ?? 'Erreur lors de l\'ajout. La migration SQL a-t-elle été exécutée ?')
        setSaving(false)
        return
      }
      if (data.availability) setAvails(a => [...a, data.availability])
      setSaving(false)
      setAdding(false)
    } catch {
      setAddError('Erreur réseau.')
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/availabilities?id=${id}`, { method: 'DELETE' })
    setAvails(a => a.filter(x => x.id !== id))
  }

  async function handleRequest(id: string, status: 'confirmed' | 'declined') {
    await fetch('/api/session-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setRequests(r => r.filter(x => x.id !== id))
  }

  const groupedAvails = DAYS.map((day, i) => ({
    day,
    index: i,
    slots: avails.filter(a => a.day_of_week === i),
  }))

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl px-4 sm:px-8 py-8 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#0D1F3C]">Disponibilités</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Définissez vos créneaux — vos clients pourront réserver directement.
          </p>
        </div>

        {/* Demandes en attente */}
        {requests.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-[#0D1F3C] mb-3">
              Demandes en attente ({requests.length})
            </p>
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1F3C]">{r.clients?.full_name ?? 'Client'}</p>
                    <p className="text-sm text-[#475569] mt-0.5">
                      {new Date(r.requested_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.requested_time}
                      {' '}&middot; {r.duration_minutes} min
                    </p>
                    {r.note && <p className="text-xs text-[#94A3B8] mt-1 italic">"{r.note}"</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleRequest(r.id, 'confirmed')}
                      className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#22C55E] flex items-center justify-center hover:bg-[#DCFCE7] transition-colors"
                      title="Confirmer"
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleRequest(r.id, 'declined')}
                      className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center hover:bg-[#FEE2E2] transition-colors"
                      title="Refuser"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Créneaux récurrents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#0D1F3C]">Créneaux récurrents</p>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {adding && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-4 space-y-4">
              <p className="text-sm font-medium text-[#0D1F3C]">Nouveau créneau</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#64748B] mb-1.5">Jour</label>
                  <select
                    value={form.day_of_week}
                    onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none"
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1.5">Durée d'un créneau</label>
                  <select
                    value={form.slot_duration_minutes}
                    onChange={e => setForm(f => ({ ...f, slot_duration_minutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none"
                  >
                    {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1.5">Début</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1.5">Fin</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
              {addError && (
                <p className="text-xs text-[#EF4444] bg-[#FEF2F2] px-3 py-2 rounded-lg">{addError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter ce créneau'}
                </button>
                <button
                  onClick={() => { setAdding(false); setAddError(null) }}
                  className="px-4 py-2.5 text-sm text-[#64748B] border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFB] transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste par jour */}
          {groupedAvails.filter(g => g.slots.length > 0).length === 0 && !adding && (
            <div className="text-center py-10 bg-white border border-dashed border-[#E2E8F0] rounded-2xl">
              <p className="text-sm text-[#94A3B8]">Aucun créneau défini pour l'instant</p>
            </div>
          )}

          <div className="space-y-3">
            {groupedAvails.filter(g => g.slots.length > 0).map(g => (
              <div key={g.index} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#F1F5F9] bg-[#F8FAFB]">
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">{g.day}</p>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {g.slots.map(s => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm text-[#0D1F3C] font-medium">{s.start_time} – {s.end_time}</span>
                        <span className="text-xs text-[#94A3B8] ml-2">créneaux de {s.slot_duration_minutes} min</span>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-[#CBD5E1] hover:text-[#EF4444] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
