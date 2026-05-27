'use client'

import { useRef, useState } from 'react'

/* ── Table 1 — vs outils bricolés ─────────────────────────────── */
const ROWS_1 = [
  { label: 'Récupérer 2 à 3h par jour',                      evolya: 'yes', a: 'no',      b: 'no'  },
  { label: 'Zéro check-in oublié, zéro relance manquée',     evolya: 'yes', a: 'no',      b: 'no'  },
  { label: 'Suivre chaque membre même à +30 membres',      evolya: 'yes', a: 'partial', b: 'no'  },
  { label: 'Communiquer sans chaos WhatsApp',                 evolya: 'yes', a: 'no',      b: 'yes' },
  { label: 'Créer des programmes en quelques minutes',        evolya: 'yes', a: 'partial', b: 'no'  },
  { label: 'Image de coach professionnel',                    evolya: 'yes', a: 'no',      b: 'no'  },
  { label: 'Encaisser sans courir après',                     evolya: 'yes', a: 'partial', b: 'no'  },
  { label: 'Scaler sans changer de système',                  evolya: 'yes', a: 'no',      b: 'no'  },
]

/* ── Table 2 — vs plateformes US ─────────────────────────────── */
const ROWS_2 = [
  { label: 'Interface simple, prise en main immédiate',       evolya: 'yes', a: 'partial', b: 'no'  },
  { label: 'Données hébergées en Europe (RGPD)',              evolya: 'yes', a: 'no',      b: 'no'  },
  { label: 'Conçu pour le marché français',                   evolya: 'yes', a: 'no',      b: 'no'  },
  { label: 'Support en français',                             evolya: 'yes', a: 'no',      b: 'no'  },
  { label: 'Messagerie coach-membre intégrée',               evolya: 'yes', a: 'yes',     b: 'yes' },
  { label: 'Espace membre à ta marque',                      evolya: 'yes', a: 'partial', b: 'partial' },
  { label: 'Relances et alertes automatiques',                evolya: 'yes', a: 'no',      b: 'partial' },
  { label: 'Tarif accessible dès le lancement',               evolya: 'yes', a: 'no',      b: 'no'  },
]

type Status = 'yes' | 'partial' | 'no'

function Cell({ status }: { status: Status }) {
  if (status === 'yes') return (
    <div className="flex justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10.5l4.5 4.5 7.5-9" stroke="#4E9B6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
  if (status === 'partial') return (
    <div className="flex justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 10h10" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  )
  return (
    <div className="flex justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 6l8 8M14 6l-8 8" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

type TableProps = {
  rows: typeof ROWS_1
  colA: string
  colB: string
  hoveredRow: number | null
  setHoveredRow: (i: number | null) => void
}

function ComparisonTable({ rows, colA, colB, hoveredRow, setHoveredRow }: TableProps) {
  return (
    <div className="bg-[#0D1F3C] rounded-2xl overflow-hidden min-w-[320px]">
      {/* Header */}
      <div className="grid grid-cols-[1fr_64px_64px_64px] md:grid-cols-[1fr_120px_120px_120px] border-b border-white/8">
        <div className="px-3 md:px-6 py-3 md:py-4" />
        <div className="px-1 md:px-4 py-3 md:py-4 text-center border-l border-white/8 bg-[#4E9B6F]/10">
          <span className="text-[11px] md:text-[13px] font-bold text-[#4E9B6F]">Evolya&apos;Fit</span>
        </div>
        <div className="px-1 md:px-4 py-3 md:py-4 text-center border-l border-white/8">
          <span className="text-[9px] md:text-[11px] font-medium text-white/40 leading-tight block">{colA}</span>
        </div>
        <div className="px-1 md:px-4 py-3 md:py-4 text-center border-l border-white/8">
          <span className="text-[9px] md:text-[11px] font-medium text-white/40 leading-tight block">{colB}</span>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={i}
          onMouseEnter={() => setHoveredRow(i)}
          onMouseLeave={() => setHoveredRow(null)}
          className={`grid grid-cols-[1fr_64px_64px_64px] md:grid-cols-[1fr_120px_120px_120px] items-center border-b border-white/5 transition-colors duration-150 cursor-default ${
            hoveredRow === i ? 'bg-white/5' : ''
          }`}
        >
          <div className={`px-3 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 transition-all duration-150 ${hoveredRow === i ? 'md:translate-x-1' : ''}`}>
            <div className={`w-1 h-5 md:h-6 rounded-full flex-shrink-0 transition-all duration-150 ${hoveredRow === i ? 'bg-[#4E9B6F]' : 'bg-white/10'}`} />
            <p className="text-[11px] md:text-[13px] font-semibold text-white">{row.label}</p>
          </div>
          <div className="px-1 md:px-4 py-3 md:py-4 border-l border-white/5 bg-[#4E9B6F]/5">
            <Cell status={row.evolya as Status} />
          </div>
          <div className="px-1 md:px-4 py-3 md:py-4 border-l border-white/5">
            <Cell status={row.a as Status} />
          </div>
          <div className="px-1 md:px-4 py-3 md:py-4 border-l border-white/5">
            <Cell status={row.b as Status} />
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="grid grid-cols-[1fr_64px_64px_64px] md:grid-cols-[1fr_120px_120px_120px] items-center bg-white/3">
        <div className="px-3 md:px-6 py-3 md:py-4">
          <p className="text-[10px] md:text-[11px] font-bold text-white/30 uppercase tracking-widest">Bilan</p>
        </div>
        <div className="px-1 md:px-4 py-3 md:py-4 border-l border-white/5 bg-[#4E9B6F]/5 text-center">
          <span className="text-[10px] md:text-[12px] font-bold text-[#4E9B6F]">Complet</span>
        </div>
        <div className="px-1 md:px-4 py-3 md:py-4 border-l border-white/5 text-center">
          <span className="text-[10px] md:text-[12px] font-medium text-[#F97316]">Partiel</span>
        </div>
        <div className="px-1 md:px-4 py-3 md:py-4 border-l border-white/5 text-center">
          <span className="text-[10px] md:text-[12px] font-medium text-[#EF4444]">Limité</span>
        </div>
      </div>
    </div>
  )
}

export function CompetitorComparison() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [table, setTable] = useState<1 | 2>(1)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const scrollRef = useRef<HTMLDivElement>(null)

  function switchTable(to: 1 | 2) {
    if (animating) return
    setDirection(to === 2 ? 'right' : 'left')
    setAnimating(true)
    setTimeout(() => {
      setTable(to)
      setHoveredRow(null)
      setAnimating(false)
    }, 220)
  }

  const isTable1 = table === 1

  return (
    <section className="bg-[#F8FAFB] py-24 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold text-[#4E9B6F] tracking-[0.15em] uppercase mb-3">
            La vraie raison pour laquelle tu stagnes
          </p>
          <h2 className="text-[26px] md:text-[34px] font-bold text-[#0D1F3C] tracking-tight leading-tight max-w-2xl mx-auto">
            {isTable1
              ? <>Google Sheets/Docs et WhatsApp/Instagram ne sont pas un système.<br className="hidden md:block" /> C&apos;est un plafond.</>
              : <>TrueCoach et Trainerize sont américains.<br className="hidden md:block" /> Evolya&apos;Fit est fait pour toi.</>
            }
          </h2>
          {isTable1 && (
            <p className="text-[14px] text-[#64748B] mt-4 max-w-xl mx-auto leading-relaxed">
              À partir de 15 membres, la fragmentation prend le dessus. Chaque message non tracé, chaque tableau à mettre à jour, chaque relance oubliée t&apos;empêche de passer à +30 membres.
            </p>
          )}
        </div>

        {/* Tabs nav */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => switchTable(1)}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 border ${
              isTable1
                ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0D1F3C] hover:text-[#0D1F3C]'
            }`}
          >
            vs Sheets & WhatsApp
          </button>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#CBD5E1] flex-shrink-0">
            <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <button
            onClick={() => switchTable(2)}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 border ${
              !isTable1
                ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0D1F3C] hover:text-[#0D1F3C]'
            }`}
          >
            vs TrueCoach & Trainerize
          </button>
        </div>

        {/* Table avec animation */}
        <div
          ref={scrollRef}
          className="rounded-2xl shadow-[0_24px_64px_rgba(13,31,60,0.2)] select-none overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div
            style={{
              opacity: animating ? 0 : 1,
              transform: animating
                ? `translateX(${direction === 'right' ? '16px' : '-16px'})`
                : 'translateX(0)',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}
          >
            {isTable1 ? (
              <ComparisonTable
                rows={ROWS_1}
                colA={'Sheets' + '\n' + '& Docs'}
                colB={'Insta' + '\n' + '& WhatsApp'}
                hoveredRow={hoveredRow}
                setHoveredRow={setHoveredRow}
              />
            ) : (
              <ComparisonTable
                rows={ROWS_2}
                colA="TrueCoach"
                colB="Trainerize"
                hoveredRow={hoveredRow}
                setHoveredRow={setHoveredRow}
              />
            )}
          </div>
        </div>


      </div>
    </section>
  )
}
