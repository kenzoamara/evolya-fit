'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Search, Dumbbell, Plus, ChevronDown, ChevronUp, X, Trash2,
  Sparkles, BookOpen, Leaf, CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/coach/page-header'
import type { Profile } from '@/types/database'
import type { Exercise, NutritionItem, HabitTemplate } from './page'
import { NutritionView } from './nutrition-view'
import { HabitudesView } from './habitudes-view'
import { getPlanLimits } from '@/lib/plan-limits'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  profile: Profile
  exercises: Exercise[]
  nutritionItems: NutritionItem[]
  habitTemplates: HabitTemplate[]
  coachId: string
  exerciseLimit?: number
  aiExercisesUsed?: number
  aiExercisesLimit?: number
}

type LibraryTheme = 'sport' | 'nutrition' | 'habitudes'
type FilterCategory = 'tous' | Exercise['category']

// ─── Config ───────────────────────────────────────────────────────────────────

const THEMES = [
  { id: 'sport'      as const, label: 'Sport',      icon: Dumbbell,      color: '#3B82F6', bg: '#EFF6FF', desc: 'Exercices & mouvements' },
  { id: 'nutrition'  as const, label: 'Nutrition',  icon: Leaf,          color: '#22C55E', bg: '#F0FDF4', desc: 'Conseils alimentaires' },
  { id: 'habitudes'  as const, label: 'Habitudes',  icon: CheckCircle2,  color: '#8B5CF6', bg: '#F5F3FF', desc: 'Routines & comportements' },
]

const CATEGORIES = [
  { id: 'tous',       label: 'Tous',           color: '#64748B', bg: '#F1F5F9' },
  { id: 'force',      label: '🦾 Force',       color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'cardio',     label: '🔥 Cardio',      color: '#EF4444', bg: '#FEF2F2' },
  { id: 'hiit',       label: '⚡ HIIT',        color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'mobilite',   label: '🌀 Mobilité',    color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'stretching', label: '🎯 Etirement',   color: '#0EA5E9', bg: '#F0F9FF' },
] as const

const DIFFICULTY_LABELS: Record<Exercise['difficulty'], string> = {
  debutant:      'Débutant',
  intermediaire: 'Intermédiaire',
  avance:        'Avancé',
}

const DIFFICULTY_COLORS: Record<Exercise['difficulty'], string> = {
  debutant:      'bg-emerald-50 text-emerald-700',
  intermediaire: 'bg-amber-50 text-amber-700',
  avance:        'bg-red-50 text-red-600',
}

const CATEGORY_LABELS: Record<Exercise['category'], string> = {
  force:      'Force',
  cardio:     'Cardio',
  hiit:       'HIIT',
  mobilite:   'Mobilité',
  stretching: 'Etirement',
}

const MUSCLE_GROUPS = [
  'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps',
  'Abdominaux', 'Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Mollets',
  'Trapèzes', 'Avant-bras', 'Full body',
]

const EQUIPMENTS = [
  'aucun', 'haltères', 'barre', 'machine', 'câble', 'kettlebell',
  'élastique', 'TRX', 'banc', 'tapis',
]

const DIFFICULTIES = ['debutant', 'intermediaire', 'avance'] as const

// ─── Sous-composants Sport ────────────────────────────────────────────────────

function DifficultyBadge({ d }: { d: Exercise['difficulty'] }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[d]}`}>
      {DIFFICULTY_LABELS[d]}
    </span>
  )
}

type Programme = { id: string; title: string; type: string }
type ProgrammeDay = { id: string; day_number: number; title: string | null }

function ExerciseCard({ ex, isOwn, onDelete, onAddToProgramme }: {
  ex: Exercise
  isOwn: boolean
  onDelete: () => void
  onAddToProgramme: (ex: Exercise) => void
}) {
  const [open, setOpen] = useState(false)
  const steps = ex.instructions.split('\n').filter(s => s.trim() && !/^\d+$/.test(s.trim()))

  return (
    <div className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden group">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#FAFBFE] transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center shrink-0 mt-0.5">
          <Dumbbell size={15} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0D1F3C]">{ex.name}</span>
            <DifficultyBadge d={ex.difficulty} />
            {!ex.is_global && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-bg text-brand">Perso</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[11px] text-[#64748B]">{ex.muscle_group}</span>
            {ex.muscles.length > 0 && (
              <span className="text-[11px] text-[#94A3B8]">+ {ex.muscles.join(', ')}</span>
            )}
            {ex.equipment !== 'aucun' && (
              <span className="text-[11px] text-[#94A3B8]">· {ex.equipment}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span
            role="button" tabIndex={0}
            onClick={e => { e.stopPropagation(); onAddToProgramme(ex) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onAddToProgramme(ex) } }}
            title="Ajouter à un programme"
            className="p-1.5 text-[#CBD5E1] hover:text-[#4E9B6F] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <BookOpen size={13} />
          </span>
          {isOwn && (
            <span
              role="button" tabIndex={0}
              onClick={e => { e.stopPropagation(); onDelete() }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onDelete() } }}
              className="p-1.5 text-[#CBD5E1] hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </span>
          )}
          {open ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#F8FAFC]">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mt-3 mb-2">Instructions</p>
          <ol className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] text-[#475569] leading-relaxed">
                <span className="shrink-0 w-4 h-4 rounded-full bg-brand-bg text-brand flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {step.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9] flex-wrap">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
              {CATEGORY_LABELS[ex.category]}
            </span>
            <span className="text-[10px] text-[#94A3B8]">{ex.muscle_group}</span>
            {ex.equipment !== 'aucun' && (
              <span className="text-[10px] text-[#94A3B8]">· {ex.equipment}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ExercicesContent({
  profile,
  exercises: initialExercises,
  nutritionItems,
  habitTemplates,
  coachId,
  exerciseLimit,
  aiExercisesUsed: initialAiUsed = 0,
  aiExercisesLimit = -1,
}: Props) {

  const limits = getPlanLimits(profile.plan)
  const visibleThemes = THEMES.filter(t => t.id !== 'habitudes' || limits.habitudes)

  // ── Thème ──
  const [theme, setTheme]       = useState<LibraryTheme>('sport')
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)

  // Fermer le panel thème au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Modal "Ajouter" piloté depuis PageHeader ──
  const [showAddModal, setShowAddModal] = useState(false)

  // ── Vue Sport ──
  const [exercises, setExercises]   = useState<Exercise[]>(initialExercises)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState<FilterCategory>('tous')
  const [diffFilter, setDiffFilter] = useState<Exercise['difficulty'] | 'tous'>('tous')
  const [showModal, setShowModal]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Modal ajouter à un programme
  const [addTarget, setAddTarget]       = useState<Exercise | null>(null)
  const [programmes, setProgrammes]     = useState<Programme[]>([])
  const [selectedProg, setSelectedProg] = useState('')
  const [days, setDays]                 = useState<ProgrammeDay[]>([])
  const [selectedDay, setSelectedDay]   = useState('')
  const [loadingDays, setLoadingDays]   = useState(false)
  const [addingEx, setAddingEx]         = useState(false)

  useEffect(() => {
    fetch('/api/programmes/list')
      .then(r => r.json())
      .then(d => { if (d.programmes) setProgrammes(d.programmes) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProg) { setDays([]); setSelectedDay(''); return }
    setLoadingDays(true)
    fetch(`/api/programmes/list?days=1&programme_id=${selectedProg}`)
      .then(r => r.json())
      .then(d => {
        setDays(d.days ?? [])
        setSelectedDay(d.days?.[0]?.id ?? '')
      })
      .finally(() => setLoadingDays(false))
  }, [selectedProg])

  function openAddToProgramme(ex: Exercise) {
    setAddTarget(ex)
    setSelectedProg(programmes[0]?.id ?? '')
    setSelectedDay('')
  }

  async function handleAddToProgramme() {
    if (!addTarget || !selectedProg || !selectedDay) return
    setAddingEx(true)
    const res = await fetch('/api/exercises/add-to-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_id: selectedDay,
        exercise_name: addTarget.name,
        instructions: addTarget.instructions,
      }),
    })
    const data = await res.json()
    setAddingEx(false)
    if (data.error) { toast.error(data.error); return }
    const prog = programmes.find(p => p.id === selectedProg)
    const day = days.find(d => d.id === selectedDay)
    toast.success(`"${addTarget.name}" ajouté au ${day?.title ?? `Jour ${day?.day_number}`} de "${prog?.title}"`)
    setAddTarget(null)
  }

  // Formulaire création exercice
  const [name, setName]               = useState('')
  const [cat, setCat]                 = useState<Exercise['category']>('force')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [muscles, setMuscles]         = useState('')
  const [equipment, setEquipment]     = useState<string[]>(['aucun'])
  const [difficulty, setDifficulty]   = useState<Exercise['difficulty']>('intermediaire')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving]           = useState(false)
  const [generating, setGenerating]   = useState(false)
  const [aiUsedCount, setAiUsedCount] = useState(initialAiUsed)

  function toggleEquipment(eq: string) {
    if (eq === 'aucun') { setEquipment(['aucun']); return }
    setEquipment(prev => {
      const withoutAucun = prev.filter(e => e !== 'aucun')
      if (withoutAucun.includes(eq)) {
        const next = withoutAucun.filter(e => e !== eq)
        return next.length === 0 ? ['aucun'] : next
      }
      return [...withoutAucun, eq]
    })
  }

  const equipmentStr = equipment.includes('aucun') ? 'aucun' : equipment.join(', ')

  async function handleGenerate() {
    if (!name.trim()) { toast.error('Tape le nom de l\'exercice d\'abord.'); return }
    setGenerating(true)
    const res = await fetch('/api/exercises/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), equipment: equipmentStr }),
    })
    const data = await res.json()
    setGenerating(false)
    if (data.error) { toast.error(data.error); return }
    setCat(data.category)
    setMuscleGroup(data.muscle_group)
    setMuscles(data.muscles.join(', '))
    setDifficulty(data.difficulty)
    setInstructions(data.instructions)
    setAiUsedCount(c => c + 1)
    toast.success('Champs remplis par l\'IA.')
  }

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      if (category !== 'tous' && ex.category !== category) return false
      if (diffFilter !== 'tous' && ex.difficulty !== diffFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          ex.name.toLowerCase().includes(q) ||
          ex.muscle_group.toLowerCase().includes(q) ||
          ex.muscles.some(m => m.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [exercises, category, diffFilter, search])

  const counts = useMemo(() => {
    const base = exercises.filter(ex => {
      if (diffFilter !== 'tous' && ex.difficulty !== diffFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return ex.name.toLowerCase().includes(q) || ex.muscle_group.toLowerCase().includes(q)
      }
      return true
    })
    return {
      tous:       base.length,
      force:      base.filter(e => e.category === 'force').length,
      cardio:     base.filter(e => e.category === 'cardio').length,
      hiit:       base.filter(e => e.category === 'hiit').length,
      mobilite:   base.filter(e => e.category === 'mobilite').length,
      stretching: base.filter(e => e.category === 'stretching').length,
    }
  }, [exercises, diffFilter, search])

  // Gérer le bouton "Ajouter" piloté depuis le PageHeader pour la vue Sport
  useEffect(() => {
    if (showAddModal && theme === 'sport') {
      setShowModal(true)
      setShowAddModal(false)
    }
  }, [showAddModal, theme])

  function openModal() {
    setName(''); setCat('force'); setMuscleGroup(''); setMuscles('')
    setEquipment(['aucun']); setDifficulty('intermediaire'); setInstructions('')
    setShowModal(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !muscleGroup || !instructions.trim()) return
    setSaving(true)
    const res = await fetch('/api/exercises/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        category: cat,
        muscle_group: muscleGroup,
        muscles: muscles.split(',').map(m => m.trim()).filter(Boolean),
        equipment: equipmentStr,
        difficulty,
        instructions: instructions.trim(),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setExercises(prev => [data.exercise, ...prev])
    setShowModal(false)
    toast.success('Exercice ajouté.')
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch('/api/exercises/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId: id }),
    })
    const data = await res.json()
    setDeletingId(null)
    if (data.error) { toast.error(data.error); return }
    setExercises(prev => prev.filter(e => e.id !== id))
    toast.success('Exercice supprimé.')
  }

  // ── Config thème courant ──
  const currentTheme = THEMES.find(t => t.id === theme)!

  const THEME_TITLES: Record<LibraryTheme, string> = {
    sport:      'Bibliothèque Sport',
    nutrition:  'Bibliothèque Nutrition',
    habitudes:  'Bibliothèque Habitudes',
  }

  const THEME_ADD_LABELS: Record<LibraryTheme, string> = {
    sport:      'Ajouter un exercice',
    nutrition:  'Ajouter un modèle',
    habitudes:  'Ajouter une habitude',
  }

  const THEME_DESCS: Record<LibraryTheme, string> = {
    sport:     'Exercices pour vos programmes',
    nutrition: 'Modèles nutritionnels à assigner à vos clients',
    habitudes: 'Habitudes à assigner à vos clients',
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <PageHeader
        title={THEME_TITLES[theme]}
        description={THEME_DESCS[theme]}
        action={
          <button
            onClick={() => {
              if (theme === 'sport') { openModal() }
              else { setShowAddModal(true) }
            }}
            className="flex items-center gap-1.5 px-3 py-2 btn-brand rounded-lg text-[13px] font-medium transition-colors"
          >
            <Plus size={14} /> {THEME_ADD_LABELS[theme]}
          </button>
        }
      />

      {/* Sélecteur de thème */}
      <div className="px-6 pt-4 pb-1 shrink-0" ref={themeRef}>
        <button
          onClick={() => setThemeOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-full text-[12px] font-medium text-[#475569] hover:border-[#CBD5E1] transition-colors shadow-sm"
        >
          <currentTheme.icon size={12} style={{ color: currentTheme.color }} />
          <span className="font-semibold" style={{ color: currentTheme.color }}>{currentTheme.label}</span>
          <ChevronDown
            size={10}
            className="text-[#94A3B8] transition-transform duration-200"
            style={{ transform: themeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Panel déployé */}
        <div
          className="overflow-hidden transition-all duration-200"
          style={{ maxHeight: themeOpen ? '80px' : '0px', opacity: themeOpen ? 1 : 0, marginTop: themeOpen ? '8px' : '0px' }}
        >
          <div className="flex gap-2">
            {visibleThemes.map(t => {
              const Icon = t.icon
              const active = theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id)
                    setThemeOpen(false)
                    setShowAddModal(false)
                    // Reset search/filters entre thèmes
                    setSearch('')
                    setCategory('tous')
                    setDiffFilter('tous')
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all"
                  style={active
                    ? { backgroundColor: t.bg, color: t.color, borderColor: t.color + '50' }
                    : { backgroundColor: '#F8FAFB', color: '#64748B', borderColor: '#E2E8F0' }
                  }
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Vue Sport ─────────────────────────────────────────────────────────── */}
      {theme === 'sport' && (
        <>
          {/* Filtres */}
          <div className="px-6 pt-3 pb-3 space-y-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Rechercher un exercice…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#0D1F3C] placeholder:text-[#CBD5E1] focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <select
                value={diffFilter}
                onChange={e => setDiffFilter(e.target.value as Exercise['difficulty'] | 'tous')}
                className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[12px] text-[#64748B] focus:outline-none focus:border-brand transition-colors cursor-pointer"
              >
                <option value="tous">Tous niveaux</option>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(c => {
                const count = counts[c.id]
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border"
                    style={active
                      ? { backgroundColor: c.bg, color: c.color, borderColor: c.color + '40' }
                      : { backgroundColor: '#F8FAFB', color: '#64748B', borderColor: '#E2E8F0' }
                    }
                  >
                    {c.label}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={active
                        ? { backgroundColor: c.color + '20', color: c.color }
                        : { backgroundColor: '#E2E8F0', color: '#94A3B8' }
                      }>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bannière limite bibliothèque */}
          {exerciseLimit && exerciseLimit !== -1 && (
            <div className="mx-6 mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 shrink-0">
              <p className="text-[12px] text-amber-700">
                Bibliothèque limitée à <strong>{exerciseLimit} exercices</strong> sur votre plan actuel.
              </p>
              <a href="/plans" className="text-[11px] font-semibold text-amber-700 underline whitespace-nowrap">Passer à un plan supérieur</a>
            </div>
          )}

          {/* Liste */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center mb-4">
                  <Dumbbell size={20} className="text-brand" />
                </div>
                <p className="text-[14px] font-semibold text-[#0D1F3C] mb-1">Aucun exercice</p>
                <p className="text-[13px] text-[#94A3B8] text-center max-w-xs">
                  {search ? `Aucun résultat pour "${search}".` : 'Aucun exercice dans cette catégorie.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {filtered.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    isOwn={ex.coach_id === coachId}
                    onDelete={() => deletingId !== ex.id && handleDelete(ex.id)}
                    onAddToProgramme={openAddToProgramme}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Modal — Ajouter à un programme */}
          {addTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAddTarget(null)} />
              <div className="relative bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-[#0D1F3C]">Ajouter à un programme</h3>
                  <button onClick={() => setAddTarget(null)} className="text-[#94A3B8] hover:text-[#64748B]"><X size={16} /></button>
                </div>
                <div className="flex items-center gap-2.5 bg-[#F8FAFB] rounded-xl px-3 py-2.5 mb-4 border border-[#E2E8F0]">
                  <span className="w-7 h-7 rounded-lg bg-[#EEF9F3] flex items-center justify-center shrink-0">
                    <Dumbbell size={13} className="text-[#4E9B6F]" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#0D1F3C]">{addTarget.name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{addTarget.muscle_group}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Programme</label>
                    {programmes.length === 0 ? (
                      <p className="text-[12px] text-[#94A3B8]">Aucun programme créé.</p>
                    ) : (
                      <select value={selectedProg} onChange={e => setSelectedProg(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#4E9B6F]">
                        {programmes.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    )}
                  </div>
                  {selectedProg && (
                    <div>
                      <label className="block text-[12px] font-medium text-[#64748B] mb-1.5">Jour</label>
                      {loadingDays ? (
                        <p className="text-[12px] text-[#94A3B8]">Chargement…</p>
                      ) : days.length === 0 ? (
                        <p className="text-[12px] text-[#94A3B8]">Aucun jour dans ce programme.</p>
                      ) : (
                        <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#4E9B6F]">
                          {days.map(d => (
                            <option key={d.id} value={d.id}>
                              Jour {d.day_number}{d.title ? ` — ${d.title}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setAddTarget(null)}
                    className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8FAFB] transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleAddToProgramme} disabled={addingEx || !selectedDay || !selectedProg}
                    className="flex-1 py-2.5 bg-[#4E9B6F] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3d8058] transition-colors disabled:opacity-50">
                    {addingEx ? '…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal — Créer un exercice */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
              <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-xl overflow-y-auto max-h-[92vh]">
                <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white z-10">
                  <h3 className="font-semibold text-[#0D1F3C] text-[15px]">Nouvel exercice</h3>
                  <button onClick={() => setShowModal(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Nom de l&apos;exercice</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Ex. Développé couché haltères" required autoFocus
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">
                      Équipement
                      {equipment.length > 1 && (
                        <span className="ml-1.5 text-[11px] font-normal text-[#4E9B6F]">({equipment.length} sélectionnés)</span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EQUIPMENTS.map(eq => {
                        const active = equipment.includes(eq)
                        return (
                          <button key={eq} type="button" onClick={() => toggleEquipment(eq)}
                            className={`px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-colors ${
                              active
                                ? 'border-transparent text-white'
                                : 'border-[#E2E8F0] text-[#64748B] bg-white hover:border-[#CBD5E1]'
                            }`}
                            style={active ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : {}}>
                            {eq.charAt(0).toUpperCase() + eq.slice(1)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <button type="button" onClick={handleGenerate} disabled={generating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-brand/30 text-brand text-[13px] font-medium hover:bg-brand-bg hover:border-brand/60 transition-colors disabled:opacity-50"
                    style={{ color: 'var(--brand)' }}>
                    <Sparkles size={14} />
                    {generating ? 'Génération en cours…' : 'Remplir par l\'IA'}
                  </button>
                  <p className="text-center text-[11px] text-[#94A3B8]">
                    {aiExercisesLimit === -1
                      ? `${aiUsedCount} génération${aiUsedCount !== 1 ? 's' : ''} ce mois — illimité`
                      : `${aiUsedCount} / ${aiExercisesLimit} génération${aiExercisesLimit !== 1 ? 's' : ''} ce mois · renouvellement le 1er`
                    }
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Catégorie</label>
                      <select value={cat} onChange={e => setCat(e.target.value as Exercise['category'])}
                        className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors cursor-pointer">
                        <option value="force">Force</option>
                        <option value="cardio">Cardio</option>
                        <option value="hiit">HIIT</option>
                        <option value="mobilite">Mobilité</option>
                        <option value="stretching">Etirement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Niveau</label>
                      <select value={difficulty} onChange={e => setDifficulty(e.target.value as Exercise['difficulty'])}
                        className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors cursor-pointer">
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">Muscle principal</label>
                    <select value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)} required
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors cursor-pointer">
                      <option value="">Sélectionner…</option>
                      {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">
                      Muscles secondaires <span className="text-[#94A3B8] font-normal">(séparés par une virgule)</span>
                    </label>
                    <input type="text" value={muscles} onChange={e => setMuscles(e.target.value)}
                      placeholder="Ex. Triceps, Épaules"
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D1F3C] mb-1.5">
                      Instructions <span className="text-[#94A3B8] font-normal">(une étape par ligne)</span>
                    </label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                      rows={5} required
                      placeholder={"Allongez-vous sur un banc plat, pieds au sol.\nSaisissez la barre en prise large.\nDescendez lentement jusqu'à la poitrine.\nPoussez en expirant jusqu'à l'extension complète."}
                      className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-brand transition-colors resize-none" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-lg btn-brand text-[13px] font-medium transition-colors disabled:opacity-50">
                      {saving ? 'Enregistrement…' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Vue Nutrition ─────────────────────────────────────────────────────── */}
      {theme === 'nutrition' && (
        <NutritionView
          items={nutritionItems}
          coachId={coachId}
          showAddModal={showAddModal}
          onCloseAddModal={() => setShowAddModal(false)}
        />
      )}

      {/* ── Vue Habitudes ─────────────────────────────────────────────────────── */}
      {theme === 'habitudes' && (
        <HabitudesView
          templates={habitTemplates}
          coachId={coachId}
          showAddModal={showAddModal}
          onCloseAddModal={() => setShowAddModal(false)}
        />
      )}

    </div>
  )
}
