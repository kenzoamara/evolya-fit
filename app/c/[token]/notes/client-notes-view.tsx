'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import type { Client } from '@/types/database'

type Note = {
  id: string
  client_id: string
  content: string
  is_private: boolean
  created_at: string
}

type Props = {
  client: Client
  notes: Note[]
  coachView?: boolean
}

const COLOR = 'var(--brand)'
const COLOR_BG = 'var(--brand-bg)'
const COLOR_BORDER = '#FDE68A'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ClientNotesView({ client, notes: initial, coachView = false }: Props) {
  const [notes, setNotes] = useState<Note[]>(initial)
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/client/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, magicToken: client.magic_token, content, isPrivate }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setNotes(prev => [data.note, ...prev])
    setContent('')
    setIsPrivate(false)
    toast.success('Note ajoutée.')
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId)
    const res = await fetch('/api/client/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, clientId: client.id, magicToken: client.magic_token }),
    })
    const data = await res.json()
    setDeletingId(null)
    if (data.error) { toast.error(data.error); return }
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[22px]" style={{ background: COLOR_BG }}>📔</div>
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1F3C]">Mon carnet</h1>
          <p className="text-[11px] text-[#94A3B8]">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Write area — notebook page style */}
      {coachView && (
        <div className="mb-5 px-4 py-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl flex items-center gap-2">
          <span className="text-[14px]">👁</span>
          <p className="text-[12px] text-[#92400E] font-medium">Mode spectateur — les notes privées du client ne sont pas visibles.</p>
        </div>
      )}
      {!coachView && <form
        onSubmit={handleAdd}
        className="rounded-2xl overflow-hidden mb-5 shadow-sm"
        style={{
          background: COLOR_BG,
          border: `1px solid ${COLOR_BORDER}`,
        }}
      >
        {/* Page spiral decoration */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b" style={{ borderColor: COLOR_BORDER }}>
          <span className="text-[13px]" style={{ color: COLOR }}>📔</span>
          <p className="text-[12px] font-semibold" style={{ color: COLOR }}>Nouvelle note</p>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px]" style={{ color: COLOR }}>{content.length}/1000</span>
          </div>
        </div>

        {/* Lined textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 1000))}
            rows={5}
            placeholder="Écris ici… séance du jour, ressenti, objectif, motivation…"
            className="w-full px-4 py-3 text-[14px] leading-[26px] text-[#0D1F3C] resize-none focus:outline-none"
            style={{
              background: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 25px,
                #FDE68A 25px,
                #FDE68A 26px
              )`,
              backgroundColor: COLOR_BG,
              lineHeight: '26px',
              paddingTop: '3px',
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t" style={{ borderColor: COLOR_BORDER }}>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsPrivate(p => !p)}
              className="w-8 h-4 rounded-full transition-colors relative flex-shrink-0"
              style={{ background: isPrivate ? '#0D1F3C' : '#E2E8F0' }}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                style={{ transform: isPrivate ? 'translateX(16px)' : 'translateX(2px)' }}
              />
            </button>
            <span className="text-[11px] text-[#64748B]">
              {isPrivate ? 'Privée' : 'Visible par le coach'}
            </span>
          </label>
          <button
            type="submit"
            disabled={!content.trim() || saving}
            className="px-5 py-2 rounded-xl text-[13px] font-bold text-white transition-opacity disabled:opacity-40"
            style={{ background: COLOR }}
          >
            {saving ? '…' : 'Ajouter'}
          </button>
        </div>
      </form>}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl">📔</span>
          <p className="text-[14px] font-semibold text-[#0D1F3C] mt-3 mb-1">Carnet vide</p>
          <p className="text-[12px] text-[#94A3B8]">Commence à écrire pour remplir ton carnet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note, idx) => {
            // Alternate between slightly different warm shades for visual variety
            const bg = idx % 3 === 0 ? '#FFFBEB' : idx % 3 === 1 ? '#FFF9F0' : '#FFFEF7'
            return (
              <div
                key={note.id}
                className="rounded-2xl overflow-hidden shadow-sm"
                style={{
                  background: bg,
                  border: `1px solid ${note.is_private ? '#E2E8F0' : COLOR_BORDER}`,
                }}
              >
                {/* Note header */}
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b"
                  style={{ borderColor: note.is_private ? '#F1F5F9' : COLOR_BORDER }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{
                    background: note.is_private ? '#F1F5F9' : '#FEF3C7',
                    color: note.is_private ? '#64748B' : COLOR,
                  }}>
                    {note.is_private ? '🔒 Privée' : '💬 Coach'}
                  </span>
                  <p className="text-[10px] text-[#94A3B8] ml-auto truncate capitalize">{formatDate(note.created_at)}</p>
                </div>

                {/* Note content */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <p className="flex-1 text-[13px] text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  {!coachView && <button
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="flex-shrink-0 p-1.5 rounded-lg text-[#D1D5DB] hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {deletingId === note.id
                      ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${COLOR} transparent transparent transparent` }} />
                      : <Trash2 size={13} />
                    }
                  </button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
