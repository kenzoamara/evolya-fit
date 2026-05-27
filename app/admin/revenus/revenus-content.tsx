'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type Props = {
  mrr: number
  arr: number
  newThisMonth: number
  cancelledThisMonth: number
  churnRate: number
  arpu: number
  planDist: Record<string, number>
  mrrMonthly: { month: string; mrr: number }[]
  coaches: { id: string; plan: string; plan_status: string; suspended: boolean; created_at: string; mrr: number }[]
}

const PLAN_COLORS: Record<string, string> = { trial: '#E2E8F0', free: '#E2E8F0', starter: '#93C5FD', growth: '#60A5FA', pro: '#4E9B6F', scale: '#7C3AED', elite: '#A78BFA', unlimited: '#DC2626', standard: '#60A5FA' }
const PLAN_LABELS: Record<string, string> = { trial: 'Trial', starter: 'Starter', standard: 'Pro' }

export function RevenusContent({ mrr, arr, newThisMonth, cancelledThisMonth, churnRate, arpu, planDist, mrrMonthly, coaches }: Props) {
  const kpis = [
    { label: 'MRR actuel', value: `${mrr}€`, sub: 'mensuel récurrent' },
    { label: 'ARR projeté', value: `${arr}€`, sub: 'annuel estimé' },
    { label: 'Nouveaux ce mois', value: newThisMonth, sub: 'abonnements payants' },
    { label: 'Annulations', value: cancelledThisMonth, sub: 'ce mois' },
    { label: 'Churn rate', value: `${churnRate}%`, sub: 'ce mois', alert: churnRate > 10 },
    { label: 'ARPU', value: `${arpu}€`, sub: 'revenu moyen/coach' },
  ]

  const donutData = [
    { name: 'Trial', value: planDist.trial, color: PLAN_COLORS.trial },
    { name: 'Starter', value: planDist.starter, color: PLAN_COLORS.starter },
    { name: 'Pro', value: planDist.standard, color: PLAN_COLORS.standard },
  ].filter(d => d.value > 0)

  function exportCSV() {
    const headers = ['Date', 'Plan', 'MRR', 'Statut']
    const rows = coaches.map(c => [c.created_at.split('T')[0], PLAN_LABELS[c.plan] ?? c.plan, c.mrr, c.plan_status])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'revenus.csv'; a.click()
  }

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Revenus & MRR</h1>
          <p className="text-sm text-[#64748B]">Basé sur les plans actifs — refresh 60s</p>
        </div>
        <button onClick={exportCSV} className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:bg-[#F1F5F9]">
          ↓ Export CSV
        </button>
      </div>

      {/* Alertes */}
      {churnRate > 10 && (
        <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          🟡 Churn rate &gt; 10% ce mois — {cancelledThisMonth} annulation(s)
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className={`bg-white border rounded-xl p-4 ${kpi.alert ? 'border-yellow-200' : 'border-[#E2E8F0]'}`}>
            <p className="text-xs text-[#64748B] mb-1">{kpi.label}</p>
            <p className={`text-2xl font-semibold ${kpi.alert ? 'text-yellow-600' : 'text-[#0D1F3C]'}`}>{kpi.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* MRR 12 mois */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#0D1F3C] mb-4">MRR — 12 mois glissants</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mrrMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v ?? 0}€`, 'MRR']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Line type="monotone" dataKey="mrr" stroke="#4E9B6F" strokeWidth={2.5} dot={{ r: 3, fill: '#4E9B6F' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut plans */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#0D1F3C] mb-4">Répartition des plans</h2>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v ?? 0, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[#64748B]">{d.name}</span>
                    </div>
                    <span className="font-medium text-[#0D1F3C]">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#94A3B8] text-center py-8">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Table transactions */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-[#0D1F3C]">Historique abonnements</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFB]">
              {['Date', 'Coach ID', 'Plan', 'MRR/mois', 'Statut'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coaches.filter(c => c.plan !== 'trial').slice(0, 50).map((c, i) => (
              <tr key={i} className="border-b border-[#F1F5F9]">
                <td className="px-4 py-2.5 text-[#64748B]">{c.created_at.split('T')[0]}</td>
                <td className="px-4 py-2.5 text-[#94A3B8] font-mono text-xs">{c.id.slice(0, 8)}…</td>
                <td className="px-4 py-2.5"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">{PLAN_LABELS[c.plan] ?? c.plan}</span></td>
                <td className="px-4 py-2.5 font-medium text-[#4E9B6F]">{c.mrr}€</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.plan_status === 'active' ? 'bg-green-50 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {c.plan_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
