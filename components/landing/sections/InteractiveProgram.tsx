'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronRight, GripVertical, Plus, Search } from 'lucide-react'

type Exercise = {
  id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  rest_seconds: number | null
  notes: string | null
  position: number
}

type Day = {
  id: string
  day_number: number
  title: string
  exercises: Exercise[]
}

type LibraryExercise = {
  id: string
  name: string
  category: string
}

const LIBRARY_EXERCISES: LibraryExercise[] = [
  { id: '1', name: 'Développé couché barre', category: 'Pectoraux' },
  { id: '2', name: 'Développé incliné haltères', category: 'Pectoraux' },
  { id: '3', name: 'Dips', category: 'Triceps' },
  { id: '4', name: 'Développé Arnold', category: 'Epaules' },
  { id: '5', name: 'Tirage horizontal barre', category: 'Dos' },
  { id: '6', name: 'Tirage lat front', category: 'Dos' },
  { id: '7', name: 'Curl haltères', category: 'Biceps' },
  { id: '8', name: 'Extension triceps corde', category: 'Triceps' },
  { id: '9', name: 'Développé assis', category: 'Epaules' },
  { id: '10', name: 'Élévations latérales', category: 'Epaules' },
  { id: '11', name: 'Tirage à la poitrine', category: 'Dos' },
  { id: '12', name: 'Rowing haltères', category: 'Dos' },
  { id: '13', name: 'Squats barre', category: 'Jambes' },
  { id: '14', name: 'Leg press', category: 'Jambes' },
  { id: '15', name: 'Leg curl', category: 'Jambes' },
  { id: '16', name: 'Flexion abdominale', category: 'Abdos' },
  { id: '17', name: 'Poulies croisées', category: 'Cardio' },
  { id: '18', name: 'Burpees', category: 'HIIT' },
  { id: '19', name: 'Mountain climbers', category: 'Cardio' },
  { id: '20', name: 'Tractions', category: 'Dos' },
]

const NUTRITION_ITEMS: LibraryExercise[] = [
  { id: 'n1', name: 'Blanc de poulet riz brocoli', category: 'Repas Principal' },
  { id: 'n2', name: 'Boeuf 5% pâtes complet', category: 'Repas Principal' },
  { id: 'n3', name: 'Saumon patate douce épinards', category: 'Repas Principal' },
  { id: 'n4', name: 'Oeufs flocons avoine miel', category: 'Petit-déjeuner' },
  { id: 'n5', name: 'Yaourt grec banane amandes', category: 'Collation' },
  { id: 'n6', name: 'Riz blanc sauce tomate', category: 'Accompagnement' },
  { id: 'n7', name: 'Pâtes al dente', category: 'Accompagnement' },
  { id: 'n8', name: 'Dinde rôtie légumes', category: 'Repas Principal' },
  { id: 'n9', name: 'Whey protéine + banana', category: 'Collation' },
  { id: 'n10', name: 'Thon boîte riz', category: 'Repas Principal' },
]

const HABITS_ITEMS: LibraryExercise[] = [
  { id: 'h1', name: 'Réveil à heure fixe', category: 'Sommeil' },
  { id: 'h2', name: 'Boire 2L d\'eau', category: 'Hydratation' },
  { id: 'h3', name: 'Méditation 10min', category: 'Bien-être' },
  { id: 'h4', name: 'Étirement du soir', category: 'Mobilité' },
  { id: 'h5', name: 'Coucher à heure fixe', category: 'Sommeil' },
  { id: 'h6', name: 'Marche 30min', category: 'Activité' },
  { id: 'h7', name: 'Respiration profonde', category: 'Bien-être' },
  { id: 'h8', name: 'Lecture 20min', category: 'Mental' },
  { id: 'h9', name: 'Jambes surélevées', category: 'Récupération' },
  { id: 'h10', name: 'Hydratation matin', category: 'Hydratation' },
]

export function InteractiveProgram() {
  const [programmeType, setProgrammeType] = useState<'sportif' | 'nutritionnel' | 'habitudes'>('sportif')
  const [search, setSearch] = useState('')

  // Initialize 7 days with sample data
  const initializeDays = (): Day[] => {
    return Array.from({ length: 7 }, (_, i) => ({
      id: `day-${i + 1}`,
      day_number: i + 1,
      title: [
        'Push - Poitrine/Epaules/Triceps',
        'Pull - Dos/Biceps',
        'Jambes',
        'Repos actif',
        'Full body',
        'Cardio',
        'Étirement'
      ][i] || `Jour ${i + 1}`,
      exercises: i === 0 ? [
        {
          id: 'ex-1',
          exercise_name: 'Développé couché barre',
          sets: programmeType === 'sportif' ? 4 : null,
          reps: programmeType === 'sportif' ? 6 : null,
          weight_kg: programmeType === 'sportif' ? 80 : null,
          position: 1,
          rest_seconds: 90,
          notes: null
        },
        {
          id: 'ex-2',
          exercise_name: 'Développé incliné haltères',
          sets: programmeType === 'sportif' ? 3 : null,
          reps: programmeType === 'sportif' ? 8 : null,
          weight_kg: programmeType === 'sportif' ? 30 : null,
          position: 2,
          rest_seconds: 60,
          notes: null
        },
        {
          id: 'ex-3',
          exercise_name: 'Dips',
          sets: programmeType === 'sportif' ? 3 : null,
          reps: programmeType === 'sportif' ? 8 : null,
          weight_kg: null,
          position: 3,
          rest_seconds: 60,
          notes: null
        },
      ] : []
    }))
  }

  const [days, setDays] = useState<Day[]>(initializeDays())
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [draggedExId, setDraggedExId] = useState<string | null>(null)

  const getLibraryItems = (): LibraryExercise[] => {
    switch (programmeType) {
      case 'nutritionnel': return NUTRITION_ITEMS
      case 'habitudes': return HABITS_ITEMS
      default: return LIBRARY_EXERCISES
    }
  }

  const filteredLibrary = getLibraryItems().filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const currentDay = days[selectedDayIdx]
  const sortedExercises = [...currentDay.exercises].sort((a, b) => a.position - b.position)

  const handleDragStartLibrary = (e: React.DragEvent, libItem: LibraryExercise) => {
    const data = JSON.stringify(libItem)
    e.dataTransfer.setData('application/json', data)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragStartExercise = (e: React.DragEvent, exId: string) => {
    setDraggedExId(exId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropDay = (e: React.DragEvent) => {
    e.preventDefault()

    // Try to drop from library
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const libItem = JSON.parse(data) as LibraryExercise
        const newEx: Exercise = {
          id: `ex-${Date.now()}`,
          exercise_name: libItem.name,
          sets: programmeType === 'sportif' ? 3 : null,
          reps: programmeType === 'sportif' ? 10 : null,
          weight_kg: null,
          rest_seconds: 60,
          notes: null,
          position: currentDay.exercises.length + 1,
        }
        setDays(prev => prev.map((d, idx) =>
          idx === selectedDayIdx
            ? { ...d, exercises: [...d.exercises, newEx] }
            : d
        ))
        return
      }
    } catch {}

    // Reorder within day
    if (!draggedExId) return
    const exIdx = currentDay.exercises.findIndex(ex => ex.id === draggedExId)
    if (exIdx === -1) return

    const newExercises = [...currentDay.exercises]
    const [draggedEx] = newExercises.splice(exIdx, 1)
    newExercises.splice(exIdx, 0, draggedEx)

    setDays(prev => prev.map((d, idx) =>
      idx === selectedDayIdx ? { ...d, exercises: newExercises } : d
    ))
    setDraggedExId(null)
  }

  const deleteExercise = (exId: string) => {
    setDays(prev => prev.map((d, idx) =>
      idx === selectedDayIdx
        ? { ...d, exercises: d.exercises.filter(ex => ex.id !== exId) }
        : d
    ))
  }

  const updateExercise = (exId: string, field: keyof Exercise, val: any) => {
    setDays(prev => prev.map((d, idx) =>
      idx === selectedDayIdx
        ? { ...d, exercises: d.exercises.map(ex => ex.id === exId ? { ...ex, [field]: val } : ex) }
        : d
    ))
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E2E8F0] flex flex-col h-screen">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#E2E8F0] bg-[#FAFBFD]">
        <div className="text-[14px] font-bold text-[#0D1F3C]">Evolya'Fit</div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { setProgrammeType('sportif'); setDays(initializeDays()) }}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
              programmeType === 'sportif'
                ? 'bg-[#4E9B6F] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#0D1F3C] hover:bg-[#F8FAFB]'
            }`}
          >
            Sportif
          </button>
          <button
            onClick={() => { setProgrammeType('nutritionnel'); setDays(initializeDays()); setSearch('') }}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
              programmeType === 'nutritionnel'
                ? 'bg-[#4E9B6F] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#0D1F3C] hover:bg-[#F8FAFB]'
            }`}
          >
            Nutritionnel
          </button>
          <button
            onClick={() => { setProgrammeType('habitudes'); setDays(initializeDays()); setSearch('') }}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
              programmeType === 'habitudes'
                ? 'bg-[#4E9B6F] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#0D1F3C] hover:bg-[#F8FAFB]'
            }`}
          >
            Habitude
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LIBRARY ── */}
        <div className="w-64 bg-[#F8FAFB] border-r border-[#E2E8F0] flex flex-col">
          <div className="p-3 border-b border-[#E2E8F0] shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Chercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:border-[#4E9B6F]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredLibrary.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStartLibrary(e, item)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#EEF9F3] cursor-grab active:cursor-grabbing rounded transition-colors group"
                >
                  <GripVertical size={11} className="text-[#CBD5E1] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0D1F3C] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#94A3B8]">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Days tabs */}
          <div className="flex overflow-x-auto border-b border-[#E2E8F0] bg-[#FAFBFD] shrink-0">
            {days.map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-4 py-3 text-[12px] font-semibold border-b-2 transition-colors shrink-0 ${
                  idx === selectedDayIdx
                    ? 'text-[#4E9B6F] border-[#4E9B6F]'
                    : 'text-[#94A3B8] border-transparent hover:text-[#0D1F3C]'
                }`}
              >
                Jour {day.day_number}
              </button>
            ))}
          </div>

          {/* Day content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div
              className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDropDay}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] bg-[#FAFBFD]">
                <span className="w-6 h-6 rounded-lg bg-[#EEF9F3] text-[#4E9B6F] text-[11px] font-bold flex items-center justify-center shrink-0">
                  {currentDay.day_number}
                </span>
                <span className="flex-1 text-[13px] font-semibold text-[#0D1F3C]">{currentDay.title}</span>
                <span className="text-[11px] text-[#94A3B8]">{sortedExercises.length} {programmeType === 'sportif' ? 'ex.' : 'élément'}</span>
              </div>

              <div className="p-4">
                {sortedExercises.length === 0 ? (
                  <p className="text-[12px] text-[#CBD5E1] text-center py-4">Glissez des éléments ici</p>
                ) : (
                  <div className="space-y-2">
                    {sortedExercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        draggable
                        onDragStart={e => handleDragStartExercise(e, ex.id)}
                        onDragOver={e => e.preventDefault()}
                        className="p-3 bg-[#FAFBFD] border border-[#E2E8F0] rounded-lg cursor-move hover:border-[#4E9B6F] hover:bg-[#F0FFF8] transition-colors group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical size={12} className="text-[#CBD5E1] opacity-0 group-hover:opacity-100" />
                          <input
                            value={ex.exercise_name}
                            onChange={e => updateExercise(ex.id, 'exercise_name', e.target.value)}
                            className="flex-1 text-[13px] font-medium text-[#0D1F3C] bg-transparent focus:outline-none"
                          />
                          <button
                            onClick={() => deleteExercise(ex.id)}
                            className="p-1 text-[#CBD5E1] hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {programmeType === 'sportif' && (
                          <div className="flex items-center gap-1 flex-wrap text-[11px]">
                            <input type="number" min={1} value={ex.sets ?? ''} onChange={e => updateExercise(ex.id, 'sets', e.target.value ? parseInt(e.target.value) : null)} className="w-8 text-center border border-[#E2E8F0] rounded px-1 bg-white" />
                            <span className="text-[#CBD5E1]">×</span>
                            <input type="number" min={1} value={ex.reps ?? ''} onChange={e => updateExercise(ex.id, 'reps', e.target.value ? parseInt(e.target.value) : null)} className="w-8 text-center border border-[#E2E8F0] rounded px-1 bg-white" />
                            <span className="text-[#CBD5E1]">reps ·</span>
                            <input type="number" min={0} step={0.5} value={ex.weight_kg ?? ''} onChange={e => updateExercise(ex.id, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)} className="w-10 text-center border border-[#E2E8F0] rounded px-1 bg-white" />
                            <span className="text-[#CBD5E1]">kg</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
