'use client'

import { useState, useRef } from 'react'
import { Trash2, ChevronDown, ChevronRight, GripVertical, Plus, Search, Copy, ArrowLeft, Users, RefreshCw } from 'lucide-react'

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

function DayCard({ day, exercises, onAddExercise, onDeleteExercise, onUpdateExercise, onUpdateTitle, onDeleteDay, onDrop, dragCounter }: {
  day: Day
  exercises: Exercise[]
  onAddExercise: () => void
  onDeleteExercise: (exId: string) => void
  onUpdateExercise: (exId: string, field: keyof Exercise, val: any) => void
  onUpdateTitle: (val: string) => void
  onDeleteDay: () => void
  onDrop: (e: React.DragEvent) => void
  dragCounter: React.MutableRefObject<number>
}) {
  const [open, setOpen] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    setOpen(true)
    onDrop(e)
  }

  const sortedExercises = [...exercises].sort((a, b) => a.position - b.position)

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-all ${
        isDragOver ? 'border-[#4E9B6F] ring-2 ring-[#4E9B6F]/20 shadow-sm' : 'border-[#E2E8F0]'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#FAFBFD]"
        onClick={() => setOpen(!open)}
      >
        <span className="w-6 h-6 rounded-lg bg-[#EEF9F3] text-[#4E9B6F] text-[11px] font-bold flex items-center justify-center shrink-0">
          {day.day_number}
        </span>
        <input
          value={day.title}
          onChange={e => onUpdateTitle(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="flex-1 text-[13px] font-semibold text-[#0D1F3C] bg-transparent focus:outline-none"
        />
        <span className="text-[11px] text-[#94A3B8] shrink-0">{exercises.length} ex.</span>
        {isDragOver && <span className="text-[10px] text-[#4E9B6F] font-medium shrink-0">Déposer ici</span>}
        {open ? <ChevronDown size={14} className="text-[#94A3B8]" /> : <ChevronRight size={14} className="text-[#94A3B8]" />}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9]">
          <div className="pt-2">
            {exercises.length === 0 ? (
              <p className="text-[12px] text-[#CBD5E1] py-2 text-center">Aucun exercice</p>
            ) : (
              <div className="space-y-0">
                {sortedExercises.map((ex) => (
                  <div key={ex.id} className="py-2 border-b border-[#F1F5F9] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <input
                          value={ex.exercise_name}
                          onChange={e => onUpdateExercise(ex.id, 'exercise_name', e.target.value)}
                          className="flex-1 text-[13px] font-medium text-[#0D1F3C] bg-transparent focus:outline-none placeholder:text-[#CBD5E1]"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={ex.sets ?? ''}
                          onChange={e => onUpdateExercise(ex.id, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="—"
                          className="w-9 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white text-[#0D1F3C]"
                        />
                        <span className="text-[10px] text-[#CBD5E1]">×</span>
                        <input
                          type="number"
                          min={1}
                          value={ex.reps ?? ''}
                          onChange={e => onUpdateExercise(ex.id, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="—"
                          className="w-9 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white text-[#0D1F3C]"
                        />
                        <span className="text-[10px] text-[#CBD5E1]">reps</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={ex.weight_kg ?? ''}
                          onChange={e => onUpdateExercise(ex.id, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="—"
                          className="w-11 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white text-[#0D1F3C]"
                        />
                        <span className="text-[10px] text-[#CBD5E1]">kg</span>
                      </div>
                      <button
                        onClick={() => onDeleteExercise(ex.id)}
                        className="p-1 text-[#CBD5E1] hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#F1F5F9]">
            <button
              onClick={onAddExercise}
              className="flex items-center gap-1.5 text-[12px] text-[#4E9B6F] font-medium hover:text-[#3d8058] transition-colors"
            >
              <Plus size={12} /> Ajouter
            </button>
            <div className="flex-1" />
            <button className="text-[11px] text-[#64748B] hover:text-[#4E9B6F] transition-colors flex items-center gap-1">
              <Copy size={11} /> Copier
            </button>
            <button
              onClick={onDeleteDay}
              className="text-[11px] text-[#CBD5E1] hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} /> Supprimer
            </button>
            <button className="px-3 py-1.5 bg-[#4E9B6F] text-white rounded-lg text-[12px] font-medium hover:bg-[#3d8058] transition-colors">
              Sauvegarder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function InteractiveProgram() {
  const [search, setSearch] = useState('')
  const dragCounterRef = useRef(0)

  const [days, setDays] = useState<Day[]>([
    {
      id: 'day-1',
      day_number: 1,
      title: 'Push - Poitrine/Epaules/Triceps',
      exercises: [
        { id: 'ex-1', exercise_name: 'Développé couché barre', sets: 4, reps: 6, weight_kg: 80, position: 1, rest_seconds: 90, notes: null },
        { id: 'ex-2', exercise_name: 'Développé incliné haltères', sets: 3, reps: 8, weight_kg: 30, position: 2, rest_seconds: 60, notes: null },
        { id: 'ex-3', exercise_name: 'Dips', sets: 3, reps: 8, weight_kg: null, position: 3, rest_seconds: 60, notes: null },
      ]
    },
    {
      id: 'day-2',
      day_number: 2,
      title: 'Pull - Dos/Biceps',
      exercises: []
    },
    {
      id: 'day-3',
      day_number: 3,
      title: 'Jambes',
      exercises: []
    },
  ])

  const filteredLibrary = LIBRARY_EXERCISES.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDragStartLibrary = (e: React.DragEvent, libItem: LibraryExercise) => {
    const data = JSON.stringify(libItem)
    e.dataTransfer.setData('application/json', data)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDropToDay = (dayId: string) => (e: React.DragEvent) => {
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const libItem = JSON.parse(data) as LibraryExercise
        const day = days.find(d => d.id === dayId)
        if (!day) return

        const newEx: Exercise = {
          id: `ex-${Date.now()}`,
          exercise_name: libItem.name,
          sets: 3,
          reps: 10,
          weight_kg: null,
          rest_seconds: 60,
          notes: null,
          position: day.exercises.length + 1,
        }

        setDays(prev => prev.map(d =>
          d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d
        ))
      }
    } catch {}
  }

  const deleteExercise = (dayId: string, exId: string) => {
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, exercises: d.exercises.filter(ex => ex.id !== exId) }
        : d
    ))
  }

  const updateExercise = (dayId: string, exId: string, field: keyof Exercise, val: any) => {
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, exercises: d.exercises.map(ex => ex.id === exId ? { ...ex, [field]: val } : ex) }
        : d
    ))
  }

  const addExercise = (dayId: string) => {
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, exercises: [...d.exercises, { id: `ex-${Date.now()}`, exercise_name: '', sets: 3, reps: 10, weight_kg: null, rest_seconds: 60, notes: null, position: d.exercises.length + 1 }] }
        : d
    ))
  }

  const addDay = () => {
    setDays(prev => {
      const nextNum = prev.length > 0 ? Math.max(...prev.map(d => d.day_number)) + 1 : 1
      return [...prev, { id: `day-${Date.now()}`, day_number: nextNum, title: `Jour ${nextNum}`, exercises: [] }]
    })
  }

  const updateDayTitle = (dayId: string, val: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, title: val } : d))
  }

  const deleteDay = (dayId: string) => {
    setDays(prev => prev.filter(d => d.id !== dayId))
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] flex" style={{ height: '640px' }}>
      {/* LIBRARY PANEL */}
      <div className="w-[220px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
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
                className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#EEF9F3] cursor-grab active:cursor-grabbing rounded transition-colors"
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

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="border-b border-[#E2E8F0] px-8 py-5 bg-white shrink-0">
          <div className="max-w-3xl flex items-center gap-3">
            <button className="p-1.5 text-[#94A3B8] hover:text-[#64748B] transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-bold text-[#0D1F3C] truncate">Prise de masse — Push/Pull/Legs</h1>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">{days.length} jour{days.length > 1 ? 's' : ''} · sportif</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] text-[#64748B] rounded-xl text-[12px] font-medium hover:bg-[#F8FAFB] transition-colors">
                <RefreshCw size={13} />
                Régénérer
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-medium hover:bg-[#3d8058] transition-colors">
                <Users size={14} /> Assigner
              </button>
            </div>
          </div>
        </div>

        {/* DAYS CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl space-y-3">
            {days.map(day => (
              <DayCard
                key={day.id}
                day={day}
                exercises={day.exercises}
                onAddExercise={() => addExercise(day.id)}
                onDeleteExercise={(exId) => deleteExercise(day.id, exId)}
                onUpdateExercise={(exId, field, val) => updateExercise(day.id, exId, field, val)}
                onUpdateTitle={(val) => updateDayTitle(day.id, val)}
                onDeleteDay={() => deleteDay(day.id)}
                onDrop={handleDropToDay(day.id)}
                dragCounter={dragCounterRef}
              />
            ))}

            <button
              onClick={addDay}
              className="w-full py-3 border-2 border-dashed border-[#E2E8F0] rounded-xl text-[13px] text-[#94A3B8] font-medium hover:border-[#4E9B6F] hover:text-[#4E9B6F] transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Ajouter un jour manuellement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
