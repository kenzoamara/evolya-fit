'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

/* ── Shimmer bar ── */
function Shimmer({ width = '100%', height = 11, delay = 0 }: {
  width?: string | number
  height?: number
  delay?: number
}) {
  return (
    <div
      className="relative rounded-lg overflow-hidden shrink-0"
      style={{ width, height, backgroundColor: '#EEF2F7' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 1.5, repeat: Infinity, delay, ease: 'linear' }}
      />
    </div>
  )
}

/* ── Skeleton day card ── */
function SkeletonDay({ index }: { index: number }) {
  const d = index * 0.09

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Day number badge */}
        <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: '#EEF2F7' }}>
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, repeat: Infinity, delay: d, ease: 'linear' }}
          />
        </div>
        <Shimmer width="35%" height={11} delay={d} />
        <div className="flex-1" />
        <Shimmer width={36} height={9} delay={d + 0.25} />
        <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#EEF2F7' }} />
      </div>

      {/* Body — exercise rows */}
      <div className="px-4 pb-4 border-t border-[#F1F5F9] pt-3 space-y-3">
        {([78, 62, 55] as number[]).map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer width={`${w}%`} height={11} delay={d + i * 0.12} />
            <div className="flex-1" />
            <Shimmer width={60} height={11} delay={d + i * 0.12 + 0.1} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Main export ── */
export function ProgrammeGeneratingSkeleton({ progress }: { progress?: string }) {
  return (
    <div className="space-y-3">
      {/* Status header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3 py-8"
      >
        {/* Brand-colored pulsing orb */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: 'var(--brand-bg)' }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--brand-bg)' }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={22} style={{ color: 'var(--brand)' }} />
          </motion.div>
        </div>

        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#0D1F3C]">L'IA génère votre programme…</p>
          <motion.p
            key={progress}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-[12px] mt-1"
            style={progress ? { color: 'var(--brand)', fontWeight: 500 } : { color: '#94A3B8' }}
          >
            {progress || 'Cela prend environ 10-30 secondes'}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--brand-bg)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--brand)' }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Skeleton day cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonDay key={i} index={i} />
      ))}
    </div>
  )
}
