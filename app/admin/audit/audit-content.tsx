'use client'

import { useState, useMemo } from 'react'

type Log = {
  id: string
  coach_id: string | null
  coach_email: string | null
  table_name: string
  operation: string
  record_id: string | null
  record_data: Record<string, unknown> | null
  created_at: string
}

const OP_COLORS: Record<string, string> = {
  INSERT: 'bg-green-50 text-green-700',
  UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700',
}

const TABLE_LABELS: Record<string, string> = {
  clients:    '👤 Client',
  objectives: '🎯 Objectif',
  sessions:   '📅 Séance',
}

function fmt(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function AuditContent({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState('')
  const [filterOp, setFilterOp] = useState('all')
  const [filterTable, setFilterTable] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  // ── Filtres ──
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterOp !== 'all' && l.operation !== filterOp) return false
      if (filterTable !== 'all' && l.table_name !== filterTable) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(l.coach_email ?? '').toLowerCase().includes(q) &&
            !l.table_name.toLowerCase().includes(q) &&
            !(l.record_id ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [logs, filterOp, filterTable, search])

  // ── Stats aujourd'hui ──
  const todayStr = new Date().toLocaleDateString('fr-FR')
  const todayLogs = logs.filter(l => new Date(l.created_at).toLocaleDateString('fr-FR') === todayStr)
  const todayByOp = todayLogs.reduce<Record<string, number>>((acc, l) => {
    acc[l.operation] = (acc[l.operation] ?? 0) + 1
    return acc
  }, {})
  const todayByEmail = todayLogs.reduce<Record<string, number>>((acc, l) => {
    const k = l.coach_email ?? 'anonyme'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  // ── Anomalie : > 30 actions dans la dernière heure ──
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const lastHourLogs = logs.filter(l => new Date(l.created_at).getTime() > oneHourAgo)
  const anomalyByEmail = Object.entries(
    lastHourLogs.reduce<Record<string, number>>((acc, l) => {
      const k = l.coach_email ?? 'anonyme'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})
  ).filter(([, count]) => count > 30)

  // ── Export CSV ──
  function exportCSV() {
    const headers = ['date', 'coach_email', 'table', 'operation', 'record_id']
    const rows = filtered.map(l => [
      l.created_at,
      l.coach_email ?? '',
      l.table_name,
      l.operation,
      l.record_id ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_evolya_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Audit Logs</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{logs.length} actions sur 7 jours</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1F3C] hover:bg-[#333] text-white text-sm font-medium rounded-lg transition-colors"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Alerte anomalie */}
      {anomalyByEmail.length > 0 && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Activité anormale détectée</p>
            {anomalyByEmail.map(([email, count]) => (
              <p key={email} className="text-xs text-red-600 mt-0.5">
                <strong>{email}</strong> — {count} actions dans la dernière heure
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Stats aujourd'hui */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Actions aujourd'hui", value: todayLogs.length, color: '#0D1F3C' },
          { label: 'INSERT', value: todayByOp.INSERT ?? 0, color: '#16A34A' },
          { label: 'UPDATE', value: todayByOp.UPDATE ?? 0, color: '#2563EB' },
          { label: 'DELETE', value: todayByOp.DELETE ?? 0, color: '#DC2626' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
            <p className="text-xs text-[#64748B] mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Qui a fait quoi aujourd'hui */}
      {Object.keys(todayByEmail).length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-4 mb-6">
          <p className="text-xs font-semibold text-[#0D1F3C] mb-3 uppercase tracking-wider">Aujourd'hui par utilisateur</p>
          <div className="space-y-1.5">
            {Object.entries(todayByEmail).sort((a, b) => b[1] - a[1]).map(([email, count]) => (
              <div key={email} className="flex items-center gap-3">
                <span className="text-sm text-[#0D1F3C] flex-1 truncate">{email}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4E9B6F] rounded-full"
                      style={{ width: `${Math.min(100, (count / todayLogs.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#64748B] w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher email, table..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-xs px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] transition-colors"
        />
        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
          {['all', 'INSERT', 'UPDATE', 'DELETE'].map(op => (
            <button key={op} onClick={() => setFilterOp(op)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterOp === op ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
              {op === 'all' ? 'Tous' : op}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
          {['all', 'clients', 'objectives', 'sessions'].map(t => (
            <button key={t} onClick={() => setFilterTable(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterTable === t ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
              {t === 'all' ? 'Toutes tables' : TABLE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#94A3B8] self-center">{filtered.length} résultats</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-[#94A3B8]">Aucun log correspondant.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFB]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Coach</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Table</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Action</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map(log => (
                  <>
                    <tr key={log.id} className="hover:bg-[#F8FAFB] transition-colors">
                      <td className="px-4 py-2.5 text-xs text-[#64748B] whitespace-nowrap">{fmt(log.created_at)}</td>
                      <td className="px-4 py-2.5 text-xs text-[#0D1F3C] max-w-[180px] truncate">{log.coach_email ?? <span className="text-[#94A3B8]">—</span>}</td>
                      <td className="px-4 py-2.5 text-xs text-[#64748B]">{TABLE_LABELS[log.table_name] ?? log.table_name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${OP_COLORS[log.operation] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          {log.operation}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#94A3B8] font-mono">{log.record_id?.slice(0, 8) ?? '—'}…</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="text-xs text-[#4E9B6F] hover:underline"
                        >
                          {expanded === log.id ? 'Masquer' : 'Voir'}
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={log.id + '-detail'} className="bg-[#F8FAFB]">
                        <td colSpan={6} className="px-4 py-3">
                          <pre className="text-xs text-[#0D1F3C] bg-[#F1F5F9] rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                            {JSON.stringify(log.record_data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Légende groupée par jour */}
      {filtered.length > 0 && (
        <p className="text-xs text-[#94A3B8] mt-3 text-center">
          Données sur 7 jours · {filtered.length} entrées affichées · Export CSV pour compliance
        </p>
      )}
    </main>
  )
}
