'use client'

const BRAND = '#4E9B6F'

type LogoProps = {
  height?: number
  variant?: 'default' | 'light'
}

export function Logo({ height = 46, variant = 'default' }: LogoProps) {
  const isLight   = variant === 'light'
  const fontSize  = Math.round(height * 0.72)
  const fitSize   = Math.round(height * 0.62)
  const nameColor = isLight ? '#FFFFFF' : '#0D1F3C'

  return (
    <span
      style={{
        display:    'inline-flex',
        alignItems: 'baseline',
        userSelect: 'none',
        flexShrink: 0,
        lineHeight: 1,
      }}
      aria-label="Evolya FIT"
    >
      <span
        style={{
          fontFamily:  'var(--font-anton), Anton, Impact, sans-serif',
          fontWeight:  400,
          fontStyle:   'italic',
          fontSize:    fontSize,
          color:       nameColor,
          lineHeight:  1,
          letterSpacing: '0.01em',
        }}
      >
        Evolya
      </span>
      <span
        style={{
          fontFamily:  'var(--font-playfair), "Playfair Display", Georgia, serif',
          fontWeight:  400,
          fontStyle:   'italic',
          fontSize:    fitSize,
          color:       BRAND,
          lineHeight:  1,
          letterSpacing: '0.02em',
        }}
      >
        &apos;FIT
      </span>
    </span>
  )
}

export function LogoIcon({ size = 46 }: { size?: number; variant?: string }) {
  return null
}
