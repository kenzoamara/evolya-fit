import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Crumb = { label: string; href?: string }

type Props = {
  title: string
  breadcrumb?: Crumb[]
  action?: React.ReactNode
  description?: string
}

export function PageHeader({ title, breadcrumb, action, description }: Props) {
  return (
    <div className="flex items-start justify-between px-6 py-5 bg-white border-b border-[#F1F5F9] shrink-0">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            {breadcrumb.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-[#CBD5E1]" />}
                {c.href ? (
                  <Link href={c.href} className="text-[11.5px] text-[#94A3B8] hover:text-[#64748B] transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-[11.5px] text-[#94A3B8]">{c.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[18px] font-bold text-[#0D1F3C] tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-[13px] text-[#94A3B8] mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}
