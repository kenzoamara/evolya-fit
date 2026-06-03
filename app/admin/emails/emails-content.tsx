'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { EmailScheduled, Notification } from '@/types/database'

type Props = {
  history: EmailScheduled[]
  notifications: Notification[]
}

type Tab = 'broadcast' | 'notifications' | 'history'

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'Tous les coaches' },
  { value: 'plan:trial', label: 'Plan Découverte' },
  { value: 'plan:starter', label: 'Plan Lancement' },
  { value: 'plan:growth', label: 'Plan Croissance' },
  { value: 'plan:pro', label: 'Plan Pro' },
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    scheduled: 'bg-blue-50 text-blue-700',
    pending: 'bg-yellow-50 text-yellow-700',
  }
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}>{status}</span>
}

export function EmailsContent({ history: initialHistory, notifications: initialNotifs }: Props) {
  const [tab, setTab] = useState<Tab>('broadcast')
  const [history, setHistory] = useState(initialHistory)
  const [notifs, setNotifs] = useState(initialNotifs)

  // Broadcast form
  const [recipients, setRecipients] = useState('all')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  // Notification form
  const [notifTarget, setNotifTarget] = useState('all')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info')
  const [notifExpires, setNotifExpires] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

  async function handleSendBroadcast() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)

    const res = await fetch('/api/admin/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, recipients, scheduleAt: scheduleAt || null }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) { toast.error(data.error ?? 'Erreur envoi'); return }

    toast.success(scheduleAt ? 'Email planifié !' : `Email envoyé à ${data.sent ?? '?'} coach(s).`)
    setHistory(prev => [data.record, ...prev])
    setSubject(''); setBody(''); setScheduleAt('')
  }

  async function handleSendNotif() {
    if (!notifMessage.trim()) return
    setSendingNotif(true)

    const res = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: notifTarget, message: notifMessage, type: notifType, expiresAt: notifExpires || null }),
    })
    const data = await res.json()
    setSendingNotif(false)

    if (!res.ok) { toast.error(data.error ?? 'Erreur'); return }
    toast.success('Notification envoyée.')
    setNotifs(prev => [data.notification, ...prev])
    setNotifMessage('')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'broadcast', label: '📧 Email Broadcast' },
    { key: 'notifications', label: '🔔 Notifs In-App' },
    { key: 'history', label: `📋 Historique (${history.length})` },
  ]

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0D1F3C]">Emails & Notifications</h1>
        <p className="text-sm text-[#64748B]">Broadcast via Resend — notifications in-app temps réel</p>
      </div>

      <div className="flex gap-1 mb-6 bg-[#F1F5F9] p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-[#64748B] hover:text-[#0D1F3C]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── BROADCAST ─── */}
      {tab === 'broadcast' && (
        <div className="max-w-2xl">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Destinataires</label>
              <select value={recipients} onChange={e => setRecipients(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]">
                {RECIPIENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Objet</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Ex : Nouvelle fonctionnalité disponible 🚀"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">
                Corps du message
                <span className="text-[#94A3B8] font-normal ml-2">({body.length} car.)</span>
              </label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                rows={8} placeholder="Bonjour {prenom},&#10;&#10;..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F] resize-none"
              />
              <p className="text-xs text-[#94A3B8] mt-1">Variables disponibles : {'{prenom}'}, {'{email}'}, {'{plan}'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Planifier (optionnel)</label>
              <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setPreview(true)} disabled={!body.trim()}
                className="px-4 py-2 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F1F5F9] disabled:opacity-40">
                Aperçu
              </button>
              <button onClick={handleSendBroadcast} disabled={!subject.trim() || !body.trim() || sending}
                className="flex-1 py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {sending ? 'Envoi...' : scheduleAt ? '⏰ Planifier' : '📤 Envoyer maintenant'}
              </button>
            </div>
          </div>

          {/* Aperçu modal */}
          {preview && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-[#0D1F3C]">Aperçu email</h3>
                  <button onClick={() => setPreview(false)} className="text-[#94A3B8] hover:text-[#64748B]">×</button>
                </div>
                <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFB]">
                  <p className="text-xs text-[#64748B] mb-1">Objet :</p>
                  <p className="font-medium text-[#0D1F3C] mb-4">{subject || '(sans objet)'}</p>
                  <div className="border-t border-[#E2E8F0] pt-4 whitespace-pre-wrap text-sm text-[#0D1F3C] leading-relaxed">
                    {body.replace(/{prenom}/g, 'Jean').replace(/{email}/g, 'jean@exemple.com').replace(/{plan}/g, 'Croissance')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── NOTIFICATIONS IN-APP ─── */}
      {tab === 'notifications' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Destinataires</label>
                <select value={notifTarget} onChange={e => setNotifTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]">
                  {RECIPIENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Type</label>
                <select value={notifType} onChange={e => setNotifType(e.target.value as 'info' | 'success' | 'warning')}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4E9B6F]">
                  <option value="info">ℹ Info (bleu)</option>
                  <option value="success">✓ Succès (vert)</option>
                  <option value="warning">⚠ Alerte (orange)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">
                Message <span className="text-[#94A3B8] font-normal">({notifMessage.length}/120)</span>
              </label>
              <input type="text" value={notifMessage} onChange={e => setNotifMessage(e.target.value.slice(0, 120))}
                placeholder="Ex : Nouvelle feature disponible — découvrez les rappels auto !"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0D1F3C] mb-1.5">Expire le (optionnel)</label>
              <input type="date" value={notifExpires} onChange={e => setNotifExpires(e.target.value)}
                className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4E9B6F]"
              />
              <p className="text-xs text-[#94A3B8] mt-1">Si vide : permanente jusqu&apos;à fermeture manuelle.</p>
            </div>

            <button onClick={handleSendNotif} disabled={!notifMessage.trim() || sendingNotif}
              className="w-full py-2 bg-[#4E9B6F] hover:bg-[#5a7a60] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {sendingNotif ? 'Envoi...' : '🔔 Envoyer la notification'}
            </button>
          </div>

          {/* Historique notifs */}
          {notifs.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E2E8F0] text-sm font-semibold text-[#0D1F3C]">Notifications envoyées</div>
              {notifs.slice(0, 10).map(n => (
                <div key={n.id} className="px-5 py-3 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0D1F3C] truncate">{n.message}</p>
                    <p className="text-xs text-[#94A3B8]">{n.target} · {new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${n.type === 'info' ? 'bg-blue-50 text-blue-700' : n.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                    {n.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── HISTORIQUE ─── */}
      {tab === 'history' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFB]">
                {['Date', 'Objet', 'Destinataires', 'Envoyés', 'Statut'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Aucun email envoyé pour l&apos;instant.</td></tr>
              ) : history.map(e => (
                <tr key={e.id} className="border-b border-[#F1F5F9]">
                  <td className="px-4 py-3 text-[#64748B]">{new Date(e.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 font-medium text-[#0D1F3C] max-w-[200px] truncate">{e.subject}</td>
                  <td className="px-4 py-3 text-[#64748B]">{typeof e.recipients === 'object' ? (e.recipients as { type?: string }).type ?? 'all' : 'all'}</td>
                  <td className="px-4 py-3 text-[#0D1F3C]">{e.sent_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
