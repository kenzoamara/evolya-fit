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

type LibraryExercise = {
  id: string
  name: string
  category: string
  emoji?: string
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
]

const NUTRITION_ITEMS: LibraryExercise[] = [
  { id: 'n1', name: 'Blanc de poulet riz brocoli', category: 'Repas', emoji: '🍗' },
  { id: 'n2', name: 'Boeuf 5% pâtes complet', category: 'Repas', emoji: '🍝' },
  { id: 'n3', name: 'Saumon patate douce épinards', category: 'Repas', emoji: '🐟' },
  { id: 'n4', name: 'Oeufs flocons avoine miel', category: 'Petit-déj', emoji: '🥚' },
  { id: 'n5', name: 'Yaourt grec banane amandes', category: 'Collation', emoji: '🥛' },
]

const HABITS_ITEMS: LibraryExercise[] = [
  { id: 'h1', name: 'Réveil à heure fixe', category: 'Sommeil', emoji: '⏰' },
  { id: 'h2', name: 'Boire 2L d\'eau', category: 'Hydratation', emoji: '💧' },
  { id: 'h3', name: 'Méditation 10min', category: 'Bien-être', emoji: '🧘' },
  { id: 'h4', name: 'Étirement du soir', category: 'Mobilité', emoji: '🤸' },
  { id: 'h5', name: 'Coucher à heure fixe', category: 'Sommeil', emoji: '😴' },
]

export function InteractiveProgram() {
  const [programmeType, setProgrammeType] = useState<'sportif' | 'nutritionnel' | 'habitudes'>('sportif')
  const [open, setOpen] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'ex-1',
      exercise_name: 'Développé couché à la barre',
      sets: 4,
      reps: 6,
      weight_kg: 80,
      rest_seconds: 90,
      notes: null,
      position: 1,
    },
    {
      id: 'ex-2',
      exercise_name: 'Développé incliné haltères',
      sets: 3,
      reps: 8,
      weight_kg: 30,
      rest_seconds: 60,
      notes: null,
      position: 2,
    },
    {
      id: 'ex-3',
      exercise_name: 'Dips (poids du corps ou lesté)',
      sets: 3,
      reps: 8,
      weight_kg: null,
      rest_seconds: 60,
      notes: null,
      position: 3,
    },
    {
      id: 'ex-4',
      exercise_name: 'Élévations latérales haltères',
      sets: 3,
      reps: 10,
      weight_kg: 12,
      rest_seconds: 45,
      notes: null,
      position: 4,
    },
  ])

  const [newExerciseName, setNewExerciseName] = useState('')

  const getLibraryItems = () => {
    switch (programmeType) {
      case 'nutritionnel':
        return NUTRITION_ITEMS
      case 'habitudes':
        return HABITS_ITEMS
      default:
        return LIBRARY_EXERCISES
    }
  }

  const filteredLibrary = getLibraryItems().filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDragStart = (e: React.DragEvent, exId: string) => {
    setDraggedId(exId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragStartLibrary = (e: React.DragEvent, libItem: LibraryExercise) => {
    const data = JSON.stringify(libItem)
    e.dataTransfer.setData('application/json', data)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    setIsDragOver(false)

    // Check if dropping from library
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const libItem = JSON.parse(data)
        const newEx: Exercise = {
          id: `ex-${Date.now()}`,
          exercise_name: libItem.name,
          sets: programmeType === 'sportif' ? 3 : null,
          reps: programmeType === 'sportif' ? 10 : null,
          weight_kg: null,
          rest_seconds: 60,
          notes: null,
          position: exercises.length + 1,
        }
        setExercises([...exercises, newEx])
        return
      }
    } catch {}

    // Internal reordering
    if (!draggedId) return
    const sortedExercises = [...exercises].sort((a, b) => a.position - b.position)
    const draggedIdx = sortedExercises.findIndex(ex => ex.id === draggedId)
    if (draggedIdx === -1) return

    const [draggedEx] = sortedExercises.splice(draggedIdx, 1)
    sortedExercises.splice(targetIdx, 0, draggedEx)
    const updated = sortedExercises.map((ex, idx) => ({ ...ex, position: idx + 1 }))
    setExercises(updated)
    setDraggedId(null)
  }

  const deleteExercise = (exId: string) => {
    const updated = exercises
      .filter(ex => ex.id !== exId)
      .map((ex, idx) => ({ ...ex, position: idx + 1 }))
    setExercises(updated)
  }

  const addExercise = () => {
    if (!newExerciseName.trim()) return
    const newId = `ex-${Date.now()}`
    const newEx: Exercise = {
      id: newId,
      exercise_name: newExerciseName,
      sets: programmeType === 'sportif' ? 3 : null,
      reps: programmeType === 'sportif' ? 10 : null,
      weight_kg: null,
      rest_seconds: 60,
      notes: null,
      position: exercises.length + 1,
    }
    setExercises([...exercises, newEx])
    setNewExerciseName('')
  }

  const updateExercise = (exId: string, field: keyof Exercise, val: any) => {
    setExercises(exercises.map(ex =>
      ex.id === exId ? { ...ex, [field]: val } : ex
    ))
  }

  const sortedExercises = [...exercises].sort((a, b) => a.position - b.position)

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E2E8F0] flex h-[600px]">
      {/* ── SIDEBAR NAVIGATION ── */}
      <div className="w-48 bg-[#FAFBFD] border-r border-[#E2E8F0] p-4 flex flex-col overflow-hidden">
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">Programme</p>
          <div className="space-y-2">
            <button
              onClick={() => { setProgrammeType('sportif'); setExercises(exercises.slice(0, 4)) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                programmeType === 'sportif'
                  ? 'bg-[#4E9B6F] text-white'
                  : 'text-[#0D1F3C] hover:bg-[#E2E8F0]'
              }`}
            >
              Sportif
            </button>
            <button
              onClick={() => { setProgrammeType('nutritionnel'); setSearch('') }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                programmeType === 'nutritionnel'
                  ? 'bg-[#4E9B6F] text-white'
                  : 'text-[#0D1F3C] hover:bg-[#E2E8F0]'
              }`}
            >
              Nutritionnel
            </button>
            <button
              onClick={() => { setProgrammeType('habitudes'); setSearch('') }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                programmeType === 'habitudes'
                  ? 'bg-[#4E9B6F] text-white'
                  : 'text-[#0D1F3C] hover:bg-[#E2E8F0]'
              }`}
            >
              Habitude
            </button>
          </div>
        </div>
      </div>

      {/* ── LIBRARY PANEL ── */}
      <div className="w-64 bg-[#F8FAFB] border-r border-[#E2E8F0] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#E2E8F0]">
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
                {item.emoji && <span className="text-[14px] shrink-0">{item.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0D1F3C] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#94A3B8]">{item.category}</p>
                </div>
                <Plus size={11} className="text-[#4E9B6F] shrink-0 opacity-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white rounded-xl overflow-hidden border border-[#E2E8F0] flex flex-col flex-1 m-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#FAFBFD] transition-all ${
              isDragOver ? 'bg-[#EEF9F3] border-b border-[#4E9B6F]' : 'border-b border-[#F1F5F9]'
            }`}
            onClick={() => setOpen(!open)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 0)}
          >
            <span className="w-6 h-6 rounded-lg bg-[#EEF9F3] text-[#4E9B6F] text-[11px] font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <input
              value={programmeType === 'sportif' ? 'Jour 1 - Push' : programmeType === 'nutritionnel' ? 'Jour 1 - Nutrition' : 'Jour 1 - Habitudes'}
              onClick={e => e.stopPropagation()}
              readOnly
              className="flex-1 text-[13px] font-semibold text-[#0D1F3C] bg-transparent focus:outline-none"
            />
            <span className="text-[11px] text-[#94A3B8] shrink-0">
              {exercises.length} {programmeType === 'sportif' ? 'ex.' : programmeType === 'nutritionnel' ? 'repas' : 'habit.'}
            </span>
            {open ? (
              <ChevronDown size={14} className="text-[#94A3B8]" />
            ) : (
              <ChevronRight size={14} className="text-[#94A3B8]" />
            )}
          </div>

          {open && (
            <div className="px-4 pb-4 border-t border-[#F1F5F9] flex-1 overflow-y-auto">
              <div className="pt-2 space-y-0">
                {sortedExercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    draggable
                    onDragStart={e => handleDragStart(e, ex.id)}
                    onDragOver={e => handleDragOver(e)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, idx)}
                    className="py-2 border-b border-[#F1F5F9] last:border-0 cursor-move hover:bg-[#FAFBFD] px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <input
                            value={ex.exercise_name}
                            onChange={e => updateExercise(ex.id, 'exercise_name', e.target.value)}
                            className="flex-1 text-[13px] font-medium text-[#0D1F3C] bg-transparent focus:outline-none placeholder:text-[#CBD5E1]"
                          />
                        </div>
                      </div>

                      {programmeType === 'sportif' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={1}
                            value={ex.sets ?? ''}
                            onChange={e => updateExercise(ex.id, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="—"
                            title="Séries"
                            className="w-9 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white text-[#0D1F3C]"
                          />
                          <span className="text-[10px] text-[#CBD5E1]">×</span>
                          <input
                            type="number"
                            min={1}
                            value={ex.reps ?? ''}
                            onChange={e => updateExercise(ex.id, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="—"
                            title="Reps"
                            className="w-9 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white text-[#0D1F3C]"
                          />
                          <span className="text-[10px] text-[#CBD5E1]">reps</span>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={ex.weight_kg ?? ''}
                            onChange={e => updateExercise(ex.id, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="—"
                            title="Charge kg"
                            className="w-11 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white text-[#0D1F3C]"
                          />
                          <span className="text-[10px] text-[#CBD5E1]">kg</span>
                        </div>
                      )}

                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="p-1 text-[#CBD5E1] hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new exercise */}
              <div className="pt-3 mt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newExerciseName}
                    onChange={e => setNewExerciseName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addExercise()}
                    placeholder={programmeType === 'sportif' ? 'Ajouter un exercice...' : programmeType === 'nutritionnel' ? 'Ajouter un repas...' : 'Ajouter une habitude...'}
                    className="flex-1 text-[13px] font-medium text-[#0D1F3C] bg-transparent focus:outline-none placeholder:text-[#CBD5E1]"
                  />
                  <button
                    onClick={addExercise}
                    className="text-[#4E9B6F] hover:text-[#3A8B5F] text-sm font-semibold"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
