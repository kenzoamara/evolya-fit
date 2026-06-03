'use client'

import { useEffect, useRef } from 'react'

type ThemeMode = 'light' | 'dark' | 'auto' | null

type Props = {
  children: React.ReactNode
  themeMode: ThemeMode
  brand: string
  font: string
}

const FONT_MAP: Record<string, string> = {
  'Inter':      'var(--font-inter), system-ui, sans-serif',
  'Poppins':    'var(--font-poppins), sans-serif',
  'Montserrat': 'var(--font-montserrat), sans-serif',
  'Raleway':    'var(--font-raleway), sans-serif',
}

export function CoachThemeProvider({ children, themeMode, brand, font }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = (dark: boolean) => {
      if (dark) {
        el.classList.add('dark')
      } else {
        el.classList.remove('dark')
      }
    }

    if (themeMode === 'dark') { apply(true); return }
    if (themeMode === 'light' || !themeMode) { apply(false); return }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)
    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  const fontFamily = FONT_MAP[font] ?? FONT_MAP['Inter']

  return (
    <div
      ref={ref}
      className={`flex h-dvh overflow-hidden${themeMode === 'dark' ? ' dark' : ''}`}
      style={{
        ['--brand' as string]: brand,
        ['--brand-bg' as string]: `color-mix(in srgb, ${brand} 12%, white)`,
        ['--brand-dark' as string]: `color-mix(in srgb, ${brand} 80%, black)`,
        backgroundColor: 'var(--evolya-bg)',
        fontFamily,
      }}
    >
      {children}
    </div>
  )
}
