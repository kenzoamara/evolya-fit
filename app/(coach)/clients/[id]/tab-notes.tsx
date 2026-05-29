'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ClientNote } from './_shared'

export function NotesTab({
  clientNotes,
  coachNotes: initialCoachNotes,
  clientId,
}: {
  clientNotes: ClientNote[]
  coachNotes: ClientNote[]
  clientId: string
}) {
  const [coachNotes, setCoachNotes] = useState<ClientNote[]>(initialCoachNotes)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/coach/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, content }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { toast.error(data.error); return }
    setCoachNotes(prev => [data.note, ...prev])
    setContent('')
    toast.success('Note ajoutée.')
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId)
    const res = await fetch('/api/coach/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, clientId }),
    })
    const data = await res.json()
    setDeletingId(null)
    if (data.error) { toast.error(data.error); return }
    setCoachNotes(prev => prev.filter(n => n.id !== noteId))
    toast.success('Note supprimée.')
  }

  function formatNoteDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[#0D1F3C]">Mes notes privées</h3>
          <span className="text-xs text-[#94A3B8]">visibles uniquement par vous</span>
        </div>
        <form onSubmit={handleAdd} className="mb-3">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <textarea value={content} onChange={e => setContent(e.target.value.slice(0, 2000))} rows={3}
              placeholder="Observations, impressions, points à aborder en séance..."
              className="w-full px-3 py-2.5 bg-[#F8FAFB] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-brand transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">{content.length}/2000</span>
              <button type="submit" disabled={!content.trim() || saving}
                className="px-4 py-2 btn-brand text-sm font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50">
                {saving ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </form>
        {coachNotes.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl px-4 py-6 text-center text-sm text-[#94A3B8]">
            Aucune note privée pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-2">
            {coachNotes.map(note => (
              <div key={note.id} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 flex items-start gap-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-[#94A3B8] mt-1.5">{formatNoteDate(note.created_at)}</p>
                </div>
                <button onClick={() => handleDelete(note.id)} disabled={deletingId === note.id}
                  className="flex-shrink-0 px-2 py-1 text-xs text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30">
                  {deletingId === note.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[#0D1F3C]">Notes du client</h3>
          <span className="text-xs text-[#94A3B8]">notes partagées par le client</span>
        </div>
        {clientNotes.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl px-4 py-6 text-center text-sm text-[#94A3B8]">
            Aucune note publique pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-2">
            {clientNotes.map(note => (
              <div key={note.id} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                <p className="text-sm text-[#0D1F3C] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-[#94A3B8] mt-1.5">{formatNoteDate(note.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
