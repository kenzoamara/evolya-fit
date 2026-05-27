'use client'

import { useEffect, useRef } from 'react'

/* ─── Types ──────────────────────────────────────────────── */

export type BgMode =
  | 'comets'
  | 'aurora'
  | 'rain'
  | 'constellation'
  | 'particles'
  | 'ribbons'
  | 'mesh'

type Theme = 'dark' | 'light'

type Props = {
  mode: BgMode
  /** 'dark' = white/green particles on dark bg, 'light' = navy/green on light bg */
  theme?: Theme
  /** Global opacity multiplier (0-1). Default 1 */
  intensity?: number
  /** Particle density override */
  density?: number
  /** Speed multiplier (1 = normal) */
  speed?: number
  /** Green accent ratio (0-1) */
  accent?: number
  className?: string
}

/* ─── Component ──────────────────────────────────────────── */

export function AnimatedBackground({
  mode,
  theme = 'dark',
  intensity = 1,
  density: densityProp,
  speed = 1,
  accent = 0.5,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let alive = true
    let raf = 0
    let lastT = 0

    const DPR_MAX = 2
    let DPR = Math.min(window.devicePixelRatio || 1, DPR_MAX)
    let W = 0
    let H = 0

    /* ── Colors based on theme ── */
    const primary = theme === 'dark' ? '255,255,255' : '13,31,60'
    const green = '78,155,111'

    /* ── Mode config ── */
    const CFG: Record<BgMode, { density: number; opacity: number }> = {
      comets:        { density: 45,  opacity: 0.14 },
      aurora:        { density: 0,   opacity: 0.18 },
      rain:          { density: 160, opacity: 0.10 },
      constellation: { density: 50,  opacity: 0.12 },
      particles:     { density: 80,  opacity: 0.10 },
      ribbons:       { density: 40,  opacity: 0.12 },
      mesh:          { density: 0,   opacity: 0 },
    }

    const cfg = CFG[mode]
    const particleCount = densityProp ?? cfg.density
    const baseOpacity = cfg.opacity * intensity

    /* ── Particles ── */
    type Particle = {
      x: number; y: number; px: number; py: number
      life: number; age: number; green: boolean
      w: number; size: number; hist: { x: number; y: number }[]
      phase: number; speed: number
    }

    let particles: Particle[] = []
    let auroraBands: {
      y: number; speed: number; amp: number; freq: number
      phase: number; green: boolean; thickness: number
    }[] = []

    function makeParticle(initial: boolean): Particle {
      const p: Particle = {
        x: Math.random() * W,
        y: initial ? Math.random() * H : -20 - Math.random() * 60,
        px: 0, py: 0,
        life: 200 + Math.random() * 500,
        age: initial ? Math.random() * 300 : 0,
        green: Math.random() < accent,
        w: 0.4 + Math.random() * 0.8,
        size: 0.7 + Math.random() * 1.5,
        hist: [],
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.8,
      }
      p.px = p.x
      p.py = p.y
      return p
    }

    function respawn(p: Particle) {
      p.x = Math.random() * W
      p.y = -20 - Math.random() * 60
      p.px = p.x; p.py = p.y
      p.age = 0
      p.life = 200 + Math.random() * 500
      p.green = Math.random() < accent
      p.w = 0.4 + Math.random() * 0.8
      p.size = 0.7 + Math.random() * 1.5
      p.hist.length = 0
      p.phase = Math.random() * Math.PI * 2
      p.speed = 0.5 + Math.random() * 0.8
    }

    function seed() {
      particles = []
      for (let i = 0; i < particleCount; i++) particles.push(makeParticle(true))
    }

    function initAurora() {
      auroraBands = []
      for (let i = 0; i < 6; i++) {
        auroraBands.push({
          y: Math.random() * H,
          speed: 0.18 + Math.random() * 0.3,
          amp: 30 + Math.random() * 60,
          freq: 0.0018 + Math.random() * 0.003,
          phase: Math.random() * Math.PI * 2,
          green: Math.random() < accent + 0.2,
          thickness: 70 + Math.random() * 90,
        })
      }
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, DPR_MAX)
      const r = canvas.getBoundingClientRect()
      W = r.width; H = r.height
      canvas.width = Math.floor(W * DPR)
      canvas.height = Math.floor(H * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    /* ── Physics step ── */
    function step(p: Particle, t: number, dt: number) {
      let vx = 0, vy = 1
      if (mode === 'comets') {
        vx = Math.sin((p.x * 0.0025) + (p.y * 0.001) + t * 0.3) * 0.6
        vy = 1.2 + p.speed * 0.5
      } else if (mode === 'rain') {
        vx = Math.sin(p.phase + t * 0.4) * 0.18
        vy = 1.6 + p.speed * 0.7
      } else if (mode === 'constellation') {
        vx = Math.sin(p.phase + t * 0.2 + p.y * 0.002) * 0.35
        vy = 0.3 + p.speed * 0.25
      } else if (mode === 'particles') {
        vx = Math.sin(p.phase + p.y * 0.006) * 0.45
        vy = 0.55 + p.speed * 0.5
      } else if (mode === 'ribbons') {
        vx = Math.sin((p.x * 0.002) + (p.y * 0.0015) + t * 0.4 + p.phase) * 1.0
        vy = 0.7 + p.speed * 0.4
      }
      p.px = p.x; p.py = p.y
      p.x += vx * speed * dt
      p.y += vy * speed * dt
      p.age += dt
      if (p.y > H + 30 || p.x < -80 || p.x > W + 80 || p.age > p.life) respawn(p)
      if (mode === 'ribbons') {
        p.hist.push({ x: p.x, y: p.y })
        if (p.hist.length > 16) p.hist.shift()
      }
    }

    /* ── Aurora drawing ── */
    function drawAurora(t: number) {
      for (const b of auroraBands) {
        b.y += b.speed * speed * 0.6
        if (b.y - b.thickness > H) {
          b.y = -b.thickness
          b.green = Math.random() < accent + 0.2
        }
        const c = b.green ? green : primary
        const grad = ctx.createLinearGradient(0, b.y - b.thickness, 0, b.y + b.thickness)
        grad.addColorStop(0, `rgba(${c},0)`)
        grad.addColorStop(0.5, `rgba(${c},${baseOpacity * 1.4})`)
        grad.addColorStop(1, `rgba(${c},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        const steps = 50
        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * W
          const yy = b.y + Math.sin(x * b.freq + b.phase + t * 0.3) * b.amp - b.thickness
          if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy)
        }
        for (let i = steps; i >= 0; i--) {
          const x = (i / steps) * W
          const yy = b.y + Math.sin(x * b.freq + b.phase + t * 0.3) * b.amp + b.thickness
          ctx.lineTo(x, yy)
        }
        ctx.closePath()
        ctx.fill()
      }
    }

    /* ── Draw frame ── */
    function draw(t: number, dt: number) {
      // All modes: full clear each frame (no ghost traces)
      ctx.clearRect(0, 0, W, H)

      for (const p of particles) step(p, t, dt)

      if (mode === 'aurora') {
        drawAurora(t)
        return
      }

      if (mode === 'comets') {
        for (const p of particles) {
          const dx = p.x - p.px, dy = p.y - p.py
          const tx = p.x - dx * 14, ty = p.y - dy * 14
          const c = p.green ? green : primary
          const grad = ctx.createLinearGradient(tx, ty, p.x, p.y)
          grad.addColorStop(0, `rgba(${c},0)`)
          grad.addColorStop(1, `rgba(${c},${baseOpacity * 1.6})`)
          ctx.strokeStyle = grad
          ctx.lineWidth = p.w * 1.3
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(p.x, p.y)
          ctx.stroke()
          // Head glow
          ctx.fillStyle = `rgba(${c},${baseOpacity * 1.0})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.0, 0, Math.PI * 2)
          ctx.fill()
          // Core
          ctx.fillStyle = `rgba(${c},${baseOpacity * 2.5})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2)
          ctx.fill()
          // White center
          const coreColor = theme === 'dark' ? '255,255,255' : '255,255,255'
          ctx.fillStyle = `rgba(${coreColor},${baseOpacity * 2.2})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (mode === 'rain') {
        ctx.lineCap = 'round'
        for (const p of particles) {
          ctx.strokeStyle = p.green ? `rgba(${green},${baseOpacity * 1.6})` : `rgba(${primary},${baseOpacity})`
          ctx.lineWidth = p.w
          ctx.beginPath()
          ctx.moveTo(p.px, p.py)
          ctx.lineTo(p.x, p.y)
          ctx.stroke()
        }
      } else if (mode === 'constellation') {
        const MAX = 120
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j]
            const dxx = a.x - b.x, dyy = a.y - b.y
            const d2 = dxx * dxx + dyy * dyy
            if (d2 < MAX * MAX) {
              const d = Math.sqrt(d2)
              const alpha = (1 - d / MAX) * baseOpacity * 0.9
              ctx.strokeStyle = `rgba(${primary},${alpha})`
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
        for (const p of particles) {
          ctx.fillStyle = p.green ? `rgba(${green},${baseOpacity * 2.2})` : `rgba(${primary},${baseOpacity * 1.8})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (mode === 'particles') {
        for (const p of particles) {
          ctx.fillStyle = p.green ? `rgba(${green},${baseOpacity * 2})` : `rgba(${primary},${baseOpacity * 1.5})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (mode === 'ribbons') {
        ctx.lineCap = 'round'
        for (const p of particles) {
          if (p.hist.length < 3) continue
          ctx.strokeStyle = p.green ? `rgba(${green},${baseOpacity * 1.3})` : `rgba(${primary},${baseOpacity * 0.9})`
          ctx.lineWidth = p.w * 2.4
          ctx.beginPath()
          ctx.moveTo(p.hist[0].x, p.hist[0].y)
          for (let i = 1; i < p.hist.length - 1; i++) {
            const xc = (p.hist[i].x + p.hist[i + 1].x) / 2
            const yc = (p.hist[i].y + p.hist[i + 1].y) / 2
            ctx.quadraticCurveTo(p.hist[i].x, p.hist[i].y, xc, yc)
          }
          ctx.stroke()
        }
      }
    }

    /* ── Init ── */
    resize()
    if (mode === 'aurora') initAurora()
    if (mode !== 'mesh') seed()

    /* ── IntersectionObserver: only animate when visible ── */
    let visible = false

    function tick(now: number) {
      if (!alive || !visible) return
      if (!lastT) lastT = now
      const dt = Math.min(50, now - lastT) / 16.666
      lastT = now
      const t = now * 0.001
      if (mode !== 'mesh') draw(t, dt)
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && alive) {
          lastT = 0
          raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0 }
    )
    io.observe(canvas)

    if (mode !== 'mesh') raf = requestAnimationFrame(tick)

    /* ── Resize observer ── */
    const ro = new ResizeObserver(() => {
      resize()
      if (mode === 'aurora') initAurora()
      else seed()
    })
    ro.observe(canvas)

    /* ── Tab visibility ── */
    function onVis() {
      if (document.hidden) {
        alive = false
      } else {
        alive = true
        lastT = 0
        if (visible) raf = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [mode, theme, intensity, densityProp, speed, accent])

  /* ── Mesh mode uses CSS blobs instead of canvas ── */
  if (mode === 'mesh') {
    const meshIntensity = intensity
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
        <div
          ref={blobsRef}
          className="absolute inset-0 pointer-events-none"
          style={{ filter: 'blur(40px)' }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: '30vmax', height: '30vmax', left: '8vmax',
              background: `radial-gradient(circle at 50% 50%, rgba(78,155,111,${0.18 * meshIntensity}), transparent 65%)`,
              animation: 'meshDrop1 42s linear infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '35vmax', height: '35vmax', right: '-5vmax',
              background: `radial-gradient(circle at 50% 50%, rgba(56,120,200,${0.18 * meshIntensity}), transparent 65%)`,
              animation: 'meshDrop2 56s linear infinite',
              animationDelay: '-18s',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '28vmax', height: '28vmax', left: '35vmax',
              background: `radial-gradient(circle at 50% 50%, rgba(78,155,111,${0.14 * meshIntensity}), transparent 65%)`,
              animation: 'meshDrop3 64s linear infinite',
              animationDelay: '-30s',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
    />
  )
}
