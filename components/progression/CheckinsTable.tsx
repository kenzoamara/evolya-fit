import type { Checkin } from '@/types/database'
import { formatDateShort } from '@/lib/utils'

type Props = {
  checkins: Checkin[]
  isClient?: boolean
}

export function CheckinsTable({ checkins, isClient = false }: Props) {
  const last5 = checkins.slice(0, 5)

  if (last5.length === 0) return null

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F0]">
        <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
          Derniers check-ins
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFB]">
              <th className="text-left text-xs font-medium text-[#64748B] px-4 py-2">Date</th>
              {!isClient && (
                <th className="text-left text-xs font-medium text-[#64748B] px-4 py-2">Semaine</th>
              )}
              <th className="text-left text-xs font-medium text-[#64748B] px-4 py-2 hidden sm:table-cell">
                {isClient ? 'Blocages' : 'Semaine'}
              </th>
              {!isClient && (
                <th className="text-left text-xs font-medium text-[#64748B] px-4 py-2 hidden md:table-cell">
                  Commentaire du Coach
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {last5.map(c => (
              <tr key={c.id} className="hover:bg-[#F8FAFB] transition-colors">
                <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                  {formatDateShort(c.submitted_at)}
                </td>
                {!isClient && (
                  <td className="px-4 py-3 text-xs text-[#64748B]">S{c.week_number}</td>
                )}
                <td className="px-4 py-3 text-xs text-[#0D1F3C] hidden sm:table-cell max-w-[180px]">
                  <span className="line-clamp-1">
                    {isClient
                      ? (c.q3_answer ? c.q3_answer.slice(0, 60) + (c.q3_answer.length > 60 ? '…' : '') : '—')
                      : (c.q1_answer ? c.q1_answer.slice(0, 60) + (c.q1_answer.length > 60 ? '…' : '') : '—')
                    }
                  </span>
                </td>
                {!isClient && (
                  <td className="px-4 py-3 text-xs text-[#0D1F3C] hidden md:table-cell max-w-[180px]">
                    <span className="line-clamp-1">
                      {c.q3_answer ? c.q3_answer.slice(0, 60) + (c.q3_answer.length > 60 ? '…' : '') : '—'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
