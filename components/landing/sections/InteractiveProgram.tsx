'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'

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

export function InteractiveProgram() {
  const [open, setOpen] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)

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

  const handleDragStart = (e: React.DragEvent, exId: string) => {
    setDraggedId(exId)
    e.dataTransfer.effectAllowed = 'move'
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
      sets: 3,
      reps: 10,
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
    <div className="bg-white rounded-xl overflow-hidden border border-[#E2E8F0]">
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#FAFBFD] transition-all ${
          isDragOver ? 'bg-[#EEF9F3] border-b border-[#4E9B6F]' : 'border-b border-[#F1F5F9]'
        }`}
        onClick={() => setOpen(!open)}
      >
        <span className="w-6 h-6 rounded-lg bg-[#EEF9F3] text-[#4E9B6F] text-[11px] font-bold flex items-center justify-center shrink-0">
          1
        </span>
        <input
          value="Jour 1 - Push"
          onClick={e => e.stopPropagation()}
          readOnly
          className="flex-1 text-[13px] font-semibold text-[#0D1F3C] bg-transparent focus:outline-none"
        />
        <span className="text-[11px] text-[#94A3B8] shrink-0">
          {exercises.length} ex.
        </span>
        {open ? (
          <ChevronDown size={14} className="text-[#94A3B8]" />
        ) : (
          <ChevronRight size={14} className="text-[#94A3B8]" />
        )}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9]">
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
                placeholder="Ajouter un exercice..."
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
  )
}
