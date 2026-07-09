import { NextRequest, NextResponse } from 'next/server'

// Génère un fichier .ics pour une journée de formation (8h30-16h30,
// heure de Libreville = UTC+1 sans heure d'été).

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const titre = searchParams.get('titre') ?? 'Formation IA — Studia Academy'
  const date = searchParams.get('date') ?? ''
  const lieu = searchParams.get('lieu') ?? 'Libreville'

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Paramètre date invalide (yyyy-mm-dd)' }, { status: 400 })
  }

  const d = date.replace(/-/g, '')
  // Libreville : UTC+1 → 8h30 locale = 07:30Z, 16h30 locale = 15:30Z
  const dtStart = `${d}T073000Z`
  const dtEnd = `${d}T153000Z`
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const uid = `${d}-${titre.replace(/\W+/g, '').slice(0, 24)}@studia-academy`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studia Academy//Formations IA//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(titre)}`,
    `LOCATION:${escapeIcs(lieu)}`,
    'DESCRIPTION:Formation Studia Academy — 8h30 à 16h30. Apportez votre ordinateur portable.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="formation-studia.ics"',
    },
  })
}
