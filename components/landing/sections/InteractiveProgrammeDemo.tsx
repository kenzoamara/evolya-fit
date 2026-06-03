'use client'

import { useState, useRef } from 'react'

type Exercise = {
  id: string
  name: string
  sets?: number
  reps?: number
  weight?: string
  completed?: boolean
}

type Phase = {
  id: string
  name: string
  exercises: Exercise[]
}

const INITIAL_PHASES: Phase[] = [
  {
    id: 'phase-1',
    name: 'Phase 1-3j',
    exercises: [
      { id: 'ex-1', name: 'Push - Poitrine/Epaules/Triceps', sets: 6, reps: 0, weight: '' },
      { id: 'ex-2', name: 'Développé couché à la barre', sets: 4, reps: 6, weight: '80 kg' },
      { id: 'ex-3', name: 'Développé incliné haltères', sets: 3, reps: 8, weight: '30 kg' },
      { id: 'ex-4', name: 'Dips (poids du corps ou lesté)', sets: 3, reps: 8, weight: '—' },
      { id: 'ex-5', name: 'Développé militaire à la barre', sets: 3, reps: 8, weight: '50 kg' },
      { id: 'ex-6', name: 'Élévations latérales haltères', sets: 3, reps: 10, weight: '12 kg', completed: true },
      { id: 'ex-7', name: 'Extension triceps à la corde', sets: 3, reps: 10, weight: '20 kg' },
    ]
  }
]

export function InteractiveProgrammeDemo() {
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [newExoInput, setNewExoInput] = useState('')
  const demoRef = useRef<HTMLDivElement>(null)

  // Check if interaction is within demo bounds
  const isInDemo = (target: EventTarget | null) => {
    if (!target || !demoRef.current) return false
    return demoRef.current.contains(target as Node)
  }

  const addExercise = () => {
    if (!newExoInput.trim()) return
    const updatedPhases = phases.map(p => ({
      ...p,
      exercises: [
        ...p.exercises,
        {
          id: `ex-${Date.now()}`,
          name: newExoInput.trim(),
          sets: 3,
          reps: 8,
          weight: '—'
        }
      ]
    }))
    setPhases(updatedPhases)
    setNewExoInput('')
  }

  const deleteExercise = (phaseId: string, exoId: string) => {
    const updatedPhases = phases.map(p =>
      p.id === phaseId
        ? { ...p, exercises: p.exercises.filter(e => e.id !== exoId) }
        : p
    )
    setPhases(updatedPhases)
  }

  const toggleComplete = (phaseId: string, exoId: string) => {
    const updatedPhases = phases.map(p =>
      p.id === phaseId
        ? {
            ...p,
            exercises: p.exercises.map(e =>
              e.id === exoId ? { ...e, completed: !e.completed } : e
            )
          }
        : p
    )
    setPhases(updatedPhases)
  }

  const handleDragStart = (e: React.DragEvent, exoId: string) => {
    if (!isInDemo(e.target)) return
    setDraggedId(exoId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isInDemo(e.target)) {
      e.preventDefault()
      return
    }
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, phaseId: string, targetIndex: number) => {
    if (!isInDemo(e.target)) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    if (!draggedId) return

    const updatedPhases = phases.map(p => {
      const exos = [...p.exercises]
      const draggedExo = exos.find(e => e.id === draggedId)

      if (!draggedExo) return p

      exos = exos.filter(e => e.id !== draggedId)
      if (p.id === phaseId) {
        exos.splice(targetIndex, 0, draggedExo)
      }

      return { ...p, exercises: exos }
    })

    setPhases(updatedPhases)
    setDraggedId(null)
  }

  return (
    <div
      ref={demoRef}
      className="w-full max-w-4xl mx-auto rounded-xl border border-white/10 overflow-hidden"
      style={{ background: '#F8FAFB', pointerEvents: 'auto' }}
      onClick={e => {
        if (!isInDemo(e.target)) e.stopPropagation()
      }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Prise de masse — Push/Pull/Legs</h3>
        <p className="text-sm text-gray-500 mt-1">3 jours - sportif | Renouvellement 1er</p>
      </div>

      {/* Assignation info */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-3">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Assigné à :</span> Bastien{' '}
          <span className="text-gray-500">depuis le 2 juin</span>
        </p>
      </div>

      {/* Program content */}
      <div className="p-6 space-y-6">
        {phases.map(phase => (
          <div key={phase.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold">
                {phase.name}
              </span>
              <span className="text-xs text-gray-500">—</span>
            </div>

            {/* Exercises list */}
            <div className="space-y-2">
              {phase.exercises.map((exo, idx) => (
                <div
                  key={exo.id}
                  draggable
                  onDragStart={e => handleDragStart(e, exo.id)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, phase.id, idx)}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:border-gray-300 transition-colors group"
                >
                  <button
                    onClick={() => toggleComplete(phase.id, exo.id)}
                    className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: exo.completed ? '#4E9B6F' : '#D1D5DB',
                      backgroundColor: exo.completed ? '#4E9B6F' : 'transparent',
                    }}
                  >
                    {exo.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-gray-900"
                      style={{
                        textDecoration: exo.completed ? 'line-through' : 'none',
                        color: exo.completed ? '#9CA3AF' : '#111827',
                      }}
                    >
                      {exo.name}
                    </p>
                    {exo.sets && (
                      <p className="text-xs text-gray-500 mt-1">
                        {exo.sets} × {exo.reps} {exo.weight && `· ${exo.weight}`}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteExercise(phase.id, exo.id)}
                    className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Supprimer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add exercise */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newExoInput}
                onChange={e => setNewExoInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addExercise()}
                placeholder="Ajouter un exercice..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={addExercise}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#4E9B6F' }}
              >
                Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer — Boutons d'action */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
        <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Copier
        </button>
        <button
          disabled
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors opacity-50 cursor-not-allowed"
          style={{ backgroundColor: '#4E9B6F' }}
          title="La démo n'autorise pas l'assignation"
        >
          Assigner
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-t border-blue-200 px-6 py-3 text-xs text-blue-800">
        Démo interactive — Vous pouvez ajouter, supprimer et réorganiser les exercices ici.
      </div>
    </div>
  )
}
