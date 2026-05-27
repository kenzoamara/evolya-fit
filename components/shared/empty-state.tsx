type EmptyStateProps = {
  icon: 'clients' | 'sessions' | 'objectives' | 'checkins'
  title: string
  description?: string
  action?: React.ReactNode
}

const ICONS = {
  clients: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="16" r="8" stroke="#94A3B8" strokeWidth="2" fill="none" />
      <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="14" r="5" stroke="#4E9B6F" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
      <path d="M29 28c2-1.5 4.5-2.5 7-2.5" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  ),
  sessions: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="32" height="28" rx="4" stroke="#94A3B8" strokeWidth="2" fill="none" />
      <path d="M8 18h32" stroke="#94A3B8" strokeWidth="2" />
      <path d="M16 6v8M32 6v8" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 26h8M15 32h12" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
    </svg>
  ),
  objectives: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="14" stroke="#94A3B8" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="8" stroke="#94A3B8" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
      <circle cx="24" cy="24" r="3" fill="#4E9B6F" fillOpacity="0.6" />
      <path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  checkins: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 34l8-10 7 6 8-12 9 8" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="24" r="2.5" fill="#4E9B6F" fillOpacity="0.5" />
      <circle cx="23" cy="30" r="2.5" fill="#4E9B6F" fillOpacity="0.5" />
      <circle cx="31" cy="18" r="2.5" fill="#4E9B6F" fillOpacity="0.5" />
      <path d="M8 38h32" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 opacity-80">{ICONS[icon]}</div>
      <h3 className="text-sm font-semibold text-[#0D1F3C] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] mb-5 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  )
}
