'use client'

import { useState, useRef, useEffect } from 'react'
import { formatDateShort } from '@/lib/utils'
import { useIsCoachView } from '@/hooks/use-coach-view'

type Message = {
  id: string
  content: string
  sender_role: 'coach' | 'client'
  created_at: string
  read_by_client: boolean
}

type Props = {
  clientId: string
  clientName: string
  coachName: string
  token: string
  initialMessages: Message[]
}

export function ClientMessages({ clientId, clientName, coachName, token, initialMessages }: Props) {
  const isCoachView = useIsCoachView()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    setError(null)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content: text.trim(),
      sender_role: 'client',
      created_at: new Date().toISOString(),
      read_by_client: true,
    }
    setMessages(prev => [...prev, optimistic])
    setText('')

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, content: optimistic.content }),
    })
    const data = await res.json()
    setSending(false)

    if (data.error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setError(data.error)
      setText(optimistic.content)
      return
    }

    setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m))
  }

  // Groupe messages par date
  function groupDate(date: string) {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 86400000)
    if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui'
    if (d.toDateString() === yesterday.toDateString()) return 'Hier'
    return formatDateShort(date)
  }

  const groupedMessages: { date: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const dateLabel = groupDate(msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === dateLabel) {
      last.messages.push(msg)
    } else {
      groupedMessages.push({ date: dateLabel, messages: [msg] })
    }
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100svh-64px)] md:h-auto min-h-0">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-[#E2E8F0] bg-white flex-shrink-0">
        <h1 className="text-xl font-semibold text-[#0D1F3C]">Messages</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Conversation avec {coachName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--brand-bg)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 10c0 3.866-3.134 7-7 7a6.97 6.97 0 01-3.5-.938L3 17l.938-3.5A6.97 6.97 0 013 10c0-3.866 3.134-7 7-7s7 3.134 7 7z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-[#0D1F3C] mb-1">Aucun message</p>
              <p className="text-xs text-[#64748B]">Commencez la conversation avec votre coach</p>
            </div>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-xs text-[#94A3B8] flex-shrink-0">{group.date}</span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>
            <div className="space-y-2">
              {group.messages.map(msg => {
                const isClient = msg.sender_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    {!isClient && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mr-2 mt-0.5" style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand)' }}>
                        {coachName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isClient ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isClient && (
                        <span className="text-xs text-[#64748B] ml-1">{coachName}</span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isClient ? 'text-white rounded-br-sm' : 'bg-white border border-[#E2E8F0] text-[#0D1F3C] rounded-bl-sm'}`}
                        style={isClient ? { backgroundColor: 'var(--brand)' } : {}}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-[#94A3B8] px-1">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[#E2E8F0] bg-white px-4 sm:px-8 py-3 sm:py-4">
        {isCoachView ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 9.5v.3"/></svg>
            <p className="text-[12px] text-[#92400E] font-medium">Mode spectateur — envoi de messages désactivé.</p>
          </div>
        ) : (
          <>
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) }
                }}
                placeholder="Écrire un message..."
                rows={1}
                className="flex-1 px-3.5 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-colors resize-none leading-relaxed"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="flex-shrink-0 w-10 h-10 rounded-xl btn-brand flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Envoyer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8L14 2L8 14L7 9L2 8Z" fill="currentColor" />
                </svg>
              </button>
            </form>
            <p className="text-[10px] text-[#94A3B8] mt-1.5">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
          </>
        )}
      </div>
    </main>
  )
}
