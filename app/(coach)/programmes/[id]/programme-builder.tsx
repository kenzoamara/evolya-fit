'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Users, Sparkles, RefreshCw, Copy, Search, GripVertical, BookOpen, X, Link2,
} from 'lucide-react'
import Link from 'next/link'
import { ProgrammeGeneratingSkeleton } from '@/components/ui/programme-generating-skeleton'

type Exercise = {
  id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight_kg: number | null
  rest_seconds: number | null
  notes: string | null
  position: number
  superset_group: string | null
}

type Day = {
  id: string
  day_number: number
  title: string | null
  notes: string | null
  phase: number
  programme_day_exercises: Exercise[]
}

type Programme = {
  id: string
  title: string
  type: string
  description: string | null
  duration_days: number | null
}

type Client = { id: string; full_name: string }

type Assignment = {
  id: string
  client_id: string
  start_date: string
  active: boolean
  clients: { full_name: string } | null
}

type LibraryExercise = {
  id: string
  name: string
  instructions: string
  category: 'force' | 'cardio' | 'mobilite' | 'hiit' | 'stretching'
  muscle_group: string
  difficulty: 'debutant' | 'intermediaire' | 'avance'
  equipment: string
}

type NutritionLibraryItem = {
  id: string
  name: string
  description: string
  category: string
}

type HabitLibraryItem = {
  id: string
  name: string
  emoji: string
  description: string
  category: string
}

type Props = {
  programme: Programme
  initialDays: Day[]
  clients: Client[]
  assignments: Assignment[]
  libraryExercises: LibraryExercise[]
  nutritionLibraryItems?: NutritionLibraryItem[]
  habitLibraryItems?: HabitLibraryItem[]
  aiProgrammesUsed?: number
  aiProgrammesLimit?: number
}

function makeId() { return `new-${Date.now()}-${Math.random()}` }

function makeExercise(position: number): Exercise {
  return { id: makeId(), exercise_name: '', sets: 3, reps: 10, weight_kg: null, rest_seconds: 60, notes: null, position, superset_group: null }
}

/** Regroupe les exercices par superset_group pour l'affichage */
function groupExercises(exercises: Exercise[]): Array<{ group: string | null; items: Exercise[] }> {
  const sorted = [...exercises].sort((a, b) => a.position - b.position)
  const result: Array<{ group: string | null; items: Exercise[] }> = []
  for (const ex of sorted) {
    const g = ex.superset_group ?? null
    if (!g) {
      result.push({ group: null, items: [ex] })
    } else {
      const existing = result.find(r => r.group === g)
      if (existing) existing.items.push(ex)
      else result.push({ group: g, items: [ex] })
    }
  }
  return result
}

const LIB_CATS = [
  { id: 'tous',       label: 'Tous' },
  { id: 'force',      label: 'Force' },
  { id: 'cardio',     label: 'Cardio' },
  { id: 'hiit',       label: 'HIIT' },
  { id: 'mobilite',   label: 'Mobilité' },
  { id: 'stretching', label: 'Stretch' },
] as const

const LIB_DIFFS = [
  { id: 'tous',          label: 'Tous' },
  { id: 'debutant',      label: 'Débutant' },
  { id: 'intermediaire', label: 'Inter.' },
  { id: 'avance',        label: 'Avancé' },
] as const

const DIFF_DOT: Record<string, string> = {
  debutant:      '#10B981',
  intermediaire: '#F59E0B',
  avance:        '#EF4444',
}

const NUTRI_CATS = [
  { id: 'tous',         label: 'Tous' },
  { id: 'proteines',    label: 'Protéines' },
  { id: 'glucides',     label: 'Glucides' },
  { id: 'lipides',      label: 'Lipides' },
  { id: 'hydratation',  label: 'Hydrat.' },
  { id: 'conseil',      label: 'Conseil' },
  { id: 'complements',  label: 'Compl.' },
] as const

const NUTRI_CAT_COLOR: Record<string, string> = {
  proteines:   '#EF4444',
  glucides:    '#F59E0B',
  lipides:     '#8B5CF6',
  hydratation: '#3B82F6',
  conseil:     '#10B981',
  complements: '#EC4899',
}

const HABIT_CATS = [
  { id: 'tous',      label: 'Tous' },
  { id: 'sport',     label: 'Sport' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'sommeil',   label: 'Sommeil' },
  { id: 'bien-etre', label: 'Bien-être' },
  { id: 'mental',    label: 'Mental' },
] as const

function makeCompatible(name: string, instructions: string): LibraryExercise {
  return {
    id: '',
    name,
    instructions,
    category: 'force',
    muscle_group: '',
    difficulty: 'intermediaire',
    equipment: 'aucun',
  }
}

/* ── Library Panel ── */
function LibraryPanel({ libraryExercises, nutritionLibraryItems, habitLibraryItems, onAdd, days, programmeType }: {
  libraryExercises: LibraryExercise[]
  nutritionLibraryItems?: NutritionLibraryItem[]
  habitLibraryItems?: HabitLibraryItem[]
  onAdd: (ex: LibraryExercise, dayId: string) => void
  days: Day[]
  programmeType: string
}) {
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState<string>('tous')
  const [filterDiff,setFilterDiff]= useState<string>('tous')
  const [pickItem,  setPickItem]  = useState<LibraryExercise | null>(null)

  // Reset filters when programme type changes
  useEffect(() => {
    setSearch('')
    setFilterCat('tous')
    setFilterDiff('tous')
    setPickItem(null)
  }, [programmeType])

  const filteredExercises = useMemo(() => {
    if (programmeType !== 'sportif') return []
    return libraryExercises.filter(ex => {
      if (filterCat !== 'tous' && ex.category !== filterCat) return false
      if (filterDiff !== 'tous' && ex.difficulty !== filterDiff) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return ex.name.toLowerCase().includes(q) || (ex.muscle_group ?? '').toLowerCase().includes(q)
      }
      return true
    })
  }, [libraryExercises, search, filterCat, filterDiff, programmeType])

  const filteredNutrition = useMemo(() => {
    if (programmeType !== 'nutritionnel') return []
    return (nutritionLibraryItems ?? []).filter(item => {
      if (filterCat !== 'tous' && item.category !== filterCat) return false
      if (search.trim()) return item.name.toLowerCase().includes(search.toLowerCase())
      return true
    })
  }, [nutritionLibraryItems, search, filterCat, programmeType])

  const filteredHabits = useMemo(() => {
    if (programmeType !== 'habitudes') return []
    return (habitLibraryItems ?? []).filter(t => {
      if (filterCat !== 'tous' && t.category !== filterCat) return false
      if (search.trim()) return t.name.toLowerCase().includes(search.toLowerCase())
      return true
    })
  }, [habitLibraryItems, search, filterCat, programmeType])

  const totalItems = programmeType === 'sportif'
    ? libraryExercises.length
    : programmeType === 'nutritionnel'
    ? (nutritionLibraryItems ?? []).length
    : (habitLibraryItems ?? []).length

  const filteredCount = programmeType === 'sportif'
    ? filteredExercises.length
    : programmeType === 'nutritionnel'
    ? filteredNutrition.length
    : filteredHabits.length

  const currentCats = programmeType === 'nutritionnel'
    ? NUTRI_CATS
    : programmeType === 'habitudes'
    ? HABIT_CATS
    : LIB_CATS

  const emptyLabel = programmeType === 'nutritionnel'
    ? 'Aucun élément nutritionnel'
    : programmeType === 'habitudes'
    ? 'Aucune habitude'
    : 'Aucun exercice'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[#E2E8F0] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">
            Bibliothèque
          </p>
          <span className="text-[10px] text-[#CBD5E1]">{filteredCount} / {totalItems}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#CBD5E1]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-6 pr-2.5 py-1.5 text-[11px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#4E9B6F] bg-[#FAFBFD]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#CBD5E1] hover:text-[#94A3B8]">
              <X size={10} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {currentCats.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                filterCat === c.id
                  ? 'text-white'
                  : 'text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0]'
              }`}
              style={filterCat === c.id ? { backgroundColor: 'var(--brand)' } : {}}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Difficulty filter — sport only */}
        {programmeType === 'sportif' && (
          <div className="flex gap-1">
            {LIB_DIFFS.map(d => (
              <button
                key={d.id}
                onClick={() => setFilterDiff(d.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                  filterDiff === d.id
                    ? 'bg-[#F1F5F9] text-[#0D1F3C]'
                    : 'text-[#94A3B8] hover:text-[#64748B]'
                }`}
              >
                {d.id !== 'tous' && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: DIFF_DOT[d.id] }} />
                )}
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {filteredCount === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-[12px] text-[#CBD5E1]">{emptyLabel}</p>
            {(filterCat !== 'tous' || filterDiff !== 'tous' || search) && (
              <button
                onClick={() => { setSearch(''); setFilterCat('tous'); setFilterDiff('tous') }}
                className="mt-2 text-[11px] text-[#4E9B6F] hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {/* Sport items */}
            {programmeType === 'sportif' && filteredExercises.map(ex => (
              <div
                key={ex.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('application/json', JSON.stringify(ex))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAFB] cursor-grab active:cursor-grabbing transition-colors group"
              >
                <GripVertical size={11} className="text-[#CBD5E1] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#0D1F3C] truncate leading-tight">{ex.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ex.muscle_group && (
                      <p className="text-[10px] text-[#94A3B8] truncate">{ex.muscle_group}</p>
                    )}
                    {ex.difficulty && ex.difficulty !== 'intermediaire' && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: DIFF_DOT[ex.difficulty] }} title={ex.difficulty} />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPickItem(pickItem?.id === ex.id && pickItem?.name === ex.name ? null : ex)}
                  className="p-1 text-[#4E9B6F] hover:bg-[#EEF9F3] rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  title="Ajouter à un jour"
                >
                  <Plus size={11} />
                </button>
              </div>
            ))}

            {/* Nutrition items */}
            {programmeType === 'nutritionnel' && filteredNutrition.map(item => {
              const compatible = makeCompatible(item.name, item.description)
              const dragData = JSON.stringify(compatible)
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/json', dragData)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAFB] cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <GripVertical size={11} className="text-[#CBD5E1] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#0D1F3C] truncate leading-tight">{item.name}</p>
                    {item.category && item.category !== 'conseil' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: NUTRI_CAT_COLOR[item.category] ?? '#94A3B8' }}
                        />
                        <p className="text-[10px] text-[#94A3B8] truncate capitalize">{item.category}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setPickItem(pickItem?.name === item.name ? null : compatible)}
                    className="p-1 text-[#4E9B6F] hover:bg-[#EEF9F3] rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title="Ajouter à un jour"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              )
            })}

            {/* Habit templates */}
            {programmeType === 'habitudes' && filteredHabits.map(template => {
              const compatible = makeCompatible(`${template.emoji} ${template.name}`, template.description)
              const dragData = JSON.stringify(compatible)
              return (
                <div
                  key={template.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/json', dragData)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAFB] cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <GripVertical size={11} className="text-[#CBD5E1] shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[14px] shrink-0 leading-none">{template.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-[#0D1F3C] truncate leading-tight">{template.name}</p>
                      {template.category && (
                        <p className="text-[10px] text-[#94A3B8] truncate capitalize">{template.category}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setPickItem(pickItem?.name === compatible.name ? null : compatible)}
                    className="p-1 text-[#4E9B6F] hover:bg-[#EEF9F3] rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title="Ajouter à un jour"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Day picker */}
      {pickItem && (
        <div className="border-t border-[#E2E8F0] bg-[#FAFBFD] shrink-0">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[#E2E8F0]">
            <p className="text-[11px] font-semibold text-[#0D1F3C] truncate flex-1 pr-2">{pickItem.name}</p>
            <button onClick={() => setPickItem(null)} className="text-[#CBD5E1] hover:text-[#94A3B8] shrink-0">
              <X size={12} />
            </button>
          </div>
          <p className="px-3 pt-2 pb-1 text-[10px] text-[#94A3B8] font-medium uppercase tracking-wide">Ajouter au jour :</p>
          <div className="max-h-44 overflow-y-auto pb-2">
            {days.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[#CBD5E1]">Aucun jour dans ce programme</p>
            ) : days.map(day => (
              <button
                key={day.id}
                onClick={() => { onAdd(pickItem, day.id); setPickItem(null) }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#0D1F3C] hover:bg-[#EEF9F3] flex items-center gap-2 transition-colors"
              >
                <span className="w-4 h-4 rounded-md bg-[#EEF9F3] text-[#4E9B6F] text-[9px] font-bold flex items-center justify-center shrink-0">
                  {day.day_number}
                </span>
                <span className="truncate">{day.title ?? `Jour ${day.day_number}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Exercise row ── */
function ExerciseRow({ ex, onChange, onDelete, onAddNext, onToggleSuperset, suggestions, libraryMap, programmeType }: {
  ex: Exercise
  onChange: (field: keyof Exercise, val: string | number | null) => void
  onDelete: () => void
  onAddNext?: () => void
  onToggleSuperset?: () => void
  suggestions: string[]
  libraryMap: Map<string, LibraryExercise>
  programmeType: string
}) {
  const suggestId = `ex-suggest-${ex.id}`
  const isSportif = programmeType === 'sportif'

  function handleNameBlur() {
    const name = ex.exercise_name.trim()
    const libEx = libraryMap.get(name.toLowerCase())
    if (libEx && !ex.notes) {
      onChange('notes', libEx.instructions)
    }
  }

  const isFromLibrary = libraryMap.has(ex.exercise_name.trim().toLowerCase())

  const namePlaceholder = programmeType === 'nutritionnel'
    ? 'Ex: Déjeuner: Poulet riz brocolis'
    : programmeType === 'habitudes'
    ? "Nom de l'habitude"
    : "Nom de l'exercice"

  const notesPlaceholder = programmeType === 'nutritionnel'
    ? 'Ex: 450 kcal · 40g prot · 50g gluc · 12g lip'
    : "Description de l'habitude"

  return (
    <div className="py-2 border-b border-[#F1F5F9] last:border-0">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <input
              value={ex.exercise_name}
              onChange={e => onChange('exercise_name', e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddNext?.() } }}
              list={suggestId}
              placeholder={namePlaceholder}
              className="flex-1 text-[13px] font-medium text-[#0D1F3C] bg-transparent focus:outline-none placeholder:text-[#CBD5E1]"
            />
            {isFromLibrary && (
              <span title="Exercice de ta bibliothèque" className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-[#4E9B6F] flex items-center justify-center">
                <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                  <path d="M1.5 3.5L3 5L5.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>
          {suggestions.length > 0 && (
            <datalist id={suggestId}>
              {suggestions.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          )}
        </div>
        {isSportif && (
          <div className="flex items-center gap-1 shrink-0">
            <input type="number" min={1} value={ex.sets ?? ''} onChange={e => onChange('sets', e.target.value ? +e.target.value : null)}
              placeholder="—" title="Séries"
              className="w-9 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white" />
            <span className="text-[10px] text-[#CBD5E1]">×</span>
            <input type="number" min={1} value={ex.reps ?? ''} onChange={e => onChange('reps', e.target.value ? +e.target.value : null)}
              placeholder="—" title="Reps"
              className="w-9 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white" />
            <span className="text-[10px] text-[#CBD5E1]">reps</span>
            <input type="number" min={0} step={0.5} value={ex.weight_kg ?? ''} onChange={e => onChange('weight_kg', e.target.value ? +e.target.value : null)}
              placeholder="—" title="Charge kg"
              className="w-11 text-center text-[12px] border border-[#E2E8F0] rounded-lg px-1 py-1 focus:outline-none focus:border-[#4E9B6F] bg-white" />
            <span className="text-[10px] text-[#CBD5E1]">kg</span>
          </div>
        )}
        {isSportif && onToggleSuperset && (
          <button
            onClick={onToggleSuperset}
            className={`p-1 rounded-md transition-colors shrink-0 ${
              ex.superset_group
                ? 'text-[#4E9B6F] bg-[#EEF9F3] hover:bg-[#DCF3E8]'
                : 'text-[#CBD5E1] hover:text-[#4E9B6F]'
            }`}
            title={ex.superset_group
              ? `Retirer du superset ${ex.superset_group} (cliquer pour dissocier)`
              : "Enchaîner avec l'exercice précédent (superset)"}
          >
            <Link2 size={11} />
          </button>
        )}
        <button onClick={onDelete} className="p-1 text-[#CBD5E1] hover:text-red-400 transition-colors shrink-0">
          <Trash2 size={12} />
        </button>
      </div>
      {!isSportif && (
        <input
          value={ex.notes ?? ''}
          onChange={e => onChange('notes', e.target.value || null)}
          placeholder={notesPlaceholder}
          className="mt-1 w-full text-[11px] text-[#64748B] bg-transparent focus:outline-none placeholder:text-[#CBD5E1]"
        />
      )}
    </div>
  )
}

/* ── Day card ── */
function DayCard({ day, onUpdateTitle, onAddExercise, onUpdateExercise, onDeleteExercise, onSave, onDelete, onDuplicate, saving, suggestions, autoSaving, libraryMap, programmeType, onDropExercise }: {
  day: Day
  onUpdateTitle: (t: string) => void
  onAddExercise: () => void
  onUpdateExercise: (exId: string, field: keyof Exercise, val: string | number | null) => void
  onDeleteExercise: (exId: string) => void
  onSave: () => void
  onDelete: () => void
  onDuplicate: () => void
  saving: boolean
  autoSaving: boolean
  suggestions: string[]
  libraryMap: Map<string, LibraryExercise>
  programmeType: string
  onDropExercise?: (ex: LibraryExercise) => void
}) {
  const [open, setOpen] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    if (!onDropExercise) return
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const ex = JSON.parse(data) as LibraryExercise
        onDropExercise(ex)
        setOpen(true)
      }
    } catch { /* ignore malformed data */ }
  }

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-all ${
        isDragOver
          ? 'border-[#4E9B6F] ring-2 ring-[#4E9B6F]/20 shadow-sm'
          : 'border-[#E2E8F0]'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#FAFBFD]" onClick={() => setOpen(o => !o)}>
        <span className="w-6 h-6 rounded-lg bg-[#EEF9F3] text-[#4E9B6F] text-[11px] font-bold flex items-center justify-center shrink-0">
          {day.day_number}
        </span>
        <input
          value={day.title ?? `Jour ${day.day_number}`}
          onChange={e => { e.stopPropagation(); onUpdateTitle(e.target.value) }}
          onClick={e => e.stopPropagation()}
          className="flex-1 text-[13px] font-semibold text-[#0D1F3C] bg-transparent focus:outline-none"
        />
        <span className="text-[11px] text-[#94A3B8] shrink-0">
          {day.programme_day_exercises.length} {programmeType === 'nutritionnel' ? 'repas' : programmeType === 'habitudes' ? 'habit.' : 'ex.'}
        </span>
        {autoSaving && <span className="text-[10px] text-[#94A3B8] shrink-0">sauvegarde…</span>}
        {isDragOver && (
          <span className="text-[10px] text-[#4E9B6F] font-medium shrink-0">Déposer ici</span>
        )}
        {open ? <ChevronDown size={14} className="text-[#94A3B8]" /> : <ChevronRight size={14} className="text-[#94A3B8]" />}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9]">
          <div className="pt-2">
            {day.programme_day_exercises.length === 0 ? (
              <p className="text-[12px] text-[#CBD5E1] py-2 text-center">
                {programmeType === 'nutritionnel' ? 'Aucun repas' : programmeType === 'habitudes' ? 'Aucune habitude' : 'Aucun exercice'}
              </p>
            ) : (() => {
              const groups = groupExercises(day.programme_day_exercises)
              const allSorted = [...day.programme_day_exercises].sort((a, b) => a.position - b.position)
              return groups.map((group, gi) => {
                if (!group.group) {
                  const ex = group.items[0]
                  const isLast = gi === groups.length - 1
                  return (
                    <ExerciseRow key={ex.id} ex={ex}
                      onChange={(f, v) => onUpdateExercise(ex.id, f, v)}
                      onDelete={() => onDeleteExercise(ex.id)}
                      onAddNext={isLast ? () => onAddExercise() : undefined}
                      onToggleSuperset={() => {
                        const sorted = allSorted
                        const idx = sorted.findIndex(e => e.id === ex.id)
                        const prev = idx > 0 ? sorted[idx - 1] : null
                        if (!prev) return
                        const used = new Set(day.programme_day_exercises.map(e => e.superset_group).filter(Boolean))
                        const newGroup = ['A','B','C','D','E','F','G','H'].find(l => !used.has(l)) ?? 'A'
                        if (prev.superset_group) {
                          onUpdateExercise(ex.id, 'superset_group', prev.superset_group)
                        } else {
                          onUpdateExercise(prev.id, 'superset_group', newGroup)
                          onUpdateExercise(ex.id, 'superset_group', newGroup)
                        }
                      }}
                      suggestions={suggestions}
                      libraryMap={libraryMap}
                      programmeType={programmeType}
                    />
                  )
                }
                // Superset group
                const isLast = gi === groups.length - 1
                return (
                  <div key={group.group} className="border border-[#4E9B6F]/30 rounded-xl overflow-hidden bg-[#F6FDF9] mb-2">
                    <div className="flex items-center justify-between px-3 py-1 bg-[#EEF9F3] border-b border-[#4E9B6F]/20">
                      <span className="text-[10px] font-bold text-[#4E9B6F] uppercase tracking-wider">
                        Superset {group.group} · enchaîner sans repos
                      </span>
                    </div>
                    {group.items.map((ex, iIdx) => (
                      <ExerciseRow key={ex.id} ex={ex}
                        onChange={(f, v) => onUpdateExercise(ex.id, f, v)}
                        onDelete={() => onDeleteExercise(ex.id)}
                        onAddNext={isLast && iIdx === group.items.length - 1 ? () => onAddExercise() : undefined}
                        onToggleSuperset={() => {
                          const members = day.programme_day_exercises.filter(e => e.superset_group === group.group)
                          onUpdateExercise(ex.id, 'superset_group', null)
                          if (members.length === 2) {
                            const other = members.find(e => e.id !== ex.id)
                            if (other) onUpdateExercise(other.id, 'superset_group', null)
                          }
                        }}
                        suggestions={suggestions}
                        libraryMap={libraryMap}
                        programmeType={programmeType}
                      />
                    ))}
                  </div>
                )
              })
            })()}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={onAddExercise} className="flex items-center gap-1.5 text-[12px] text-[#4E9B6F] font-medium hover:text-[#3d8058] transition-colors">
              <Plus size={12} /> {programmeType === 'nutritionnel' ? 'Ajouter un repas' : programmeType === 'habitudes' ? 'Ajouter une habitude' : 'Ajouter'}
            </button>
            <div className="flex-1" />
            <button onClick={onDuplicate} className="text-[11px] text-[#64748B] hover:text-[#4E9B6F] transition-colors flex items-center gap-1">
              <Copy size={11} /> Copier
            </button>
            <button onClick={onDelete} className="text-[11px] text-[#CBD5E1] hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 size={11} /> Supprimer
            </button>
            <button onClick={onSave} disabled={saving}
              className="px-3 py-1.5 bg-[#4E9B6F] text-white rounded-lg text-[12px] font-medium hover:bg-[#3d8058] transition-colors disabled:opacity-50">
              {saving ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main ── */
export function ProgrammeBuilder({ programme, initialDays, clients, assignments, libraryExercises, nutritionLibraryItems = [], habitLibraryItems = [], aiProgrammesUsed: initialAiUsed = 0, aiProgrammesLimit = -1 }: Props) {
  const [days, setDays]                           = useState<Day[]>(initialDays)
  const [savingDay, setSavingDay]                 = useState<string | null>(null)
  const [autoSavingDay, setAutoSavingDay]         = useState<string | null>(null)
  const [addingDay, setAddingDay]                 = useState(false)
  const [generating, setGenerating]               = useState(false)
  const [generateProgress, setGenerateProgress]   = useState('')
  const [aiUsedCount, setAiUsedCount]             = useState(initialAiUsed)
  const [showAssign, setShowAssign]               = useState(false)
  const [assignClientId, setAssignClientId]       = useState(clients[0]?.id ?? '')
  const [assignStart, setAssignStart]             = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [assigning, setAssigning]                 = useState(false)
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>(assignments)
  const [sessionAssigned, setSessionAssigned]     = useState<string[]>([])
  const [showLibrary, setShowLibrary]             = useState(false)
  const [selectedPhase, setSelectedPhase]         = useState<number | null>(null)

  const daysRef = useRef(days)
  useEffect(() => { daysRef.current = days }, [days])

  const autosaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingDeletes = useRef<Map<string, { day: Day; timerId: ReturnType<typeof setTimeout> }>>(new Map())

  const libraryMap = useMemo(() => {
    const map = new Map<string, LibraryExercise>()
    for (const ex of libraryExercises) {
      map.set(ex.name.toLowerCase(), ex)
    }
    return map
  }, [libraryExercises])

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>()
    for (const ex of libraryExercises) names.add(ex.name)
    for (const d of days) {
      for (const ex of d.programme_day_exercises) {
        if (ex.exercise_name.trim()) names.add(ex.exercise_name.trim())
      }
    }
    return Array.from(names)
  }, [days, libraryExercises])

  // Périodisation : phases calculées depuis les jours existants
  const phases = useMemo(() => {
    const ps = new Set(days.map(d => d.phase ?? 1))
    return Array.from(ps).sort((a, b) => a - b)
  }, [days])
  const maxPhase = phases.length > 0 ? Math.max(...phases) : 1
  const visibleDays = selectedPhase !== null
    ? days.filter(d => (d.phase ?? 1) === selectedPhase)
    : days

  useEffect(() => {
    if (initialDays.length === 0 && programme.description !== undefined) {
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scheduleAutosave(dayId: string) {
    const existing = autosaveTimers.current.get(dayId)
    if (existing) clearTimeout(existing)
    setAutoSavingDay(dayId)
    const timer = setTimeout(async () => {
      autosaveTimers.current.delete(dayId)
      setAutoSavingDay(null)
      const latestDay = daysRef.current.find(d => d.id === dayId)
      if (latestDay && !dayId.startsWith('new-')) {
        await saveDay(latestDay, true)
      }
    }, 2000)
    autosaveTimers.current.set(dayId, timer)
  }

  function addExerciseFromLibrary(dayId: string, libEx: LibraryExercise) {
    setDays(prev => {
      const day = prev.find(d => d.id === dayId)
      if (!day) return prev
      const newEx: Exercise = {
        id: makeId(),
        exercise_name: libEx.name,
        sets: 3,
        reps: 10,
        weight_kg: null,
        rest_seconds: 60,
        notes: libEx.instructions || null,
        position: day.programme_day_exercises.length,
        superset_group: null,
      }
      return prev.map(d => d.id !== dayId ? d : {
        ...d,
        programme_day_exercises: [...d.programme_day_exercises, newEx],
      })
    })
    scheduleAutosave(dayId)
    toast.success(`"${libEx.name}" ajouté`)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerateProgress('')

    const durationDays = programme.duration_days ?? 28

    let frequency = 3
    try {
      const meta = JSON.parse(programme.description ?? '{}')
      frequency = meta.frequency ?? 3
    } catch { /* ignore */ }

    const BATCH_SIZE = programme.type === 'sportif' ? 6 : 4
    const totalDays = programme.type === 'sportif'
      ? Math.round((durationDays / 7) * frequency)
      : Math.min(durationDays, 28)

    const batches: { from: number; to: number }[] = []
    for (let start = 1; start <= totalDays; start += BATCH_SIZE) {
      batches.push({ from: start, to: Math.min(start + BATCH_SIZE - 1, totalDays) })
    }

    const allGeneratedDays: { day_number: number; title: string; exercises: Exercise[] }[] = []

    for (let i = 0; i < batches.length; i++) {
      const { from, to } = batches[i]
      setGenerateProgress(batches.length > 1 ? `Lot ${i + 1} / ${batches.length}…` : '')

      const res = await fetch('/api/programmes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programme_id: programme.id,
          title: programme.title,
          type: programme.type,
          duration_days: durationDays,
          description: programme.description ?? '',
          batch_from: from,
          batch_to: to,
          total_days: totalDays,
        }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); setGenerating(false); setGenerateProgress(''); return }
      allGeneratedDays.push(...(data.days ?? []))
    }

    setGenerateProgress('Sauvegarde…')
    const savedDays: Day[] = []
    for (const d of allGeneratedDays) {
      const r = await fetch('/api/programmes/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programme_id: programme.id,
          day_number: d.day_number,
          title: d.title,
          exercises: d.exercises,
        }),
      })
      const saved = await r.json()
      if (saved.day) {
        savedDays.push({
          ...saved.day,
          programme_day_exercises: (d.exercises ?? []).map((ex: Exercise, i: number) => ({ ...ex, id: makeId(), position: i })),
        })
      }
    }

    setDays(savedDays)
    setGenerating(false)
    setGenerateProgress('')
    setAiUsedCount(c => c + 1)
    toast.success(`${savedDays.length} jours générés par l'IA`)
  }

  async function handleRegenerate() {
    if (!confirm('Régénérer le programme ? Les jours existants seront supprimés.')) return
    for (const d of days) {
      await fetch('/api/programmes/days', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_id: d.id }),
      })
    }
    setDays([])
    handleGenerate()
  }

  function updateDayTitle(dayId: string, title: string) {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, title } : d))
  }

  function addExercise(dayId: string) {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      return { ...d, programme_day_exercises: [...d.programme_day_exercises, makeExercise(d.programme_day_exercises.length)] }
    }))
  }

  function updateExercise(dayId: string, exId: string, field: keyof Exercise, val: string | number | null) {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      return { ...d, programme_day_exercises: d.programme_day_exercises.map(ex => ex.id === exId ? { ...ex, [field]: val } : ex) }
    }))
    scheduleAutosave(dayId)
  }

  function deleteExercise(dayId: string, exId: string) {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d
      return { ...d, programme_day_exercises: d.programme_day_exercises.filter(ex => ex.id !== exId) }
    }))
    scheduleAutosave(dayId)
  }

  async function saveDay(day: Day, silent = false) {
    setSavingDay(day.id)
    const exercises = day.programme_day_exercises.filter(ex => ex.exercise_name.trim()).map((ex, i) => ({ ...ex, position: i }))
    const res = await fetch('/api/programmes/days', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_id: day.id, title: day.title, exercises }),
    })
    setSavingDay(null)
    if (!res.ok) { if (!silent) toast.error('Erreur'); return }
    if (!silent) toast.success(`Jour ${day.day_number} sauvegardé`)
  }

  async function addDay(phase?: number) {
    setAddingDay(true)
    const targetPhase = phase ?? selectedPhase ?? 1
    const res = await fetch('/api/programmes/days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme_id: programme.id, day_number: days.length + 1, phase: targetPhase }),
    })
    const data = await res.json()
    setAddingDay(false)
    if (data.error) { toast.error(data.error); return }
    setDays(prev => [...prev, { ...data.day, phase: targetPhase, programme_day_exercises: [] }])
  }

  async function addPhase() {
    const newPhase = maxPhase + 1
    await addDay(newPhase)
    setSelectedPhase(newPhase)
  }

  function deleteDay(dayId: string) {
    const dayToDelete = days.find(d => d.id === dayId)
    if (!dayToDelete) return
    setDays(prev => prev.filter(d => d.id !== dayId).map((d, i) => ({ ...d, day_number: i + 1 })))

    const timerId = setTimeout(async () => {
      pendingDeletes.current.delete(dayId)
      if (!dayId.startsWith('new-')) {
        await fetch('/api/programmes/days', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day_id: dayId }),
        })
      }
    }, 5000)
    pendingDeletes.current.set(dayId, { day: dayToDelete, timerId })

    toast('Jour supprimé', {
      action: {
        label: 'Annuler',
        onClick: () => {
          const p = pendingDeletes.current.get(dayId)
          if (p) {
            clearTimeout(p.timerId)
            pendingDeletes.current.delete(dayId)
            setDays(prev => [...prev, p.day].sort((a, b) => a.day_number - b.day_number).map((d, i) => ({ ...d, day_number: i + 1 })))
          }
        },
      },
      duration: 5000,
    })
  }

  async function handleDuplicateDay(dayId: string) {
    const src = days.find(d => d.id === dayId)
    if (!src) return
    const newDayNumber = days.length + 1
    const res = await fetch('/api/programmes/days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programme_id: programme.id,
        day_number: newDayNumber,
        title: src.title ? `${src.title} (copie)` : null,
        exercises: src.programme_day_exercises.map(ex => ({
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
        })),
      }),
    })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setDays(prev => [...prev, {
      ...data.day,
      programme_day_exercises: src.programme_day_exercises.map(ex => ({ ...ex, id: makeId() })),
    }])
    toast.success(`Jour ${newDayNumber} créé`)
  }

  async function handleAssign() {
    if (!assignClientId) return
    setAssigning(true)
    const res = await fetch('/api/programmes/assign', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programme_id: programme.id, client_id: assignClientId, start_date: assignStart }),
    })
    const data = await res.json()
    setAssigning(false)
    if (data.error) { toast.error(data.error); return }
    const client = clients.find(c => c.id === assignClientId)
    setActiveAssignments(prev => [
      { id: data.assignment.id, client_id: assignClientId, start_date: assignStart, active: true, clients: { full_name: client?.full_name ?? '' } },
      ...prev.filter(a => a.client_id !== assignClientId),
    ])
    const newAssigned = [...sessionAssigned, assignClientId]
    setSessionAssigned(newAssigned)
    const nextClient = clients.find(c => !newAssigned.includes(c.id) && c.id !== assignClientId)
    if (nextClient) setAssignClientId(nextClient.id)
    toast.success(`Programme assigné à ${client?.full_name ?? ''}`)
  }

  async function removeAssignment(assignmentId: string) {
    await fetch('/api/programmes/assign', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: assignmentId }),
    })
    setActiveAssignments(prev => prev.filter(a => a.id !== assignmentId))
    toast.success('Assignation retirée')
  }

  const showLibraryPanel = (
    (programme.type === 'sportif' && libraryExercises.length > 0) ||
    (programme.type === 'nutritionnel' && nutritionLibraryItems.length > 0) ||
    (programme.type === 'habitudes' && habitLibraryItems.length > 0)
  )

  return (
    <div className="flex flex-1">
      {/* Library Panel — Desktop (sticky sidebar) */}
      {showLibraryPanel && (
        <div className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white self-start sticky top-0 h-screen overflow-hidden">
          <LibraryPanel
            libraryExercises={libraryExercises}
            nutritionLibraryItems={nutritionLibraryItems}
            habitLibraryItems={habitLibraryItems}
            onAdd={(ex, dayId) => addExerciseFromLibrary(dayId, ex)}
            days={days}
            programmeType={programme.type}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/programmes" className="p-1.5 text-[#94A3B8] hover:text-[#64748B] transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-bold text-[#0D1F3C] truncate">{programme.title}</h1>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">{days.length} jour{days.length !== 1 ? 's' : ''} · {programme.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] hidden sm:block">
                {aiProgrammesLimit === -1
                  ? `${aiUsedCount} génération${aiUsedCount !== 1 ? 's' : ''} ce mois`
                  : `${aiUsedCount}/${aiProgrammesLimit} ce mois · renouvellement le 1er`
                }
              </span>
              {days.length > 0 && (
                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] text-[#64748B] rounded-xl text-[12px] font-medium hover:bg-[#F8FAFB] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                  Régénérer
                </button>
              )}
              <button
                onClick={() => { setShowAssign(true); setSessionAssigned([]); setAssignClientId(clients[0]?.id ?? '') }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-medium hover:bg-[#3d8058] transition-colors"
              >
                <Users size={14} /> Assigner
              </button>
            </div>
          </div>

          {/* Assignments */}
          {activeAssignments.length > 0 && (
            <div className="mb-5 p-4 bg-[#EEF9F3] rounded-xl border border-[#C6EDD8]">
              <p className="text-[11px] font-semibold text-[#4E9B6F] uppercase tracking-wide mb-2">Assigné à</p>
              <div className="space-y-1.5">
                {activeAssignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#0D1F3C]">{a.clients?.full_name}</span>
                      <span className="text-[11px] text-[#64748B] ml-2">
                        depuis le {new Date(a.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <button onClick={() => removeAssignment(a.id)} className="text-[11px] text-[#CBD5E1] hover:text-red-400 transition-colors">
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Périodisation — onglets de phases (sport uniquement, si > 1 phase ou programme non vide) */}
          {programme.type === 'sportif' && days.length > 0 && (
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 shrink-0">
              <button
                onClick={() => setSelectedPhase(null)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  selectedPhase === null
                    ? 'text-white'
                    : 'text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0]'
                }`}
                style={selectedPhase === null ? { backgroundColor: 'var(--brand)' } : {}}
              >
                Tout · {days.length}j
              </button>
              {phases.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    selectedPhase === p
                      ? 'text-white'
                      : 'text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0]'
                  }`}
                  style={selectedPhase === p ? { backgroundColor: 'var(--brand)' } : {}}
                >
                  Phase {p} · {days.filter(d => (d.phase ?? 1) === p).length}j
                </button>
              ))}
              <button
                onClick={addPhase}
                disabled={addingDay}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#4E9B6F] bg-[#EEF9F3] hover:bg-[#DCF3E8] transition-colors disabled:opacity-50"
              >
                <Plus size={11} /> Phase
              </button>
            </div>
          )}

          {/* Loading state */}
          {generating ? (
            <ProgrammeGeneratingSkeleton progress={generateProgress} />
          ) : (
            <>
              <div className="space-y-3">
                {visibleDays.map(day => (
                  <DayCard
                    key={day.id}
                    day={day}
                    onUpdateTitle={t => updateDayTitle(day.id, t)}
                    onAddExercise={() => addExercise(day.id)}
                    onUpdateExercise={(exId, f, v) => updateExercise(day.id, exId, f, v)}
                    onDeleteExercise={exId => deleteExercise(day.id, exId)}
                    onSave={() => saveDay(day)}
                    onDelete={() => deleteDay(day.id)}
                    onDuplicate={() => handleDuplicateDay(day.id)}
                    saving={savingDay === day.id}
                    autoSaving={autoSavingDay === day.id}
                    suggestions={allExerciseNames}
                    libraryMap={libraryMap}
                    programmeType={programme.type}
                    onDropExercise={(ex) => addExerciseFromLibrary(day.id, ex)}
                  />
                ))}

                <button
                  onClick={() => addDay()}
                  disabled={addingDay}
                  className="w-full py-3 border-2 border-dashed border-[#E2E8F0] rounded-xl text-[13px] text-[#94A3B8] font-medium hover:border-[#4E9B6F] hover:text-[#4E9B6F] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={14} /> Ajouter un jour manuellement
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile library button + bottom sheet */}
      {showLibraryPanel && (
        <>
          <button
            onClick={() => setShowLibrary(true)}
            className="fixed bottom-6 right-6 lg:hidden z-40 flex items-center gap-2 px-4 py-3 bg-[#4E9B6F] text-white rounded-2xl shadow-lg text-[13px] font-semibold hover:bg-[#3d8058] transition-colors"
          >
            <BookOpen size={15} />
            Bibliothèque
          </button>

          {showLibrary && (
            <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowLibrary(false)} />
              <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: '78vh' }}>
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#E2E8F0] shrink-0">
                  <h3 className="text-[14px] font-semibold text-[#0D1F3C]">
                    {programme.type === 'nutritionnel'
                      ? 'Bibliothèque nutritionnelle'
                      : programme.type === 'habitudes'
                      ? 'Bibliothèque d\'habitudes'
                      : 'Bibliothèque d\'exercices'}
                  </h3>
                  <button onClick={() => setShowLibrary(false)} className="p-1 text-[#94A3B8] hover:text-[#64748B]">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <LibraryPanel
                    libraryExercises={libraryExercises}
                    nutritionLibraryItems={nutritionLibraryItems}
                    habitLibraryItems={habitLibraryItems}
                    onAdd={(ex, dayId) => { addExerciseFromLibrary(dayId, ex); setShowLibrary(false) }}
                    days={days}
                    programmeType={programme.type}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAssign(false)} />
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[#0D1F3C]">Assigner le programme</h3>
              {sessionAssigned.length > 0 && (
                <span className="text-[11px] font-semibold text-[#4E9B6F] bg-[#4E9B6F]/10 px-2 py-0.5 rounded-full">
                  {sessionAssigned.length} assigné{sessionAssigned.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {sessionAssigned.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-[#F0FBF5] rounded-xl border border-[#C6E9D4]">
                {sessionAssigned.map(id => {
                  const c = clients.find(cl => cl.id === id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D6A4F] bg-white border border-[#C6E9D4] px-2 py-0.5 rounded-full">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="#4E9B6F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {c?.full_name ?? id}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Client</label>
                <select value={assignClientId} onChange={e => setAssignClientId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#4E9B6F]">
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}{sessionAssigned.includes(c.id) ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Date de départ</label>
                <input type="date" value={assignStart} onChange={e => setAssignStart(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#4E9B6F]" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAssign(false)}
                className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
                Fermer
              </button>
              <button onClick={handleAssign} disabled={assigning || !assignClientId}
                className="flex-1 py-2.5 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3d8058] transition-colors disabled:opacity-50">
                {assigning ? '…' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
