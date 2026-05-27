'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  prenom: string
  nom: string
  email: string
  sujet: string
  message: string
  read: boolean
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ContactContent({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initial)
  const [selected, setSelected] = useState<Message | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const supabase = createClient()

  async function markRead(msg: Message) {
    if (!msg.read) {
      await supabase.from('contact_messages').update({ read: true }).eq('id', msg.id)
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
    }
    setSelected({ ...msg, read: true })
  }

  async function markUnread(id: string) {
    await supabase.from('contact_messages').update({ read: false }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: false } : m))
    if (selected?.id === id) setSelected(s => s ? { ...s, read: false } : s)
  }

  async function deleteMsg(id: string) {
    await supabase.from('contact_messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const unreadCount = messages.filter(m => !m.read).length
  const displayed = filter === 'unread' ? messages.filter(m => !m.read) : messages

  return (
    <div className="flex h-screen bg-[#F8FAFB]">

      {/* Sidebar liste */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[16px] font-bold text-[#0D1F3C]">Messages contact</h1>
            {unreadCount > 0 && (
              <span className="bg-[#4E9B6F] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-[#F0FAF4] text-[#4E9B6F]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }`}
              >
                {f === 'all' ? 'Tous' : 'Non lus'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="text-center py-16 text-[13px] text-[#9CA3AF]">
              {filter === 'unread' ? 'Aucun message non lu' : 'Aucun message reçu'}
            </div>
          ) : (
            displayed.map(msg => (
              <button
                key={msg.id}
                onClick={() => markRead(msg)}
                className={`w-full text-left px-5 py-4 border-b border-[#F3F4F6] transition-colors hover:bg-[#F8FAFB] ${
                  selected?.id === msg.id ? 'bg-[#F0FAF4] border-l-2 border-l-[#4E9B6F]' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {!msg.read && (
                    <span className="w-2 h-2 rounded-full bg-[#4E9B6F] flex-shrink-0 mt-1.5" />
                  )}
                  <div className={`flex-1 min-w-0 ${msg.read ? 'pl-4' : ''}`}>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-[13px] truncate ${msg.read ? 'text-[#6B7280]' : 'text-[#0D1F3C] font-semibold'}`}>
                        {msg.prenom} {msg.nom}
                      </p>
                      <span className="text-[11px] text-[#B0B7C3] flex-shrink-0">
                        {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#9CA3AF] truncate">{msg.sujet}</p>
                    <p className="text-[11px] text-[#C4C9D4] truncate mt-0.5">{msg.message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Détail message */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* Header détail */}
            <div className="bg-white border-b border-[#E5E7EB] px-8 py-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-bold text-[#0D1F3C] mb-0.5">{selected.sujet}</h2>
                <p className="text-[13px] text-[#6B7280]">
                  {selected.prenom} {selected.nom} ·{' '}
                  <a href={`mailto:${selected.email}`} className="text-[#4E9B6F] hover:underline">{selected.email}</a>
                  {' '}· {fmtDate(selected.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => markUnread(selected.id)}
                  className="text-[12px] text-[#6B7280] hover:text-[#0D1F3C] bg-[#F3F4F6] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Marquer non lu
                </button>
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.sujet}`}
                  className="text-[12px] font-semibold text-white bg-[#4E9B6F] hover:bg-[#3D7A5F] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Répondre
                </a>
                <button
                  onClick={() => deleteMsg(selected.id)}
                  className="text-[12px] text-[#EF4444] hover:text-red-700 bg-[#FEF2F2] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {/* Corps du message */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="max-w-2xl bg-white rounded-2xl border border-[#E5E7EB] p-7 shadow-sm">
                <p className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/>
                <path d="M3 8l9 6 9-6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[#9CA3AF]">Sélectionnez un message</p>
          </div>
        )}
      </div>

    </div>
  )
}
