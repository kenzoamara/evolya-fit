import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function pad(n: number) { return String(n).padStart(2, '0') }

function toIcalDate(dateStr: string, timeStr: string | null): string {
  // dateStr = 'YYYY-MM-DD', timeStr = 'HH:MM' ou null
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!timeStr) {
    // Journée entière
    return `${y}${pad(m)}${pad(d)}`
  }
  const [h, min] = timeStr.split(':').map(Number)
  return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`
}

function addMinutes(dateStr: string, timeStr: string, minutes: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  const date = new Date(y, m - 1, d, h, min + minutes)
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const { coachId } = await params
  const admin = createAdminClient()

  // Vérifier que le coach existe
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('id', coachId)
    .single()

  if (!profile) {
    return new NextResponse('Coach introuvable.', { status: 404 })
  }

  const coachName = (profile as { full_name: string | null }).full_name ?? 'Coach'

  // Séances des 3 derniers mois + 6 prochains mois
  const past = new Date()
  past.setMonth(past.getMonth() - 3)
  const future = new Date()
  future.setMonth(future.getMonth() + 6)

  const [{ data: sessions }, { data: events }] = await Promise.all([
    admin
      .from('sessions')
      .select('id, session_date, session_time, private_notes, clients(full_name)')
      .eq('coach_id', coachId)
      .gte('session_date', past.toISOString().split('T')[0])
      .lte('session_date', future.toISOString().split('T')[0])
      .order('session_date'),

    admin
      .from('coach_events')
      .select('id, title, event_date, start_time, end_time')
      .eq('coach_id', coachId)
      .gte('event_date', past.toISOString().split('T')[0])
      .lte('event_date', future.toISOString().split('T')[0])
      .order('event_date'),
  ])

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EvolyaFit//Calendar//FR',
    `X-WR-CALNAME:${escapeIcal(`Evolya'Fit — ${coachName}`)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  // Séances
  for (const s of sessions ?? []) {
    const session = s as any
    const clientName = session.clients?.full_name ?? 'Client'

    // Durée depuis private_notes (ex: "duration:120")
    let durationMin = 60
    if (session.private_notes) {
      const m = session.private_notes.match(/duration:(\d+)/)
      if (m) durationMin = parseInt(m[1])
    }

    const dtStart = toIcalDate(session.session_date, session.session_time)
    const dtEnd = session.session_time
      ? addMinutes(session.session_date, session.session_time, durationMin)
      : toIcalDate(session.session_date, null)

    lines.push(
      'BEGIN:VEVENT',
      `UID:session-${session.id}@evolyafit.fr`,
      `DTSTAMP:${now}`,
      session.session_time ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
      session.session_time ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeIcal(`Séance — ${clientName}`)}`,
      `DESCRIPTION:${escapeIcal(`Coaching avec ${clientName} · ${durationMin} min`)}`,
      'END:VEVENT',
    )
  }

  // Événements perso du coach
  for (const e of events ?? []) {
    const event = e as any
    const dtStart = toIcalDate(event.event_date, event.start_time ?? null)
    const dtEnd = event.end_time
      ? toIcalDate(event.event_date, event.end_time)
      : event.start_time
        ? addMinutes(event.event_date, event.start_time, 60)
        : toIcalDate(event.event_date, null)

    lines.push(
      'BEGIN:VEVENT',
      `UID:event-${event.id}@evolyafit.fr`,
      `DTSTAMP:${now}`,
      event.start_time ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
      event.end_time || event.start_time ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeIcal(event.title)}`,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="evolyafit-${coachId.slice(0, 8)}.ics"`,
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
