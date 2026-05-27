'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

// ── Types ──────────────────────────────────────────────────────────────────────
type ClientInfo = {
  id: string
  full_name: string
  email: string
  status: string
  last_seen: string | null
}

type Message = {
  id: string
  client_id: string
  coach_id: string
  sender_role: 'coach' | 'client'
  content: string
  read_by_coach: boolean
  read_by_client: boolean
  created_at: string
  reply_to_id: string | null
  reactions: Record<string, string[]>
  edited_at: string | null
  deleted_at: string | null
  pinned: boolean
}

type Props = {
  profile: Profile
  clients: ClientInfo[]
  initialMessages: Message[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#EEF9F3', text: '#4E9B6F' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#F5F3FF', text: '#7C3AED' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#F0FDFA', text: '#0D9488' },
  { bg: '#FEF2F2', text: '#DC2626' },
]

const QUICK_REPLIES = [
  'Bien reçu, continue comme ça !',
  'Je regarde et je reviens vers toi.',
  'Beau travail cette semaine !',
  "N'hésite pas si tu as des douleurs.",
  'On en parle à la prochaine séance.',
]

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '💪', '✅', '🎯']

// ── Helpers ───────────────────────────────────────────────────────────────────
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatLastSeen(iso: string | null): { label: string; online: boolean } {
  if (!iso) return { label: 'Jamais connecté', online: false }
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 5) return { label: 'En ligne', online: true }
  if (mins < 60) return { label: `Il y a ${mins} min`, online: false }
  const h = Math.floor(mins / 60)
  if (h < 24) return { label: `Il y a ${h}h`, online: false }
  return { label: `Il y a ${Math.floor(h / 24)}j`, online: false }
}

// ── EmojiPickerPopup ──────────────────────────────────────────────────────────
function EmojiPickerPopup({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div
      className="absolute bottom-full mb-1 left-0 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2 flex gap-1 z-50"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
    >
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => { onSelect(e); onClose() }}
          className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-[#F1F5F9] rounded-lg transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  )
}

// ── ReplyBar ──────────────────────────────────────────────────────────────────
function ReplyBar({ message, onCancel }: { message: Message; onCancel: () => void }) {
  return (
    <div className="px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFB] flex items-center gap-2">
      <div className="w-[3px] h-10 bg-[#4E9B6F] rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-[#4E9B6F] mb-0.5">
          {message.sender_role === 'coach' ? 'Vous' : 'Membre'}
        </p>
        <p className="text-[12px] text-[#64748B] truncate">{message.content}</p>
      </div>
      <button onClick={onCancel} className="text-[#94A3B8] hover:text-[#64748B] p-1 flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ── PinnedBanner ──────────────────────────────────────────────────────────────
function PinnedBanner({ messages, onUnpin }: { messages: Message[]; onUnpin: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  if (messages.length === 0) return null
  return (
    <div className="border-b border-[#E2E8F0] bg-[#FFFBEB]">
      <button onClick={() => setOpen(v => !v)} className="w-full px-5 py-2.5 flex items-center gap-2 text-left">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
        </svg>
        <span className="text-[12px] font-semibold text-[#D97706]">
          {messages.length} message{messages.length > 1 ? 's' : ''} épinglé{messages.length > 1 ? 's' : ''}
        </span>
        <svg className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-3 space-y-2">
          {messages.map(m => (
            <div key={m.id} className="flex items-start gap-2 bg-white border border-[#FDE68A] rounded-xl px-3 py-2">
              <p className="text-[12px] text-[#0D1F3C] flex-1 leading-snug line-clamp-2">{m.content}</p>
              <button onClick={() => onUnpin(m.id)} className="text-[#94A3B8] hover:text-[#64748B] flex-shrink-0 ml-1 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  msg, allMessages, coachId, onReply, onReact, onEdit, onDelete, onPin,
}: {
  msg: Message
  allMessages: Message[]
  coachId: string
  onReply: (m: Message) => void
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onPin: (id: string, pin: boolean) => void
}) {
  const isCoach = msg.sender_role === 'coach'
  const [hovering, setHovering] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(msg.content)

  const replyTo = msg.reply_to_id ? allMessages.find(m => m.id === msg.reply_to_id) : null
  const reactions = msg.reactions ?? {}
  const totalReactions = Object.values(reactions).reduce((s, arr) => s + arr.length, 0)

  if (msg.deleted_at) {
    return (
      <div className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2 rounded-2xl bg-[#F1F5F9] border border-dashed border-[#CBD5E1]">
          <p className="text-[12px] text-[#94A3B8] italic">Message supprimé</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowEmoji(false) }}
    >
      <div className={`flex flex-col ${isCoach ? 'items-end' : 'items-start'} max-w-[78%]`}>

        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-start gap-1.5 mb-1 px-3 py-1.5 rounded-xl bg-[#F1F5F9] border-l-2 border-[#4E9B6F] max-w-full">
            <p className="text-[11px] text-[#64748B] truncate">
              <span className="font-semibold">{replyTo.sender_role === 'coach' ? 'Vous' : 'Membre'} : </span>
              {replyTo.content}
            </p>
          </div>
        )}

        {/* Message row */}
        <div className={`flex items-end gap-1.5 ${isCoach ? 'flex-row-reverse' : 'flex-row'}`}>

          {/* Bubble */}
          <div className={`relative rounded-2xl px-4 py-2.5 ${isCoach ? 'bg-[#4E9B6F] text-white rounded-br-md' : 'bg-[#F1F5F9] text-[#0D1F3C] rounded-bl-md'}`}>
            {editing ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (editContent.trim()) { onEdit(msg.id, editContent); setEditing(false) }
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="bg-transparent border-b border-white/50 text-[13px] outline-none flex-1 min-w-[120px]"
                />
                <button type="submit" className="text-[11px] font-semibold opacity-80 hover:opacity-100">OK</button>
                <button type="button" onClick={() => setEditing(false)} className="text-[11px] opacity-60 hover:opacity-100">✕</button>
              </form>
            ) : (
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <p className={`text-[10px] ${isCoach ? 'text-white/60' : 'text-[#94A3B8]'}`}>
                {formatMessageTime(msg.created_at)}
              </p>
              {msg.edited_at && (
                <p className={`text-[9px] ${isCoach ? 'text-white/40' : 'text-[#CBD5E1]'}`}>· modifié</p>
              )}
            </div>
          </div>

          {/* Hover actions */}
          <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${hovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* React */}
            <div className="relative">
              <button
                onClick={() => setShowEmoji(v => !v)}
                className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F1F5F9] shadow-sm"
                title="Réagir"
              >
                <span className="text-[13px]">😊</span>
              </button>
              {showEmoji && <EmojiPickerPopup onSelect={e => onReact(msg.id, e)} onClose={() => setShowEmoji(false)} />}
            </div>
            {/* Reply */}
            <button
              onClick={() => onReply(msg)}
              className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F1F5F9] shadow-sm"
              title="Répondre"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 00-4-4H4" />
              </svg>
            </button>
            {/* Edit — coach seulement sur ses messages */}
            {isCoach && (
              <button
                onClick={() => { setEditing(true); setEditContent(msg.content) }}
                className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F1F5F9] shadow-sm"
                title="Modifier"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {/* Pin */}
            {isCoach && (
              <button
                onClick={() => onPin(msg.id, !msg.pinned)}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shadow-sm transition-colors ${msg.pinned ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-white border-[#E2E8F0] hover:bg-[#F1F5F9]'}`}
                title={msg.pinned ? 'Désépingler' : 'Épingler'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={msg.pinned ? '#D97706' : '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
                </svg>
              </button>
            )}
            {/* Delete */}
            {isCoach && (
              <button
                onClick={() => onDelete(msg.id)}
                className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#FEF2F2] hover:border-[#FECACA] shadow-sm"
                title="Supprimer"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Reactions */}
        {totalReactions > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isCoach ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button
                  key={emoji}
                  onClick={() => onReact(msg.id, emoji)}
                  className="flex items-center gap-0.5 px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-full text-[12px] hover:bg-[#F1F5F9] transition-colors shadow-sm"
                >
                  <span>{emoji}</span>
                  {users.length > 1 && <span className="text-[11px] text-[#64748B] font-medium">{users.length}</span>}
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ConversationItem ──────────────────────────────────────────────────────────
function ConversationItem({ client, lastMessage, unread, active, onClick }: {
  client: ClientInfo
  lastMessage: Message | null
  unread: number
  active: boolean
  onClick: () => void
}) {
  const ls = formatLastSeen(client.last_seen)
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors border-b border-[#F1F5F9] ${active ? 'bg-[#EEF9F3]' : 'hover:bg-[#F8FAFB]'}`}
    >
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold"
          style={{ backgroundColor: avatarColor(client.full_name).bg, color: avatarColor(client.full_name).text }}
        >
          {client.full_name.charAt(0).toUpperCase()}
        </div>
        {ls.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4E9B6F] border-2 border-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-[13px] truncate ${unread > 0 ? 'font-semibold text-[#0D1F3C]' : 'font-medium text-[#0D1F3C]'}`}>
            {client.full_name}
          </p>
          {lastMessage && (
            <span className="text-[10px] text-[#94A3B8] flex-shrink-0 ml-2">{formatTime(lastMessage.created_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-[10px] flex-shrink-0 ${ls.online ? 'text-[#4E9B6F] font-medium' : 'text-[#CBD5E1]'}`}>
            {ls.label} ·
          </span>
          {lastMessage ? (
            <p className={`text-[12px] truncate flex-1 ${unread > 0 ? 'text-[#0D1F3C] font-medium' : 'text-[#94A3B8]'}`}>
              {lastMessage.deleted_at
                ? 'Message supprimé'
                : (lastMessage.sender_role === 'coach' ? 'Vous : ' : '') + lastMessage.content}
            </p>
          ) : (
            <p className="text-[12px] text-[#CBD5E1]">Aucun message</p>
          )}
        </div>
      </div>
      {unread > 0 && (
        <span className="bg-[#4E9B6F] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
          {unread}
        </span>
      )}
    </button>
  )
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────
function ChatPanel({ client, messages, coachId, onSend, onReact, onEdit, onDelete, onPin }: {
  client: ClientInfo
  messages: Message[]
  coachId: string
  onSend: (content: string, replyToId?: string) => void
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onPin: (id: string, pin: boolean) => void
}) {
  const [input, setInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [athleteTyping, setAthleteTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const supabaseRef = useRef(createClient())
  const ls = formatLastSeen(client.last_seen)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Typing indicator — Supabase Realtime Presence
  useEffect(() => {
    const supabase = supabaseRef.current
    const channelKey = `typing-${coachId}-${client.id}`
    const channel = supabase.channel(channelKey)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ role: string }>()
        const others = Object.values(state).flat()
        setAthleteTyping(others.some(p => p.role === 'client'))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [client.id, coachId])

  const broadcastTyping = useCallback(() => {
    const supabase = supabaseRef.current
    const channel = supabase.channel(`typing-${coachId}-${client.id}`)
    channel.track({ role: 'coach', typing: true })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => channel.untrack(), 2000)
  }, [client.id, coachId])

  const pinnedMessages = messages.filter(m => m.pinned && !m.deleted_at)
  const displayMessages = search.trim()
    ? messages.filter(m => !m.deleted_at && m.content.toLowerCase().includes(search.toLowerCase()))
    : messages

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim(), replyTo?.id)
    setInput('')
    setReplyTo(null)
    setShowTemplates(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor(client.full_name).bg, color: avatarColor(client.full_name).text }}
          >
            {client.full_name.charAt(0).toUpperCase()}
          </div>
          {ls.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#4E9B6F] border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#0D1F3C] leading-none">{client.full_name}</p>
          <p className={`text-[11px] mt-0.5 transition-colors ${athleteTyping ? 'text-[#4E9B6F]' : ls.online ? 'text-[#4E9B6F]' : 'text-[#94A3B8]'}`}>
            {athleteTyping ? 'En train d\'écrire...' : ls.label}
          </p>
        </div>
        <button
          onClick={() => { setShowSearch(v => !v); setSearch('') }}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors flex-shrink-0 ${showSearch ? 'bg-[#EEF9F3] border-[#4E9B6F] text-[#4E9B6F]' : 'border-[#E2E8F0] text-[#94A3B8] hover:text-[#64748B]'}`}
          title="Rechercher dans les messages"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-[#E2E8F0] bg-[#F8FAFB] flex-shrink-0">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans les messages..."
            className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[12px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F]"
          />
          {search && (
            <p className="text-[11px] text-[#94A3B8] mt-1">{displayMessages.length} résultat{displayMessages.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Pinned */}
      <PinnedBanner messages={pinnedMessages} onUnpin={id => onPin(id, false)} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <style>{`
          @keyframes typingBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        `}</style>
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-[13px] text-[#94A3B8]">{search ? 'Aucun résultat' : 'Commencer la conversation'}</p>
            </div>
          </div>
        ) : (
          displayMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              allMessages={messages}
              coachId={coachId}
              onReply={setReplyTo}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          ))
        )}

        {/* Typing dots */}
        {athleteTyping && (
          <div className="flex justify-start">
            <div className="bg-[#F1F5F9] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
              {[0, 150, 300].map(delay => (
                <div
                  key={delay}
                  className="w-2 h-2 rounded-full bg-[#94A3B8]"
                  style={{ animation: `typingBounce 1s ${delay}ms infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && <ReplyBar message={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* Quick replies */}
      {showTemplates && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {QUICK_REPLIES.map((t, i) => (
            <button
              key={i}
              onClick={() => { onSend(t, replyTo?.id); setReplyTo(null); setShowTemplates(false) }}
              className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#EEF9F3] hover:text-[#4E9B6F] text-[#64748B] text-[12px] rounded-xl transition-colors border border-[#E2E8F0] hover:border-[#4E9B6F]/30"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[#E2E8F0] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(v => !v)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0 ${showTemplates ? 'bg-[#EEF9F3] border-[#4E9B6F] text-[#4E9B6F]' : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#4E9B6F] hover:text-[#4E9B6F]'}`}
            title="Réponses rapides"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); broadcastTyping() }}
            placeholder={replyTo ? 'Répondre...' : 'Écrire un message...'}
            className="flex-1 px-4 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-[#4E9B6F] text-white rounded-xl hover:bg-[#3d8058] transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

// ── GroupModal ────────────────────────────────────────────────────────────────
function GroupModal({ clients, onSend, onClose }: {
  clients: ClientInfo[]
  onSend: (clientIds: string[], content: string) => Promise<void>
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleSend() {
    if (!content.trim() || selected.size === 0) return
    setLoading(true)
    await onSend(Array.from(selected), content.trim())
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div className="px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[16px] font-bold text-[#0D1F3C]">Message groupé</h3>
            <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-[12px] text-[#94A3B8]">Envoie un message à plusieurs membres en même temps.</p>
        </div>

        <div className="px-4 py-3 border-b border-[#F1F5F9] max-h-48 overflow-y-auto">
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 px-2">
            Membres ({selected.size} sélectionné{selected.size !== 1 ? 's' : ''})
          </p>
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors text-left ${selected.has(c.id) ? 'bg-[#EEF9F3]' : 'hover:bg-[#F8FAFB]'}`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ backgroundColor: avatarColor(c.full_name).bg, color: avatarColor(c.full_name).text }}
              >
                {c.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-[#0D1F3C] flex-1">{c.full_name}</span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(c.id) ? 'bg-[#4E9B6F] border-[#4E9B6F]' : 'border-[#CBD5E1]'}`}>
                {selected.has(c.id) && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="px-6 py-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Votre message..."
            rows={3}
            className="w-full px-4 py-3 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F] resize-none mb-3"
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || selected.size === 0 || loading}
            className="w-full py-3 bg-[#4E9B6F] text-white rounded-xl text-[14px] font-semibold hover:bg-[#3d8058] transition-colors disabled:opacity-40"
          >
            {loading ? 'Envoi...' : `Envoyer à ${selected.size} membre${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MessagesContent({ profile, clients, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages as Message[])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const selectedClientIdRef = useRef(selectedClientId)

  useEffect(() => { selectedClientIdRef.current = selectedClientId }, [selectedClientId])

  // Realtime — INSERT + UPDATE
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('coach-messages-v2')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `coach_id=eq.${profile.id}`,
      }, payload => {
        const msg = payload.new as Message
        setMessages(prev => [...prev, msg])
        if (msg.sender_role === 'client' && msg.client_id !== selectedClientIdRef.current) {
          const sender = clients.find(c => c.id === msg.client_id)
          toast(`Message de ${sender?.full_name ?? 'un membre'}`, {
            description: msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content,
            action: { label: 'Voir', onClick: () => selectClient(msg.client_id) },
            duration: 6000,
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `coach_id=eq.${profile.id}`,
      }, payload => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const conversationData = clients
    .map(client => {
      const clientMessages = messages.filter(m => m.client_id === client.id)
      const lastMessage = clientMessages.length > 0 ? clientMessages[clientMessages.length - 1] : null
      const unread = clientMessages.filter(m => m.sender_role === 'client' && !m.read_by_coach).length
      return { client, lastMessage, unread }
    })
    .sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    })

  const filtered = search.trim()
    ? conversationData.filter(c => c.client.full_name.toLowerCase().includes(search.toLowerCase()))
    : conversationData

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedMessages = selectedClientId ? messages.filter(m => m.client_id === selectedClientId) : []

  async function handleSend(content: string, replyToId?: string) {
    if (!selectedClientId) return
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedClientId, content, reply_to_id: replyToId ?? null }),
    })
    if (res.ok) {
      const { message } = await res.json()
      setMessages(prev => [...prev, message])
    }
    await fetch(`/api/messages?clientId=${selectedClientId}`)
  }

  async function handleGroupSend(clientIds: string[], content: string) {
    await Promise.all(clientIds.map(cId =>
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: cId, content }),
      })
    ))
    toast.success(`Message envoyé à ${clientIds.length} membre${clientIds.length !== 1 ? 's' : ''}`)
  }

  async function patchMessage(messageId: string, body: object) {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const { message } = await res.json()
      setMessages(prev => prev.map(m => m.id === messageId ? message : m))
    }
  }

  function selectClient(clientId: string) {
    setSelectedClientId(clientId)
    setMobileShowChat(true)
  }

  return (
    <>
      {showGroupModal && (
        <GroupModal clients={clients} onSend={handleGroupSend} onClose={() => setShowGroupModal(false)} />
      )}
      <div className="flex-1 flex flex-col sm:flex-row h-[calc(100vh-48px)] md:h-screen overflow-hidden">

        {/* Sidebar */}
        <div className={`w-full sm:w-[320px] flex-shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-4 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-[18px] font-bold text-[#0D1F3C]">Messages</h1>
              <button
                onClick={() => setShowGroupModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#94A3B8] hover:text-[#4E9B6F] hover:border-[#4E9B6F] transition-colors"
                title="Message groupé"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full px-3 py-2 bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl text-[12px] text-[#0D1F3C] placeholder-[#94A3B8] focus:outline-none focus:border-[#4E9B6F]"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-[13px] text-[#94A3B8]">Aucune conversation</p>
                <p className="text-[11px] text-[#CBD5E1] mt-1">Les messages de tes membres apparaîtront ici</p>
              </div>
            ) : (
              filtered.map(({ client, lastMessage, unread }) => (
                <ConversationItem
                  key={client.id}
                  client={client}
                  lastMessage={lastMessage}
                  unread={unread}
                  active={selectedClientId === client.id}
                  onClick={() => selectClient(client.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col bg-white ${!mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
          {selectedClient ? (
            <>
              <div className="sm:hidden px-4 py-2 border-b border-[#E2E8F0] flex-shrink-0">
                <button onClick={() => setMobileShowChat(false)} className="text-[13px] text-[#4E9B6F] font-medium">
                  ← Retour
                </button>
              </div>
              <ChatPanel
                client={selectedClient}
                messages={selectedMessages}
                coachId={profile.id}
                onSend={handleSend}
                onReact={(id, emoji) => patchMessage(id, { action: 'react', emoji })}
                onEdit={(id, content) => patchMessage(id, { action: 'edit', content })}
                onDelete={id => patchMessage(id, { action: 'delete' })}
                onPin={(id, pin) => patchMessage(id, { action: pin ? 'pin' : 'unpin' })}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-[#0D1F3C]">Sélectionne une conversation</p>
                <p className="text-[12px] text-[#94A3B8] mt-1">Choisis un membre pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
