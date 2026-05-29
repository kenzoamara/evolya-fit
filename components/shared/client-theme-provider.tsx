const FONT_MAP: Record<string, string> = {
  'Inter':      'var(--font-inter), system-ui, sans-serif',
  'Poppins':    'var(--font-poppins), sans-serif',
  'Montserrat': 'var(--font-montserrat), sans-serif',
  'Raleway':    'var(--font-raleway), sans-serif',
}

type Props = {
  children: React.ReactNode
  brand: string
  font: string
}

export function ClientThemeProvider({ children, brand, font }: Props) {
  const fontFamily = FONT_MAP[font] ?? FONT_MAP['Inter']
  return (
    <div style={{ fontFamily, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{
        __html: `:root {
          --brand: ${brand};
          --brand-bg: color-mix(in srgb, ${brand} 12%, white);
          --brand-dark: color-mix(in srgb, ${brand} 80%, black);
          --brand-subtle: color-mix(in srgb, ${brand} 8%, white);
          --brand-border: color-mix(in srgb, ${brand} 22%, white);
        }`,
      }} />
      {children}
    </div>
  )
}
