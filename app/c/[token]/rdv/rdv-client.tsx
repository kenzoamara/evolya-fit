'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type Availability = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

type Props = {
  token: string
  availabilities: Availability[]
  existingRequests: { requested_date: string; requested_time: string; status: string }[]
}

function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let cur = sh * 60 + sm
  const endMin = eh * 60 + em
  while (cur + duration <= endMin) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += duration
  }
  return slots
}

function dateToISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export function RdvClient({ token, availabilities, existingRequests }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Lundi de la semaine affichée
  const monday = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff + weekOffset * 7)
    return d
  }, [weekOffset])

  // Les 7 jours de la semaine
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [monday])

  // Créneaux disponibles pour un jour
  function getSlotsForDate(date: Date) {
    const dow = date.getDay() === 0 ? 6 : date.getDay() - 1 // 0=Lun
    const iso = dateToISO(date)
    const dayAvails = availabilities.filter(a => a.day_of_week === dow)
    const allSlots: string[] = []
    for (const a of dayAvails) {
      allSlots.push(...generateSlots(a.start_time, a.end_time, a.slot_duration_minutes))
    }
    // Filtrer les créneaux déjà demandés
    const taken = existingRequests
      .filter(r => r.requested_date === iso)
      .map(r => r.requested_time)
    // Dédupliquer (si le coach a 2 créneaux identiques) + filtrer les pris
    const seen = new Set<string>()
    return allSlots.filter(s => {
      if (seen.has(s)) return false
      seen.add(s)
      return !taken.includes(s)
    })
  }

  // Jours avec créneaux
  const daysWithSlots = useMemo(() => {
    return weekDays.map(d => ({
      date: d,
      slots: d >= today ? getSlotsForDate(d) : [],
      isPast: d < today,
    }))
  }, [weekDays, availabilities])

  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const selectedSlots = useMemo(() => selectedDay ? getSlotsForDate(selectedDay) : [], [selectedDay])

  async function handleBook() {
    if (!selected) return
    setSubmitting(true)
    await fetch('/api/session-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        requested_date: selected.date,
        requested_time: selected.time,
        duration_minutes: availabilities.find(a =>
          a.day_of_week === (new Date(selected.date).getDay() === 0 ? 6 : new Date(selected.date).getDay() - 1)
        )?.slot_duration_minutes ?? 60,
        note,
      }),
    })
    setSubmitting(false)
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-sm space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--brand)' }}>
            <Check size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#0D1F3C] mb-2">Demande envoyée !</h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Votre coach va confirmer le créneau.
              Vous recevrez une notification dès validation.
            </p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 text-left">
            <p className="text-sm font-medium text-[#0D1F3C]">
              {new Date(selected!.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-sm text-[#64748B]">{selected!.time}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="w-full max-w-2xl px-4 sm:px-8 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Réserver une séance</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Choisissez un créneau disponible</p>
        </div>

        {availabilities.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-2xl">
            <p className="text-sm text-[#94A3B8]">Votre coach n'a pas encore défini ses disponibilités.</p>
          </div>
        ) : (
          <>
            {/* Navigation semaine */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setWeekOffset(w => w - 1); setSelectedDay(null); setSelected(null) }}
                disabled={weekOffset === 0}
                className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFB] transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-medium text-[#0D1F3C]">
                {MONTHS_FR[monday.getMonth()]} {monday.getFullYear()}
              </p>
              <button
                onClick={() => { setWeekOffset(w => w + 1); setSelectedDay(null); setSelected(null) }}
                className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFB] transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Grille jours */}
            <div className="grid grid-cols-7 gap-1.5">
              {daysWithSlots.map(({ date, slots, isPast }) => {
                const iso = dateToISO(date)
                const isSelected = selectedDay && dateToISO(selectedDay) === iso
                const hasSlots = slots.length > 0
                return (
                  <button
                    key={iso}
                    onClick={() => {
                      if (!hasSlots || isPast) return
                      setSelectedDay(date)
                      setSelected(null)
                    }}
                    disabled={!hasSlots || isPast}
                    className={`flex flex-col items-center py-2.5 rounded-xl text-xs transition-all ${
                      isSelected ? 'text-white' :
                      hasSlots && !isPast ? 'bg-white border border-[#E2E8F0] text-[#0D1F3C] hover:border-[var(--brand)]' :
                      'bg-[#F8FAFB] text-[#CBD5E1] cursor-not-allowed'
                    }`}
                    style={isSelected ? { backgroundColor: 'var(--brand)' } : {}}
                  >
                    <span className="font-medium">{DAYS_FR[date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
                    <span className="text-[11px] mt-0.5">{date.getDate()}</span>
                    {hasSlots && !isPast && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: 'var(--brand)' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Créneaux du jour sélectionné */}
            {selectedDay && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0D1F3C]">
                  Créneaux disponibles — {selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {selectedSlots.length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">Aucun créneau disponible ce jour.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedSlots.map(time => {
                      const isSel = selected?.date === dateToISO(selectedDay) && selected?.time === time
                      return (
                        <button
                          key={time}
                          onClick={() => setSelected({ date: dateToISO(selectedDay), time })}
                          className="py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                          style={isSel ? { borderColor: 'var(--brand)', backgroundColor: 'color-mix(in srgb, var(--brand) 10%, white)', color: 'var(--brand)' } : { borderColor: '#E2E8F0', backgroundColor: 'white', color: '#475569' }}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Note + confirmation */}
            {selected && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0D1F3C] mb-2">
                    Message pour votre coach (optionnel)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="Ex : séance de renforcement musculaire..."
                    className="w-full px-4 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-all resize-none"
                  />
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
                  <p className="text-xs text-[#94A3B8] mb-1">Votre demande</p>
                  <p className="text-sm font-semibold text-[#0D1F3C]">
                    {new Date(selected.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selected.time}
                  </p>
                </div>
                <button
                  onClick={handleBook}
                  disabled={submitting}
                  className="w-full py-3.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {submitting ? 'Envoi...' : 'Envoyer la demande →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
