'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useInView, useAnimation, useSpring, type Variants } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartBar = {
  name: string
  value: number        // hauteur en % (0-100)
  highlighted?: boolean
}

export type AnimatedBarCardProps = {
  title: string
  currentValue: number
  formatValue?: (v: number) => string
  description: React.ReactNode
  chartData: ChartBar[]       // value = % de hauteur (0-100)
  chartHeight?: number        // hauteur max du conteneur en px (défaut 80)
  highlightedBarColor?: string
  onActionClick?: () => void
}

// ── Animated number ───────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  format,
}: {
  value: number
  format: (v: number) => string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const spring = useSpring(0, { damping: 30, stiffness: 100, mass: 1 })

  useEffect(() => {
    if (isInView) spring.set(value)
  }, [spring, isInView, value])

  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      if (ref.current) ref.current.textContent = format(latest)
    })
    return () => unsub()
  }, [format, spring])

  return <span ref={ref}>{format(0)}</span>
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnimatedBarCard({
  title,
  currentValue,
  formatValue,
  description,
  chartData,
  chartHeight = 80,
  highlightedBarColor = '#4E9B6F',
  onActionClick,
}: AnimatedBarCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, amount: 0.3 })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) controls.start('visible')
  }, [isInView, controls])

  const fmt = formatValue ?? ((v: number) => Math.round(v).toLocaleString('fr-FR'))

  const barVariants: Variants = {
    hidden: { height: '0%' },
    visible: {
      height: 'var(--bar-height, 0%)',
      transition: { type: 'spring' as const, damping: 18, stiffness: 90 },
    },
  }

  const HeaderEl = onActionClick ? 'button' : 'div'

  return (
    <motion.div
      ref={cardRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0f1f2e 0%, #0D1F3C 55%, #0a1a10 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.28)',
      }}
      whileHover={{ scale: 1.015, y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {/* Header */}
      <HeaderEl
        onClick={onActionClick}
        className="flex items-center justify-between px-5 pt-5 pb-0 w-full text-left"
      >
        <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{title}</p>
        <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />
      </HeaderEl>

      {/* Value + description */}
      <div className="px-5 pt-3 pb-0">
        <div className="text-[34px] font-bold text-white leading-none tabular-nums">
          <AnimatedNumber value={currentValue} format={fmt} />
        </div>
        <div className="text-[12px] mt-1.5 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {description}
        </div>
      </div>

      {/* Bar chart — hauteur dynamique selon chartHeight */}
      <motion.div
        className="flex items-end gap-2 px-5 pt-4 pb-5"
        style={{ height: `${chartHeight + 20}px`, transition: 'height 0.6s ease' }}
        initial="hidden"
        animate={controls}
        transition={{ staggerChildren: 0.06 }}
      >
        {chartData.map((item) => (
          <div key={item.name} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <motion.div
              className="w-full rounded-t-lg"
              variants={barVariants}
              style={{
                '--bar-height': item.value > 0 ? `${item.value}%` : '3px',
                background: item.highlighted
                  ? highlightedBarColor
                  : item.value > 0
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.06)',
                minHeight: 3,
              } as React.CSSProperties}
            />
            <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {item.name}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
