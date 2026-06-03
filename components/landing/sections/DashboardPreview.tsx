'use client'

import { useState } from 'react'
import { AnimatedBackground } from '../AnimatedBackground'
import { InteractiveProgrammeDemo } from './InteractiveProgrammeDemo'

export function DashboardPreview() {
  const [glowing, setGlowing] = useState(false)

  return (
    <>
    <section className="bg-gradient-to-b from-[#091528] to-[#060D1B] py-24 px-6 overflow-hidden relative">
      {/* Scrollbar styling for the internal demo panels */}
      <style>{`
        .demo-scroll::-webkit-scrollbar { width: 4px; }
        .demo-scroll::-webkit-scrollbar-track { background: transparent; }
        .demo-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .demo-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      <AnimatedBackground mode="aurora" theme="dark" intensity={0.5} speed={0.6} accent={0.5} />

      {/* Header — max-w centré */}
      <div className="max-w-5xl mx-auto relative z-[1] mb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 text-[#6AB384] text-[11px] font-semibold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Vu de l&apos;intérieur
          </div>
          <h2 className="text-[32px] md:text-[44px] font-bold text-white tracking-[-0.02em] mb-5">
            Finis les programmes faits à la main<br className="hidden md:block" /> exercice par exercice.
          </h2>
          <p className="text-[15px] text-white/50 max-w-xl mx-auto leading-relaxed">
            L&apos;IA génère un programme structuré, personnalisé, prêt à assigner en moins de 20 secondes.
          </p>
        </div>
      </div>

      {/* ── Demo wrapper — pleine largeur ── */}
      <div className="max-w-6xl mx-auto relative z-[1]">
        <div
          onMouseEnter={() => setGlowing(true)}
          onMouseLeave={() => setGlowing(false)}
          className="rounded-2xl overflow-hidden border border-white/10 transition-all duration-700"
          style={{
            boxShadow: glowing
              ? '0 0 0 1px rgba(78,155,111,0.4), 0 0 60px rgba(78,155,111,0.20), 0 0 120px rgba(78,155,111,0.10), 0 40px 100px rgba(0,0,0,0.65)'
              : '0 0 0 1px rgba(255,255,255,0.06), 0 40px 100px rgba(0,0,0,0.65)',
          }}
        >
          {/* ── Window chrome ── */}
          <div className="bg-[#0D1829] border-b border-white/[0.08] px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28C840' }} />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="max-w-[260px] w-full bg-white/[0.05] rounded-md px-4 py-1.5 border border-white/[0.07]">
                <span className="text-[11px] text-white/25 font-mono">evolyafit.fr/programmes</span>
              </div>
            </div>
          </div>

          {/* ── App body — Demo interactive ── */}
          <div className="relative bg-[#F8FAFB] p-6" style={{ minHeight: 620 }}>
            <InteractiveProgrammeDemo />

            {/* Info message */}
            <div className="mt-6 text-center">
              <p className="text-[13px] text-gray-600">
                Vous pouvez ajouter, supprimer et réorganiser les exercices dans cette démo interactive.
              </p>
            </div>
          </div>{/* fin app body */}
        </div>{/* fin mockup rounded-2xl */}

        <p className="text-center text-[11px] text-white/20 mt-5 tracking-wide">
          Interface réelle du produit — données anonymisées
        </p>
      </div>{/* fin max-w-6xl */}
    </section>

    </>
  )
}
