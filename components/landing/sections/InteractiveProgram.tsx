'use client'

import { useState } from 'react'

type ProgramItem = {
  id: string
  title: string
  category: string
  reps?: string
  weight?: string
}

const PROGRAM_TYPES = [
  { id: 'sport', label: 'Sportif', icon: '🏋️' },
  { id: 'nutrition', label: 'Nutritionnel', icon: '🥗' },
  { id: 'habits', label: 'Habitude', icon: '📊' },
]

const INITIAL_PROGRAMS = {
  sport: [
    { id: '1', title: 'Push - Poitrine/Epaules/Triceps', category: 'Composé', reps: '6 ex' },
    { id: '2', title: 'Développé couché à la barre', category: 'Poitrine', reps: '4 × 6', weight: '80 kg' },
    { id: '3', title: 'Développé incliné haltères', category: 'Poitrine', reps: '3 × 8', weight: '30 kg' },
    { id: '4', title: 'Dips', category: 'Triceps', reps: '3 × 8', weight: '—' },
  ],
  nutrition: [
    { id: 'n1', title: 'Petit-déjeuner protéiné', category: 'Matin', reps: '40g protéines' },
    { id: 'n2', title: 'Collation midis', category: 'Snack', reps: '250 kcal' },
    { id: 'n3', title: 'Dîner équilibré', category: 'Soir', reps: '50g protéines' },
  ],
  habits: [
    { id: 'h1', title: 'Boire 2L d\'eau par jour', category: 'Hydratation' },
    { id: 'h2', title: 'Dormir 8h minimum', category: 'Sommeil' },
    { id: 'h3', title: 'Méditation 10min', category: 'Bien-être' },
  ],
}

export function InteractiveProgram() {
  const [selectedType, setSelectedType] = useState<'sport' | 'nutrition' | 'habits'>('sport')
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')

  const currentPrograms = programs[selectedType]
  const typeLabel = PROGRAM_TYPES.find(t => t.id === selectedType)?.label

  const addItem = () => {
    if (!newItem.trim()) return
    const newId = `${selectedType}-${Date.now()}`
    setPrograms(prev => ({
      ...prev,
      [selectedType]: [...prev[selectedType], { id: newId, title: newItem, category: 'Nouveau' }]
    }))
    setNewItem('')
  }

  const deleteItem = (id: string) => {
    setPrograms(prev => ({
      ...prev,
      [selectedType]: prev[selectedType].filter(item => item.id !== id)
    }))
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDrop = (targetId: string, position: 'before' | 'after') => {
    if (!draggedId || draggedId === targetId) return

    const items = [...currentPrograms]
    const draggedItem = items.find(i => i.id === draggedId)
    const targetIndex = items.findIndex(i => i.id === targetId)

    if (!draggedItem) return

    items.splice(items.indexOf(draggedItem), 1)
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
    items.splice(insertIndex, 0, draggedItem)

    setPrograms(prev => ({
      ...prev,
      [selectedType]: items
    }))
    setDraggedId(null)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      <div className="flex h-[700px]">
        {/* Sidebar */}
        <div className="w-[220px] bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="text-xs text-gray-500 font-semibold uppercase mb-4 px-2">Bibliothèque</div>

          <div className="space-y-1">
            <div className="text-xs text-gray-600 font-medium px-3 py-2 rounded hover:bg-gray-100 cursor-default">
              Tous
            </div>
            <div className="text-xs text-white font-medium px-3 py-2 rounded bg-green-600 cursor-default">
              Force
            </div>
            <div className="text-xs text-gray-600 font-medium px-3 py-2 rounded hover:bg-gray-100 cursor-default">
              Cardio
            </div>
          </div>

          <div className="text-xs text-gray-500 font-semibold uppercase mt-6 mb-3 px-2">Éléments</div>
          <div className="space-y-1 text-xs">
            <div className="px-3 py-2 text-gray-700 cursor-default hover:bg-gray-100 rounded">
              <div className="font-medium">Développé Arnold</div>
              <div className="text-gray-500">Epaules</div>
            </div>
            <div className="px-3 py-2 text-gray-700 cursor-default hover:bg-gray-100 rounded">
              <div className="font-medium">Développé assis</div>
              <div className="text-gray-500">Epaules</div>
            </div>
            <div className="px-3 py-2 text-gray-700 cursor-default hover:bg-gray-100 rounded">
              <div className="font-medium">Développé couché</div>
              <div className="text-gray-500">Pectoraux</div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Programme {typeLabel}</h2>
                <p className="text-sm text-gray-500 mt-1">Personnalisé pour vos objectifs</p>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
                Assigner
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Assigné à :</span> Bastien{' '}
                <span className="text-gray-500">depuis le 2 juin</span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 pt-4">
            <div className="flex gap-4">
              {PROGRAM_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as any)}
                  className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedType === type.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {currentPrograms.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(item.id, 'before')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 cursor-move group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    {item.reps && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.reps}
                        {item.weight && ` · ${item.weight}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 text-gray-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addItem()}
                  placeholder="Ajouter un nouvel élément..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
            <button className="text-sm text-gray-600 hover:text-gray-900">Copier</button>
            <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
