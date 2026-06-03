'use client'

import { useState } from 'react'

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

type Meal = {
  id: string
  name: string
  description: string
  calories?: string
  macros?: string
}

type Habit = {
  id: string
  name: string
  description: string
}

const LIBRARY_EXERCISES = [
  { name: 'Développé Arnold', category: 'Epaules' },
  { name: 'Développé assis haltères', category: 'Epaules' },
  { name: 'Développé couché barre', category: 'Pectoraux' },
  { name: 'Développé couché décli...', category: 'Pectoraux' },
  { name: 'Développé incliné haltères', category: 'Pectoraux' },
  { name: 'Dips (poids du corps)', category: 'Triceps' },
  { name: 'Extension triceps corde', category: 'Triceps' },
  { name: 'Tirage horizontal barre', category: 'Dos' },
  { name: 'Tirage lat front', category: 'Dos' },
  { name: 'Curl haltères', category: 'Biceps' },
]

const NUTRITION_ITEMS = [
  { name: 'Blanc de poulet pâtes c...', label: 'Repas' },
  { name: 'Boeuf 10% + pâtes com...', label: 'Repas' },
  { name: 'Boeuf 5% + patate douc...', label: 'Repas' },
  { name: 'Boeuf 5% + pâtes comp...', label: 'Repas' },
  { name: 'Boeuf 5% + quinoa + lé...', label: 'Repas' },
  { name: 'Boeuf 5% + riz + légumes', label: 'Repas' },
  { name: 'Boeuf 5% + riz basmati...', label: 'Repas' },
  { name: 'Boeuf 5% + riz complet...', label: 'Repas' },
  { name: 'Boeuf maigre + patate d...', label: 'Repas' },
]

const HABIT_ITEMS = [
  { name: 'Aérer sa chambre...', category: 'Bien-Être' },
  { name: 'Améliorer sa postu...', category: 'Sport' },
  { name: 'Apprendre à cusin...', category: 'Nutrition' },
  { name: 'Apprendre quelqu...', category: 'Mental' },
  { name: 'Augmenter progre...', category: 'Sport' },
  { name: 'Avoir des heures d...', category: 'Nutrition' },
  { name: 'Avoir une routine d...', category: 'Sommeil' },
  { name: 'Avoir une routine...', category: 'Bien-Être' },
  { name: 'Boire 2l d\'eau par...', category: 'Nutrition' },
]

const INITIAL_DATA = {
  sport: [
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
  ] as Phase[],
  nutrition: [
    {
      id: 'meal-1',
      name: 'Petit-déjeuner: Œufs flocons d\'avoine miel',
      description: '650 kcal - 25g prot - 65g gluc - 22g lip',
    },
    {
      id: 'meal-2',
      name: 'Collation: Yaourt grec banane amandes',
      description: '380 kcal - 20g prot - 38g gluc - 1kg lip',
    },
    {
      id: 'meal-3',
      name: 'Repas du midi: Poulet riz complet brocoli',
      description: '720 kcal - 45g prot - 72g gluc - 18g lip',
    },
    {
      id: 'meal-4',
      name: 'Collation: Protéine whey pain complet cacahuète',
      description: '420 kcal - 30g prot - 42g gluc - 12g lip',
    },
    {
      id: 'meal-5',
      name: 'Diner: Saumon patate douce épinards huile olive',
      description: '680 kcal - 40g prot - 68g gluc - 20g lip',
    },
  ] as Meal[],
  habits: [
    {
      id: 'hab-1',
      name: 'Réveil à heure fixe',
      description: 'Se lever à 8h30 tous les jours, sans snooze.',
    },
    {
      id: 'hab-2',
      name: 'Verre d\'eau le matin',
      description: 'Boire 500ml d\'eau dans les 15 min après réveil.',
    },
    {
      id: 'hab-3',
      name: 'Coucher à heure fixe',
      description: 'Se coucher à 22h30 pour 8h de sommeil minimum.',
    },
    {
      id: 'hab-4',
      name: 'Méditation 10min',
      description: 'Pratiquer 5 min de respiration consciente après réveil.',
    },
  ] as Habit[],
}

export function InteractiveProgram() {
  const [selectedType, setSelectedType] = useState<'sport' | 'nutrition' | 'habits'>('sport')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [sportData, setSportData] = useState(INITIAL_DATA.sport)
  const [nutritionData, setNutritionData] = useState(INITIAL_DATA.nutrition)
  const [habitData, setHabitData] = useState(INITIAL_DATA.habits)

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const deleteExercise = (phaseId: string, exId: string) => {
    setSportData(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, exercises: p.exercises.filter(e => e.id !== exId) }
        : p
    ))
  }

  const deleteMeal = (mealId: string) => {
    setNutritionData(prev => prev.filter(m => m.id !== mealId))
  }

  const deleteHabit = (habId: string) => {
    setHabitData(prev => prev.filter(h => h.id !== habId))
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      <div className="flex h-[700px]">
        {/* ── SIDEBAR ── */}
        <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3">
            <input
              type="text"
              placeholder={selectedType === 'sport' ? 'Rechercher...' : 'Rechercher...'}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          {/* Filters */}
          <div className="px-3 pb-3 flex flex-wrap gap-1">
            {selectedType === 'sport' && (
              <>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">Tous</button>
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded">Force</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">Cardio</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">HIIT</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">Mobilité</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">Stretch</button>
              </>
            )}
            {selectedType === 'nutrition' && (
              <>
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded">Tous</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Protéines</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Glucides</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Lipides</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Hydrat.</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Conseil</button>
              </>
            )}
            {selectedType === 'habits' && (
              <>
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded">Tous</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Sport</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Nutrition</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Sommeil</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Bien-être</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Mental</button>
              </>
            )}
          </div>

          {/* Library List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {selectedType === 'sport' && LIBRARY_EXERCISES.map((ex, i) => (
              <div key={i} className="px-2 py-2 text-xs rounded cursor-default hover:bg-gray-100">
                <div className="font-medium text-gray-900">{ex.name}</div>
                <div className="text-gray-500">{ex.category}</div>
              </div>
            ))}
            {selectedType === 'nutrition' && NUTRITION_ITEMS.map((item, i) => (
              <div key={i} className="px-2 py-2 text-xs rounded cursor-default hover:bg-gray-100">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-gray-500">{item.label}</div>
              </div>
            ))}
            {selectedType === 'habits' && HABIT_ITEMS.map((item, i) => (
              <div key={i} className="px-2 py-2 text-xs rounded cursor-default hover:bg-gray-100">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-gray-500">{item.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ── */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedType === 'sport' && 'Prise de masse — Push/Pull/Legs'}
                  {selectedType === 'nutrition' && 'Nutrition prise de masse'}
                  {selectedType === 'habits' && 'Programme Habitude 1 semaine'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedType === 'sport' && '3 jours - sportif'}
                  {selectedType === 'nutrition' && '28 jours - nutritionnel'}
                  {selectedType === 'habits' && '7 jours - habitudes'}
                </p>
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
            <div className="flex gap-6">
              <button
                onClick={() => setSelectedType('sport')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedType === 'sport'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Sportif
              </button>
              <button
                onClick={() => setSelectedType('nutrition')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedType === 'nutrition'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Nutritionnel
              </button>
              <button
                onClick={() => setSelectedType('habits')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedType === 'habits'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Habitude
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedType === 'sport' && (
              <div className="space-y-6">
                {sportData.map((phase, idx) => (
                  <div key={phase.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold">
                        {phase.name}
                      </span>
                      <button className="text-xs text-gray-500 hover:text-gray-700">+ Phase</button>
                    </div>

                    <div className="space-y-2">
                      {phase.exercises.map((ex, exIdx) => (
                        <div
                          key={ex.id}
                          draggable
                          onDragStart={() => handleDragStart(ex.id)}
                          onDragOver={e => e.preventDefault()}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 cursor-move group"
                        >
                          <span className="text-sm font-medium text-gray-900 w-6">{exIdx + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                            {ex.sets && (
                              <p className="text-xs text-gray-500 mt-1">
                                {ex.sets} × {ex.reps} {ex.weight && `· ${ex.weight}`}
                              </p>
                            )}
                          </div>
                          {ex.completed && <span className="text-green-600">✓</span>}
                          <button
                            onClick={() => deleteExercise(phase.id, ex.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="mt-3 text-green-600 text-sm font-semibold hover:text-green-700">
                      + Ajouter
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedType === 'nutrition' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Jour prise de masse</h3>
                  <div className="space-y-2">
                    {nutritionData.map(meal => (
                      <div
                        key={meal.id}
                        draggable
                        onDragStart={() => handleDragStart(meal.id)}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 cursor-move group"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{meal.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{meal.description}</p>
                        </div>
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="mt-3 text-green-600 text-sm font-semibold hover:text-green-700">
                    + Ajouter un repas
                  </button>
                </div>
              </div>
            )}

            {selectedType === 'habits' && (
              <div className="space-y-4">
                {habitData.map((habit, idx) => (
                  <div key={habit.id}>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      Jour {idx + 1} — {habit.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">{habit.description}</p>
                    <button className="text-green-600 text-xs font-semibold hover:text-green-700">
                      + Ajouter une habitude
                    </button>
                  </div>
                ))}
              </div>
            )}
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
