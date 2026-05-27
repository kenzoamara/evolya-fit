'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuditLog } from '@/types/database'

type Props = { logs: AuditLog[] }

const ACTION_COLORS: Record<string, string> = {
  coach_suspended: 'bg-red-50 text-red-700',
  coach_reactivated: 'bg-green-50 text-green-700',
  coach_deleted: 'bg-red-100 text-red-800',
  plan_changed: 'bg-blue-50 text-blue-700',
  trial_extended: 'bg-purple-50 text-purple-700',
  email_sent: 'bg-yellow-50 text-yellow-700',
  notification_sent: 'bg-orange-50 text-orange-700',
  roadmap_created: 'bg-[#F1F5F9] text-[#64748B]',
  roadmap_updated: 'bg-[#F1F5F9] text-[#64748B]',
  roadmap_deleted: 'bg-red-50 text-red-700',
}

const ACTION_LABELS: Record<string, string> = {
  coach_suspended: 'Suspendu',
  coach_reactivated: 'Réactivé',
  coach_deleted: 'Supprimé',
  plan_changed: 'Plan changé',
  trial_extended: 'Trial prolongé',
  email_sent: 'Email envoyé',
  notification_sent: 'Notif envoyée',
  roadmap_created: 'Roadmap créé',
  roadmap_updated: 'Roadmap MàJ',
  roadmap_deleted: 'Roadmap supprimé',
}

const ALL_ACTIONS = [
  'coach_suspended', 'coach_reactivated', 'coach_deleted',
  'plan_changed', 'trial_extended', 'email_sent',
  'notification_sent', 'roadmap_created', 'roadmap_updated', 'roadmap_deleted',
]

function formatDate(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function LogsContent({ logs: initial }: Props) {
  const [logs, setLogs] = useState(initial)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Realtime: new audit_logs
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-audit-logs-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setLogs(prev => [payload.new as AuditLog, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false
      if (search && !log.action.includes(search) && !log.target_id?.includes(search) && !log.target_type?.includes(search)) return false
      if (dateFrom && log.created_at < dateFrom) return false
      if (dateTo && log.created_at > dateTo + 'T23:59:59') return false
      return true
    })
  }, [logs, filterAction, search, dateFrom, dateTo])

  function exportCSV() {
    const headers = ['Date', 'Action', 'Type cible', 'ID cible', 'Admin ID', 'Payload']
    const rows = filtered.map(l => [
      formatDate(l.created_at),
      l.action,
      l.target_type ?? '',
      l.target_id ?? '',
      l.admin_id.slice(0, 8),
      JSON.stringify(l.payload ?? {}),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click()
  }

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Logs d&apos;audit</h1>
          <p className="text-sm text-[#64748B]">Historique immuable de toutes les actions admin — {filtered.length} entrée(s)</p>
        </div>
        <button onClick={exportCSV} className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:bg-[#F1F5F9]">
          ↓ Export CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher (action, ID...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] w-52"
        />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]">
          <option value="all">Toutes les actions</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#64748B]">Du</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#64748B]">Au</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]" />
        </div>
        {(filterAction !== 'all' || search || dateFrom || dateTo) && (
          <button onClick={() => { setFilterAction('all'); setSearch(''); setDateFrom(''); setDateTo('') }}
            className="px-3 py-2 text-sm text-[#64748B] hover:text-[#0D1F3C] border border-[#E2E8F0] rounded-lg">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFB]">
              {['Date & Heure', 'Action', 'Cible', 'Admin', 'Détails'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#94A3B8] text-sm">
                  Aucun log trouvé.
                </td>
              </tr>
            ) : filtered.map(log => (
              <>
                <tr
                  key={log.id}
                  className="border-b border-[#F1F5F9] hover:bg-[#F8FAFB] cursor-pointer"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <td className="px-4 py-3 text-[#64748B] text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.target_type && (
                      <span className="text-xs text-[#64748B]">
                        <span className="font-medium text-[#0D1F3C]">{log.target_type}</span>
                        {log.target_id && <> · <span className="font-mono text-[#94A3B8]">{log.target_id.slice(0, 8)}…</span></>}
                      </span>
                    )}
                    {!log.target_type && <span className="text-[#94A3B8]">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{log.admin_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-[#94A3B8] text-xs">
                    {log.payload ? (
                      <span className="text-[#4E9B6F]">{expandedId === log.id ? '▲ Masquer' : '▼ Voir payload'}</span>
                    ) : '—'}
                  </td>
                </tr>
                {expandedId === log.id && log.payload && (
                  <tr key={`${log.id}-expand`} className="border-b border-[#F1F5F9] bg-[#F8FAFB]">
                    <td colSpan={5} className="px-4 py-3">
                      <pre className="text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg p-3 overflow-auto max-h-40">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-[#94A3B8] mt-3 text-center">
          Affichage de {filtered.length} log(s) sur {logs.length} total — les logs ne peuvent pas être supprimés.
        </p>
      )}
    </main>
  )
}
