'use client'

import { useState } from 'react'
import { AnimatedBackground } from '../AnimatedBackground'

type Task = { id: number; text: string; done: boolean }

const INITIAL_TASKS: Task[] = [
  { id: 1, text: 'Assigner un programme sportif à Membre C', done: true },
  { id: 2, text: 'Assigner un programme nutritionnel à Membre D', done: false },
  { id: 3, text: "Envoyer une suggestion au staff d'Evolya", done: false },
]

const NAV_MAIN = [
  { label: 'Accueil',     key: 'accueil',    emoji: '🏠' },
  { label: 'Mes membres', key: 'clients',    emoji: '👥' },
  { label: 'Programmes',  key: 'programmes', emoji: '📋' },
  { label: 'Exercices',   key: 'exercices',  emoji: '🏋️' },
  { label: 'Séance',      key: 'seance',     emoji: '⚡' },
  { label: 'Messagerie',  key: 'messagerie', emoji: '✉️' },
]

const NAV_PILOTAGE = [
  { label: 'Business',     key: 'business',     emoji: '📈' },
  { label: 'Statistiques', key: 'statistiques', emoji: '📊' },
  { label: 'Calcul',       key: 'calcul',       emoji: '🧮' },
]

const NAV_REGLAGES = [
  { label: 'Personnalisation', key: 'perso',   emoji: '🎨' },
  { label: 'Nouveautés',       key: 'nouveau', emoji: '✨' },
  { label: 'Paramètres',       key: 'params',  emoji: '⚙️' },
]

const ACTIONS = [
  { bg: 'rgba(59,127,212,0.15)',  icon: '📋', label: 'Programme créé : Programme Musculation', time: '18 mai' },
  { bg: 'rgba(245,158,11,0.15)',  icon: '⚡', label: '8 séances planifiées avec Membre A',    time: 'du 18 mai au 11 août' },
  { bg: 'rgba(255,255,255,0.05)', icon: '👤', label: 'Profil consulté : Membre A',            time: 'Il y a 13h' },
  { bg: 'rgba(255,255,255,0.05)', icon: '👤', label: 'Profil consulté : Membre B',            time: 'Il y a 17h' },
]

function NavItem({ label, emoji, active }: { label: string; emoji: string; active: boolean }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg select-none"
      style={{ backgroundColor: active ? 'rgba(78,155,111,0.12)' : 'transparent' }}
    >
      <span className="text-[13px] flex-shrink-0 leading-none">{emoji}</span>
      <span
        className="text-[12px] font-medium leading-none"
        style={{ color: active ? '#6AB384' : 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </span>
    </div>
  )
}

export function DashboardPreview() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [glowing, setGlowing] = useState(false)

  const doneCount = tasks.filter(t => t.done).length

  function toggle(id: number) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  return (
    <section className="bg-gradient-to-b from-[#091528] to-[#060D1B] py-24 px-6 overflow-hidden relative">
      {/* Scrollbar styling for the internal demo panels */}
      <style>{`
        .demo-scroll::-webkit-scrollbar { width: 4px; }
        .demo-scroll::-webkit-scrollbar-track { background: transparent; }
        .demo-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .demo-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      <AnimatedBackground mode="aurora" theme="dark" intensity={0.5} speed={0.6} accent={0.5} />

      <div className="max-w-5xl mx-auto relative z-[1]">

        {/* ── Copy ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 text-[#6AB384] text-[11px] font-semibold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Vu de l&apos;intérieur
          </div>
          <h2 className="text-[32px] md:text-[44px] font-bold text-white tracking-[-0.02em] mb-5">
            Tout ce qu'il te faut pour suivre, coacher<br className="hidden md:block" /> et faire grandir ton activité — depuis un seul endroit.
          </h2>
          <p className="text-[15px] text-white/50 max-w-xl mx-auto leading-relaxed">
            Un espace de travail complet pour suivre chaque membre, créer des programmes
            et ne rien laisser passer.
          </p>
        </div>

        {/* ── Demo wrapper — scrollable horizontalement sur mobile ── */}
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div
            onMouseEnter={() => setGlowing(true)}
            onMouseLeave={() => setGlowing(false)}
            className="rounded-2xl overflow-hidden border border-white/10 transition-all duration-500"
            style={{
              minWidth: 340,
              boxShadow: glowing
                ? '0 0 0 1px rgba(78,155,111,0.35), 0 0 40px rgba(78,155,111,0.18), 0 0 90px rgba(78,155,111,0.08), 0 32px 80px rgba(0,0,0,0.55)'
                : '0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.55)',
            }}
          >
            {/* ── Window chrome ── */}
            <div className="bg-[#0D1829] border-b border-white/[0.08] px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28C840' }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="max-w-[200px] w-full bg-white/[0.05] rounded-md px-3 py-1 border border-white/[0.07]">
                  <span className="text-[11px] text-white/25 font-mono">evolya.vercel.app/accueil</span>
                </div>
              </div>
            </div>

            {/* ── App body — hauteur fixe, scroll interne ── */}
            <div className="flex bg-[#0A1220]" style={{ height: 460 }}>

              {/* Sidebar — scrollable */}
              <div
                className="demo-scroll hidden sm:flex w-[168px] bg-[#070F1B] border-r border-white/[0.06] flex-col py-4 flex-shrink-0 overflow-y-auto"
              >
                {/* Logo */}
                <div className="px-4 mb-5 flex-shrink-0">
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', lineHeight: 1 }}>
                    <span style={{ fontFamily: 'var(--font-anton), Anton, Impact, sans-serif', fontWeight: 400, fontStyle: 'italic', fontSize: 15, color: '#FFFFFF', lineHeight: 1 }}>Evolya</span>
                    <span style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontWeight: 400, fontStyle: 'italic', fontSize: 13, color: '#4E9B6F', lineHeight: 1 }}>&apos;FIT</span>
                  </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 space-y-0.5">
                  {NAV_MAIN.map(item => (
                    <NavItem key={item.key} label={item.label} emoji={item.emoji} active={item.key === 'accueil'} />
                  ))}

                  <div className="pt-3 pb-1 px-3">
                    <span className="text-[9px] font-bold tracking-widest text-white/20 uppercase">Pilotage</span>
                  </div>
                  {NAV_PILOTAGE.map(item => (
                    <NavItem key={item.key} label={item.label} emoji={item.emoji} active={false} />
                  ))}

                  <div className="pt-3 pb-1 px-3">
                    <span className="text-[9px] font-bold tracking-widest text-white/20 uppercase">Réglages</span>
                  </div>
                  {NAV_REGLAGES.map(item => (
                    <NavItem key={item.key} label={item.label} emoji={item.emoji} active={false} />
                  ))}
                </nav>

                {/* Trial badge */}
                <div
                  className="mx-2 mt-3 mb-2 rounded-xl px-3 py-2 flex-shrink-0"
                  style={{ backgroundColor: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.2)' }}
                >
                  <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wide">Essai gratuit</p>
                  <p className="text-[12px] font-semibold text-orange-300">14 jours restants</p>
                </div>

                {/* Coach info */}
                <div className="px-3 pt-2 pb-1 border-t border-white/[0.06] flex items-center gap-2.5 flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#4E9B6F]/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#6AB384]">CP</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white/90 truncate">Coach Pro</p>
                    <p className="text-[9px] text-white/30 truncate">Coach Sportif</p>
                  </div>
                </div>
              </div>

              {/* ── Main content — scrollable ── */}
              <div
                className="demo-scroll flex-1 p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto min-w-0"
                style={{ minHeight: 0 }}
              >
                {/* Top bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-[15px] font-semibold text-white leading-none">Bonjour, Coach Pro</h1>
                      <span className="text-[15px]">👋</span>
                    </div>
                    <p className="text-[11px] text-white/35 mt-1">Lundi 18 mai</p>
                  </div>
                  <div
                    className="h-8 px-4 rounded-xl border flex items-center gap-1.5 flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(78,155,111,0.15)',
                      borderColor: 'rgba(78,155,111,0.25)',
                    }}
                  >
                    <span className="text-[12px] font-semibold text-[#6AB384]">+ Inviter un membre</span>
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-shrink-0">
                  {[
                    { label: 'ATHLÈTES ACTIFS',        value: '14', sub: 'sur 20 max',   accent: '#3B7FD4', iconBg: 'rgba(59,127,212,0.15)' },
                    { label: 'SÉANCES CETTE SEMAINE',  value: '9',  sub: 'lun. → dim.', accent: '#D4A853', iconBg: 'rgba(212,168,83,0.15)'  },
                    { label: 'CHECK-INS SEMAINE',      value: '11', sub: 'reset lundi', accent: '#4E9B6F', iconBg: 'rgba(78,155,111,0.15)'  },
                  ].map((kpi, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-2.5 sm:p-3 border"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ backgroundColor: kpi.iconBg }} />
                        <p className="text-[7px] sm:text-[8px] font-bold tracking-wider uppercase text-white/35 leading-tight">{kpi.label}</p>
                      </div>
                      <p className="text-[18px] sm:text-[20px] font-bold leading-none mb-1" style={{ color: kpi.accent }}>{kpi.value}</p>
                      <p className="text-[9px] text-white/25">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Middle row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0">

                  {/* Agenda */}
                  <div
                    className="rounded-xl border p-3.5 flex flex-col"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[12px] font-semibold text-white leading-none">Agenda à venir</p>
                        <p className="text-[10px] text-white/30 mt-0.5">— 7 prochains jours</p>
                      </div>
                      <span className="text-[10px] font-medium text-[#6AB384]">Planning →</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 py-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                        <span className="text-base">📅</span>
                      </div>
                      <p className="text-[11px] text-white/30">Aucune séance prévue</p>
                      <span className="text-[11px] text-[#6AB384]">Planifier →</span>
                    </div>
                  </div>

                  {/* Dernières actions */}
                  <div
                    className="rounded-xl border p-3.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">⚡</span>
                        <p className="text-[12px] font-semibold text-white leading-none">Dernières actions</p>
                      </div>
                      <span className="text-[10px] font-medium text-[#6AB384]">Tout voir →</span>
                    </div>
                    <div className="space-y-2.5">
                      {ACTIONS.map((a, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs" style={{ backgroundColor: a.bg }}>
                            {a.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-white/70 leading-snug truncate">{a.label}</p>
                            <p className="text-[9px] text-white/25 mt-0.5">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* À faire — interactive */}
                <div
                  className="rounded-xl border p-3.5 flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">✅</span>
                      <p className="text-[12px] font-semibold text-white">À faire</p>
                      <span className="text-[10px] text-white/30">— {doneCount}/{tasks.length}</span>
                    </div>
                    <span className="text-[10px] font-medium text-[#6AB384]">+ Ajouter</span>
                  </div>

                  <div className="space-y-2">
                    {tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => toggle(task.id)}
                        className="w-full flex items-center gap-3 text-left cursor-pointer"
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
                          style={{
                            borderColor:     task.done ? '#4E9B6F' : 'rgba(255,255,255,0.2)',
                            backgroundColor: task.done ? '#4E9B6F' : 'transparent',
                          }}
                        >
                          {task.done && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-[12px] transition-all duration-200"
                          style={{
                            color:           task.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
                            textDecoration:  task.done ? 'line-through' : 'none',
                          }}
                        >
                          {task.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacer bottom */}
                <div className="h-2 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-4 tracking-wide">
          Interface réelle du produit — données anonymisées
        </p>

      </div>
    </section>
  )
}
