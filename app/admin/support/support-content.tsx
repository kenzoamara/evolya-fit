'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Ticket = {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  last_activity_at: string
  created_at: string
  coach_id: string
  profiles: { full_name: string | null; email: string | null; plan: string } | null
}

type Message = {
  id: string
  ticket_id: string
  sender_role: 'coach' | 'admin'
  sender_id: string
  content: string
  created_at: string
}

type Props = { tickets: Ticket[]; adminId: string }

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-50 text-red-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  closed: 'bg-[#F1F5F9] text-[#64748B]',
}
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-[#F1F5F9] text-[#64748B]',
  normal: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function SupportContent({ tickets: initial, adminId }: Props) {
  const [tickets, setTickets] = useState(initial)
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'closed'>('open')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filtered = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus)

  // Realtime: new tickets arriving in the list
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-support-tickets-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, async (payload) => {
        const t = payload.new as Ticket
        // Fetch the coach name for the new ticket
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, plan')
          .eq('id', t.coach_id)
          .single()
        setTickets(prev => [{ ...t, profiles: profile ?? null }, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' }, (payload) => {
        const t = payload.new as Ticket
        setTickets(prev => prev.map(tk => tk.id === t.id ? { ...tk, ...t } : tk))
        setSelected(prev => prev?.id === t.id ? { ...prev, ...t } : prev)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!selected) return
    const supabase = createClient()
    supabase.from('support_messages').select('*').eq('ticket_id', selected.id).order('created_at')
      .then(({ data }) => { setMessages(data ?? []) })

    // Realtime messages
    const channel = supabase
      .channel(`ticket-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selected.id}` }, (p) => {
        setMessages(prev => [...prev, p.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: selected.id,
      sender_role: 'admin',
      sender_id: adminId,
      content: reply.trim(),
    })
    if (!error) {
      await supabase.from('support_tickets').update({
        status: 'in_progress',
        last_activity_at: new Date().toISOString(),
      }).eq('id', selected.id)
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'in_progress' } : t))
      setReply('')
    } else {
      toast.error('Erreur envoi message.')
    }
    setSending(false)
  }

  async function updateStatus(status: Ticket['status']) {
    if (!selected) return
    const supabase = createClient()
    await supabase.from('support_tickets').update({ status }).eq('id', selected.id)
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status } : t))
    setSelected(prev => prev ? { ...prev, status } : null)
    toast.success(`Ticket ${status === 'closed' ? 'clôturé' : 'mis à jour'}.`)
  }

  async function updatePriority(priority: Ticket['priority']) {
    if (!selected) return
    const supabase = createClient()
    await supabase.from('support_tickets').update({ priority }).eq('id', selected.id)
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, priority } : t))
    setSelected(prev => prev ? { ...prev, priority } : null)
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Liste tickets */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h1 className="text-base font-semibold text-[#0D1F3C]">Support</h1>
          <div className="flex gap-1 mt-3 flex-wrap">
            {(['all', 'open', 'in_progress', 'closed'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-[11px] px-2 py-1 rounded-full transition-colors ${filterStatus === s ? 'bg-[#0D1F3C] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>
                {s === 'all' ? 'Tous' : s === 'open' ? 'Ouverts' : s === 'in_progress' ? 'En cours' : 'Clôturés'}
                <span className="ml-1 opacity-60">({tickets.filter(t => s === 'all' || t.status === s).length})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelected(ticket)}
              className={`px-4 py-3 border-b border-[#F1F5F9] cursor-pointer transition-colors ${selected?.id === ticket.id ? 'bg-[#4E9B6F]/5 border-l-2 border-l-[#4E9B6F]' : 'hover:bg-[#F8FAFB]'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[#0D1F3C] truncate flex-1">{ticket.profiles?.full_name ?? 'Coach'}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${STATUS_COLORS[ticket.status]}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-[#64748B] truncate">{ticket.subject}</p>
              <p className="text-[10px] text-[#94A3B8] mt-1">{formatDate(ticket.last_activity_at)}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-[#94A3B8] text-xs">Aucun ticket.</div>
          )}
        </div>
      </div>

      {/* Conversation */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-[#E2E8F0] px-5 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#0D1F3C] text-sm">{selected.subject}</p>
              <p className="text-xs text-[#64748B]">{selected.profiles?.full_name} · {selected.profiles?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={selected.priority} onChange={e => updatePriority(e.target.value as Ticket['priority'])}
                className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white focus:outline-none">
                {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {selected.status !== 'in_progress' && (
                <button onClick={() => updateStatus('in_progress')} className="text-xs px-2.5 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100">
                  En cours
                </button>
              )}
              {selected.status !== 'closed' && (
                <button onClick={() => updateStatus('closed')} className="text-xs px-2.5 py-1.5 bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#E2E8F0]">
                  Clôturer
                </button>
              )}
              {selected.status === 'closed' && (
                <button onClick={() => updateStatus('open')} className="text-xs px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">
                  Rouvrir
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-5 space-y-4 bg-[#F8FAFB]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.sender_role === 'admin' ? 'bg-[#0D1F3C] text-white' : 'bg-white border border-[#E2E8F0] text-[#0D1F3C]'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 ${msg.sender_role === 'admin' ? 'text-white/40' : 'text-[#94A3B8]'}`}>
                    {msg.sender_role === 'admin' ? 'Vous' : selected.profiles?.full_name ?? 'Coach'} · {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-10 text-[#94A3B8] text-sm">Aucun message. Commence la conversation.</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input */}
          <div className="bg-white border-t border-[#E2E8F0] p-4 flex gap-3">
            <textarea
              value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Répondre au coach..."
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm resize-none focus:outline-none focus:border-[#4E9B6F]"
            />
            <button onClick={sendReply} disabled={!reply.trim() || sending}
              className="px-4 py-2 bg-[#0D1F3C] hover:bg-[#2C2C2C] text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors self-end">
              {sending ? '...' : '→'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#94A3B8]">
          <div className="text-center">
            <p className="text-3xl mb-2">🎫</p>
            <p className="text-sm">Sélectionne un ticket</p>
          </div>
        </div>
      )}
    </main>
  )
}
