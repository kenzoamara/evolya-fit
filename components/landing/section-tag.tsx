import { cn } from '@/lib/utils'

interface SectionTagProps {
  children: React.ReactNode
  /** 'light' = fond clair (sections blanches), 'dark' = fond sombre */
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Tag unifié pour toutes les sections de la landing page.
 * Dot clignotant + encadrement, pas de changement de couleur.
 */
export function SectionTag({ children, variant = 'light', className }: SectionTagProps) {
  if (variant === 'dark') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 border text-[11px] font-semibold px-3.5 py-1.5 rounded-full tracking-[0.14em] uppercase mb-5',
        'bg-white/[0.06] border-white/15 text-white/80',
        className,
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0 tag-dot-blink" />
        {children}
      </div>
    )
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-2 border text-[11px] font-semibold px-3.5 py-1.5 rounded-full tracking-[0.14em] uppercase mb-5',
      'bg-[#eef6f1] border-[rgba(78,155,111,0.22)] text-[#3f8a60]',
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#4E9B6F] shrink-0 tag-dot-blink" />
      {children}
    </div>
  )
}
