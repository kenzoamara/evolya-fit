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
}

type Habit = {
  id: string
  day: number
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

const HABIT_LIBRARY = [
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

export function InteractiveProgram() {
  const [selectedType, setSelectedType] = useState<'sport' | 'nutrition' | 'habits'>('sport')
  const [draggedItem, setDraggedItem] = useState<{ type: string; id: string; phaseId?: string } | null>(null)

  const [sportData, setSportData] = useState<Phase[]>([
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
  ])

  const [nutritionData, setNutritionData] = useState<Meal[]>([
    { id: 'meal-1', name: 'Petit-déjeuner: Œufs flocons d\'avoine miel', description: '650 kcal - 25g prot - 65g gluc - 22g lip' },
    { id: 'meal-2', name: 'Collation: Yaourt grec banane amandes', description: '380 kcal - 20g prot - 38g gluc - 1kg lip' },
    { id: 'meal-3', name: 'Repas du midi: Poulet riz complet brocoli', description: '720 kcal - 45g prot - 72g gluc - 18g lip' },
    { id: 'meal-4', name: 'Collation: Protéine whey pain complet cacahuète', description: '420 kcal - 30g prot - 42g gluc - 12g lip' },
    { id: 'meal-5', name: 'Diner: Saumon patate douce épinards huile olive', description: '680 kcal - 40g prot - 68g gluc - 20g lip' },
  ])

  const [habitData, setHabitData] = useState<Habit[]>([
    { id: 'hab-1', day: 1, name: 'Établir le réveil', description: 'Se lever à 8h30 tous les jours, sans snooze.' },
    { id: 'hab-2', day: 1, name: 'Verre d\'eau le matin', description: 'Boire 500ml d\'eau dans les 15 min après réveil.' },
    { id: 'hab-3', day: 1, name: 'Coucher à heure fixe', description: 'Se coucher à 22h30 pour 8h de sommeil minimum.' },
    { id: 'hab-4', day: 2, name: 'Routine matinale', description: 'Routine de 30 min le matin après réveil.' },
    { id: 'hab-5', day: 2, name: 'Méditation 10min', description: 'Pratiquer 5 min de respiration consciente.' },
  ])

  const handleExerciseDragStart = (e: React.DragEvent, phaseId: string, exId: string) => {
    setDraggedItem({ type: 'exercise', id: exId, phaseId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleMealDragStart = (e: React.DragEvent, mealId: string) => {
    setDraggedItem({ type: 'meal', id: mealId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleHabitDragStart = (e: React.DragEvent, habId: string) => {
    setDraggedItem({ type: 'habit', id: habId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropExercise = (e: React.DragEvent, phaseId: string, targetIdx: number) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.type !== 'exercise' || draggedItem.phaseId !== phaseId) return

    setSportData(prev => prev.map(phase => {
      if (phase.id !== phaseId) return phase
      const newExercises = [...phase.exercises]
      const draggedIdx = newExercises.findIndex(ex => ex.id === draggedItem.id)
      if (draggedIdx === -1) return phase

      const [draggedEx] = newExercises.splice(draggedIdx, 1)
      newExercises.splice(targetIdx, 0, draggedEx)
      return { ...phase, exercises: newExercises }
    }))
    setDraggedItem(null)
  }

  const handleDropMeal = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.type !== 'meal') return

    const newMeals = [...nutritionData]
    const draggedIdx = newMeals.findIndex(m => m.id === draggedItem.id)
    if (draggedIdx === -1) return

    const [draggedMeal] = newMeals.splice(draggedIdx, 1)
    newMeals.splice(targetIdx, 0, draggedMeal)
    setNutritionData(newMeals)
    setDraggedItem(null)
  }

  const handleDropHabit = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.type !== 'habit') return

    const newHabits = [...habitData]
    const draggedIdx = newHabits.findIndex(h => h.id === draggedItem.id)
    if (draggedIdx === -1) return

    const [draggedHabit] = newHabits.splice(draggedIdx, 1)
    newHabits.splice(targetIdx, 0, draggedHabit)
    setHabitData(newHabits)
    setDraggedItem(null)
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
          <div className="p-3">
            <input type="text" placeholder="Rechercher..." className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
          </div>

          <div className="px-3 pb-3 flex flex-wrap gap-1">
            {selectedType === 'sport' && (
              <>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Tous</button>
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded">Force</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Cardio</button>
              </>
            )}
            {selectedType === 'nutrition' && (
              <>
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded">Tous</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Protéines</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Glucides</button>
              </>
            )}
            {selectedType === 'habits' && (
              <>
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded">Tous</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Sport</button>
                <button className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700">Nutrition</button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {selectedType === 'sport' && LIBRARY_EXERCISES.map((ex, i) => (
              <div key={i} className="px-2 py-2 text-xs rounded cursor-default hover:bg-gray-100">
                <div className="font-medium text-gray-900">{ex.name}</div>
                <div className="text-gray-500">{ex.category}</div>
              </div>
            ))}
            {selectedType === 'nutrition' && ['Blanc de poulet', 'Boeuf 10%', 'Boeuf 5%', 'Poulet riz', 'Protéine whey', 'Saumon patate'].map((item, i) => (
              <div key={i} className="px-2 py-2 text-xs rounded cursor-default hover:bg-gray-100">
                <div className="font-medium text-gray-900">{item}...</div>
                <div className="text-gray-500">Repas</div>
              </div>
            ))}
            {selectedType === 'habits' && HABIT_LIBRARY.map((item, i) => (
              <div key={i} className="px-2 py-2 text-xs rounded cursor-default hover:bg-gray-100">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-gray-500">{item.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTENU ── */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
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
                <span className="font-semibold">Assigné à :</span> Bastien <span className="text-gray-500">depuis le 2 juin</span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 pt-3 pb-0">
            <div className="flex gap-6">
              {['sport', 'nutrition', 'habits'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type as any)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedType === type
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'sport' && 'Sportif'}
                  {type === 'nutrition' && 'Nutritionnel'}
                  {type === 'habits' && 'Habitude'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedType === 'sport' && (
              <div className="space-y-6">
                {sportData.map(phase => (
                  <div key={phase.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold">Tout -3j</span>
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold">{phase.name}</span>
                      <button className="text-green-600 text-sm font-semibold hover:text-green-700">+ Phase</button>
                    </div>

                    <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                      {phase.exercises.map((ex, idx) => (
                        <div
                          key={ex.id}
                          draggable
                          onDragStart={e => handleExerciseDragStart(e, phase.id, ex.id)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => handleDropExercise(e, phase.id, idx)}
                          className="flex items-center border-b border-gray-200 last:border-b-0 p-3 bg-white hover:bg-gray-50 cursor-move group"
                        >
                          <span className="text-sm font-medium text-gray-900 w-8">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ex.name}</p>
                          </div>
                          <div className="text-xs text-gray-600 ml-4 flex gap-2">
                            {ex.sets && <span>{ex.sets}</span>}
                            {ex.reps && <span>×</span>}
                            {ex.reps && <span>{ex.reps}</span>}
                            {ex.weight && <span>·</span>}
                            {ex.weight && <span>{ex.weight}</span>}
                          </div>
                          {ex.completed && <span className="ml-3 text-green-600 text-lg">✓</span>}
                          <button
                            onClick={() => deleteExercise(phase.id, ex.id)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600"
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="mt-3 text-green-600 text-sm font-semibold hover:text-green-700">+ Ajouter</button>
                  </div>
                ))}
              </div>
            )}

            {selectedType === 'nutrition' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Jour prise de masse</h3>
                  <span className="text-xs text-gray-500">{nutritionData.length} repas</span>
                </div>
                <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                  {nutritionData.map((meal, idx) => (
                    <div
                      key={meal.id}
                      draggable
                      onDragStart={e => handleMealDragStart(e, meal.id)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDropMeal(e, idx)}
                      className="flex items-start gap-3 border-b border-gray-200 last:border-b-0 p-3 bg-white hover:bg-gray-50 cursor-move group"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{meal.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{meal.description}</p>
                      </div>
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-green-600 text-sm font-semibold hover:text-green-700">+ Ajouter un repas</button>
              </div>
            )}

            {selectedType === 'habits' && (
              <div className="space-y-6">
                {[1, 2].map(day => {
                  const dayHabits = habitData.filter(h => h.day === day)
                  return (
                    <div key={day}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900">Jour {day} — Établir le réveil</h3>
                        <span className="text-xs text-gray-500">{dayHabits.length} habit.</span>
                      </div>
                      <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                        {dayHabits.map((hab, idx) => (
                          <div
                            key={hab.id}
                            draggable
                            onDragStart={e => handleHabitDragStart(e, hab.id)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDropHabit(e, idx)}
                            className="flex items-start gap-3 border-b border-gray-200 last:border-b-0 p-3 bg-white hover:bg-gray-50 cursor-move group"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{hab.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{hab.description}</p>
                            </div>
                            <button
                              onClick={() => deleteHabit(hab.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600"
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                      <button className="mt-2 text-green-600 text-xs font-semibold hover:text-green-700">+ Ajouter une habitude</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
            <button className="text-sm text-gray-600 hover:text-gray-900">Copier</button>
            <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">Sauvegarder</button>
          </div>
        </div>
      </div>
    </div>
  )
}
