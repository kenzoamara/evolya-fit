'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  clientId: string
  date: string
  token?: string
  onClose: () => void
  onSubmitted?: () => void
}

const CX = 110, CY = 110, R = 78
const START_DEG = 150, SPAN_DEG = 240, END_DEG = 30

function polarXY(deg: number, r = R) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function scoreToAngle(s: number) {
  return START_DEG + ((s - 1) / 9) * SPAN_DEG
}

function angleToScore(a: number): number {
  const norm = ((a % 360) + 360) % 360
  let rel: number
  if (norm >= START_DEG) {
    rel = norm - START_DEG
  } else if (norm <= END_DEG) {
    rel = (360 - START_DEG) + norm
  } else {
    const dStart = Math.abs(norm - START_DEG)
    const dEnd = Math.abs(norm - END_DEG)
    rel = dStart <= dEnd ? 0 : SPAN_DEG
  }
  return Math.max(1, Math.min(10, Math.round(1 + (Math.max(0, Math.min(SPAN_DEG, rel)) / SPAN_DEG) * 9)))
}

export function scoreInfo(score: number) {
  if (score <= 2) return { emoji: '❄️❄️', label: 'Trop facile', color: '#60A5FA' }
  if (score <= 4) return { emoji: '❄️', label: 'Facile', color: '#34D399' }
  if (score <= 6) return { emoji: '💪', label: 'Modéré', color: '#4E9B6F' }
  if (score <= 8) return { emoji: '🔥', label: 'Difficile', color: '#F97316' }
  return { emoji: '💥', label: 'Extrême', color: '#EF4444' }
}

function f(n: number) { return n.toFixed(1) }

function ArcSlider({ score, onChange }: { score: number; onChange: (s: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isDragging = useRef(false)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  const { color } = scoreInfo(score)
  const ts = polarXY(START_DEG), te = polarXY(END_DEG)
  const angle = scoreToAngle(score)
  const hp = polarXY(angle)
  const span = ((score - 1) / 9) * SPAN_DEG
  const largeArc = span > 180 ? 1 : 0

  const track = `M ${f(ts.x)} ${f(ts.y)} A ${R} ${R} 0 1 1 ${f(te.x)} ${f(te.y)}`
  const fill = score > 1
    ? `M ${f(ts.x)} ${f(ts.y)} A ${R} ${R} 0 ${largeArc} 1 ${f(hp.x)} ${f(hp.y)}`
    : null

  function computeAngle(clientX: number, clientY: number) {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 220 - CX
    const y = ((clientY - rect.top) / rect.height) * 165 - CY
    let a = (Math.atan2(y, x) * 180) / Math.PI
    if (a < 0) a += 360
    return a
  }

  function apply(clientX: number, clientY: number) {
    const a = computeAngle(clientX, clientY)
    if (a !== null) onChangeRef.current(angleToScore(a))
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) apply(e.clientX, e.clientY) }
    const onTouch = (e: TouchEvent) => {
      if (isDragging.current && e.touches[0]) apply(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onUp = () => { isDragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 220 165"
      className="w-full max-w-[240px] touch-none select-none"
      onMouseDown={e => { isDragging.current = true; apply(e.clientX, e.clientY) }}
      onTouchStart={e => { isDragging.current = true; if (e.touches[0]) apply(e.touches[0].clientX, e.touches[0].clientY) }}
    >
      {/* Track */}
      <path d={track} fill="none" stroke="#E2E8F0" strokeWidth="14" strokeLinecap="round" />

      {/* Fill */}
      {fill && <path d={fill} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />}

      {/* Score ticks */}
      {Array.from({ length: 10 }, (_, i) => {
        const s = i + 1
        const a = scoreToAngle(s)
        const p1 = polarXY(a, R - 10), p2 = polarXY(a, R + 10)
        return (
          <line key={s}
            x1={f(p1.x)} y1={f(p1.y)} x2={f(p2.x)} y2={f(p2.y)}
            stroke={s <= score ? color : '#D4D4CC'}
            strokeWidth={s === score ? 3 : 1.5}
            strokeLinecap="round"
          />
        )
      })}

      {/* Handle */}
      <circle cx={f(hp.x)} cy={f(hp.y)} r="12"
        fill="white" stroke={color} strokeWidth="3"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }}
        onMouseDown={e => { e.stopPropagation(); isDragging.current = true }}
        onTouchStart={e => { e.stopPropagation(); isDragging.current = true }}
        className="cursor-grab"
      />

      {/* Score center */}
      <text x={CX} y={CY - 2} textAnchor="middle" fontSize="34" fontWeight="700"
        fill="#0D1F3C" fontFamily="inherit">{score}</text>
      <text x={CX} y={CY + 20} textAnchor="middle" fontSize="12"
        fill="#64748B" fontFamily="inherit">/10</text>
    </svg>
  )
}

export function DifficultyRatingModal({ clientId, date, token, onClose, onSubmitted }: Props) {
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const { emoji, label, color } = scoreInfo(score)

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch('/api/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId, date, score,
          comment: comment.trim() || undefined,
          token,
        }),
      })
      try { localStorage.setItem(`cl_difficulty_rated_${clientId}_${date}`, '1') } catch {}
      onSubmitted?.()
    } catch {}
    setLoading(false)
    onClose()
  }

  function handleSkip() {
    try { localStorage.setItem(`cl_difficulty_rated_${clientId}_${date}`, 'skipped') } catch {}
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-5 pt-5 pb-2 text-center">
          <div className="text-2xl mb-1">{emoji}</div>
          <h3 className="text-sm font-semibold text-[#0D1F3C]">Comment s&apos;est passée la séance ?</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Tous les objectifs du jour sont complétés</p>
        </div>

        <div className="flex flex-col items-center px-4">
          <ArcSlider score={score} onChange={setScore} />
          <p className="text-sm font-semibold -mt-1 mb-3" style={{ color }}>{label}</p>
        </div>

        <div className="px-5 pb-4">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Un commentaire ? (optionnel)"
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm resize-none focus:outline-none focus:border-[#4E9B6F] transition-colors"
          />
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            Passer
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {loading ? 'Envoi...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
