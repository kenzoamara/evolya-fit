'use client'

export type Tab = { id: string; label: string; count?: number }

type Props = {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function InnerTabs({ tabs, active, onChange, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl w-fit ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
            active === tab.id
              ? 'bg-white text-[#0D1F3C] shadow-sm'
              : 'text-[#64748B] hover:text-[#374151]'
          }`}
        >
          {tab.label}
          {(tab.count ?? 0) > 0 && (
            <span
              className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
              style={
                active === tab.id
                  ? { backgroundColor: 'var(--brand-bg)', color: 'var(--brand)' }
                  : { backgroundColor: '#E2E8F0', color: '#64748B' }
              }
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
