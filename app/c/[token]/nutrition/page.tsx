'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

type NutritionProgramme = { id: string; title: string; content: string }
type NutritionLog = { id: string; date: string; meal_type: string; item_name: string; calories: number | null; notes: string | null }

const MEAL_TYPES = [
  { key: 'matin',     label: 'Matin',     emoji: '☀️' },
  { key: 'midi',      label: 'Midi',      emoji: '🌤️' },
  { key: 'soir',      label: 'Soir',      emoji: '🌙' },
  { key: 'collation', label: 'Collation', emoji: '🍎' },
]

const COLOR = '#22C55E'
const COLOR_BG = '#F0FDF4'
const COLOR_LIGHT = '#DCFCE7'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function NutritionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const coachView = searchParams.get('coach') === '1'
  const token = params?.token as string
  const today = todayStr()

  const [tab, setTab] = useState<'programme' | 'journal'>('programme')
  const [programme, setProgramme] = useState<NutritionProgramme | null>(null)
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [mealType, setMealType] = useState('matin')
  const [itemName, setItemName] = useState('')
  const [calories, setCalories] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/client/nutrition?token=${token}`).then(r => r.json()),
    ]).then(([data]) => {
      setProgramme(data.programme ?? null)
      setLogs(data.logs ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  async function addLog() {
    if (!itemName.trim()) return
    setSaving(true)
    const res = await fetch('/api/client/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, date: today, meal_type: mealType, item_name: itemName.trim(), calories: calories ? parseInt(calories) : null }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setLogs(prev => [data.log, ...prev])
    setItemName(''); setCalories(''); setShowForm(false)
    toast.success('Repas ajouté !')
  }

  async function deleteLog(id: string) {
    await fetch(`/api/client/nutrition?token=${token}&id=${id}`, { method: 'DELETE' })
    setLogs(prev => prev.filter(l => l.id !== id))
    toast.success('Supprimé')
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${COLOR} transparent transparent transparent` }} />
    </div>
  )

  const todayLogs = logs.filter(l => l.date === today)
  const totalCals = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0)

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: COLOR_BG }}>🥗</div>
        <h1 className="text-[20px] font-bold text-[#0D1F3C]">Nutrition</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F8FAFB] rounded-xl mb-5">
        {(['programme', 'journal'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={tab === t ? { background: COLOR, color: '#fff' } : { color: '#64748B' }}
          >
            {t === 'programme' ? 'Mon programme' : "Journal du jour"}
          </button>
        ))}
      </div>

      {tab === 'programme' ? (
        programme ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <p className="text-[15px] font-bold text-[#0D1F3C] mb-3">{programme.title}</p>
            <div
              className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: 'inherit' }}
            >
              {programme.content}
            </div>
          </div>
        ) : (
          <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-4 flex items-start gap-3">
            <span className="text-[22px] leading-none mt-0.5">⏳</span>
            <div>
              <p className="text-[14px] font-bold text-[#92400E] mb-0.5">Programme en préparation</p>
              <p className="text-[13px] text-[#B45309]">Ton coach prépare ton programme nutritionnel. Le journal du jour reste accessible.</p>
            </div>
          </div>
        )
      ) : (
        <>
          {/* Daily summary */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl p-4">
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Repas aujourd'hui</p>
              <p className="text-[24px] font-bold text-[#0D1F3C]">{todayLogs.length}</p>
            </div>
            {totalCals > 0 && (
              <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl p-4">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Calories estimées</p>
                <p className="text-[24px] font-bold" style={{ color: COLOR }}>{totalCals} kcal</p>
              </div>
            )}
          </div>

          {/* Add button */}
          {!coachView && <button
            onClick={() => setShowForm(v => !v)}
            className="w-full mb-4 py-3 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-colors"
            style={showForm ? { background: COLOR_BG, color: COLOR } : { background: COLOR, color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}
          >
            <Plus size={16} />
            {showForm ? 'Annuler' : 'Ajouter un repas'}
          </button>}

          {/* Add form */}
          {showForm && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4 space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">Moment du repas</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {MEAL_TYPES.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMealType(m.key)}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold border transition-colors"
                      style={mealType === m.key
                        ? { background: COLOR_BG, color: COLOR, borderColor: COLOR_LIGHT }
                        : { background: '#F8FAFB', color: '#64748B', borderColor: '#E2E8F0' }
                      }
                    >
                      <span className="text-[16px]">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Aliment / repas</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="Poulet grillé, riz, salade…"
                  className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none"
                  style={{ ['--tw-ring-color' as string]: COLOR }}
                  onFocus={e => e.target.style.borderColor = COLOR}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">Calories (optionnel)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  placeholder="450"
                  min={0}
                  className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none"
                  onFocus={e => e.target.style.borderColor = COLOR}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <button
                onClick={addLog}
                disabled={saving || !itemName.trim()}
                className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity disabled:opacity-40"
                style={{ background: COLOR }}
              >
                {saving ? 'Enregistrement…' : 'Valider'}
              </button>
            </div>
          )}

          {/* Today's logs by meal type */}
          {MEAL_TYPES.map(m => {
            const mLogs = todayLogs.filter(l => l.meal_type === m.key)
            if (mLogs.length === 0) return null
            return (
              <div key={m.key} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden mb-3">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F8FAFC]">
                  <span className="text-[16px]">{m.emoji}</span>
                  <p className="text-[13px] font-semibold text-[#0D1F3C]">{m.label}</p>
                  {mLogs.reduce((s, l) => s + (l.calories ?? 0), 0) > 0 && (
                    <span className="ml-auto text-[11px] font-medium" style={{ color: COLOR }}>
                      {mLogs.reduce((s, l) => s + (l.calories ?? 0), 0)} kcal
                    </span>
                  )}
                </div>
                {mLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F8FAFC] last:border-0">
                    <p className="flex-1 text-[13px] text-[#0D1F3C]">{log.item_name}</p>
                    {log.calories != null && <span className="text-[11px] text-[#94A3B8]">{log.calories} kcal</span>}
                    {!coachView && <button onClick={() => deleteLog(log.id)} className="text-[#E2E8F0] hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>}
                  </div>
                ))}
              </div>
            )
          })}

          {todayLogs.length === 0 && !showForm && (
            <div className="text-center py-10">
              <span className="text-4xl">🥗</span>
              <p className="text-[14px] font-semibold text-[#0D1F3C] mt-3 mb-1">Rien enregistré aujourd'hui</p>
              <p className="text-[12px] text-[#94A3B8]">Ajoute ton premier repas de la journée.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
