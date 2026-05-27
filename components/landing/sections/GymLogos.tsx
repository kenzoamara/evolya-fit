'use client'

import { useState } from 'react'
import Image from 'next/image'

/* ── Data — logos images locaux ── */

type Gym = {
  name: string
  src: string
  width: number
  height: number
}

const GYMS: Gym[] = [
  { name: "L'Orange Bleue", src: '/gyms/orange-bleue.svg', width: 200, height: 50 },
  { name: 'Basic-Fit',      src: '/gyms/basic-fit.svg',    width: 180, height: 50 },
  { name: 'Fitness Park',   src: '/gyms/fitness-park.svg',  width: 200, height: 50 },
  { name: 'Keep Cool',      src: '/gyms/keep-cool.svg',     width: 180, height: 50 },
  { name: 'ON AIR',         src: '/gyms/on-air.svg',        width: 160, height: 50 },
  { name: 'Neoness',        src: '/gyms/neoness.svg',       width: 180, height: 50 },
  { name: 'GigaFit',        src: '/gyms/gigafit.svg',       width: 180, height: 60 },
  { name: 'ONE FITNESS CLUB', src: '/gyms/one-fitness.svg', width: 220, height: 60 },
]

// Double pour boucle infinie
const ITEMS = [...GYMS, ...GYMS]

/* ── Section principale ── */

export function GymLogos() {
  const [paused, setPaused] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section className="bg-white pt-6 pb-14 overflow-hidden">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 29s linear infinite;
          will-change: transform;
        }
        @media (max-width: 767px) {
          .marquee-track { animation-duration: 23s; }
        }
        .marquee-track.paused {
          animation-play-state: paused;
        }
      `}</style>

      <p className="text-center text-[10px] text-[#C4C9D4] font-medium tracking-[0.22em] uppercase mb-6 px-6">
        Evolya · liberté totale — ta salle, tes règles, un seul outil
      </p>

      <div
        className="relative max-w-5xl mx-auto"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); setHoveredIdx(null) }}
      >
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className={`marquee-track flex items-center ${paused ? 'paused' : ''}`}>
          {ITEMS.map((gym, i) => {
            const isHovered = hoveredIdx === i
            const dimmed = hoveredIdx !== null && !isHovered

            return (
              <div key={i} className="flex items-center flex-shrink-0">
                <div
                  className="px-6 cursor-default"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <Image
                    src={gym.src}
                    alt={gym.name}
                    width={gym.width}
                    height={gym.height}
                    style={{
                      height: 32,
                      width: 'auto',
                      opacity: dimmed ? 0.2 : isHovered ? 1 : 0.65,
                      transition: 'opacity 0.3s ease',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />
                </div>
                <span className="w-px h-5 bg-[#E5E7EB] flex-shrink-0" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
