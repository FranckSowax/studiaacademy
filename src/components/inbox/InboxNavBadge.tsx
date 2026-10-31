'use client'

import { useEffect, useState } from 'react'

const BADGE_POLL_MS = 30_000

/**
 * Pastille « à répondre » du menu latéral. Ne charge que les compteurs
 * (deux count head), jamais la liste.
 */
export function InboxNavBadge() {
  const [toReply, setToReply] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (document.hidden) return
      try {
        const res = await fetch('/api/inbox/conversations?only=counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { counts?: { toReply?: number } }
        if (!cancelled && typeof data.counts?.toReply === 'number') setToReply(data.counts.toReply)
      } catch {
        // Pastille non critique : on garde la dernière valeur.
      }
    }
    void load()
    const timer = setInterval(load, BADGE_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  if (!toReply) return null
  return (
    <span className="ml-auto rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white" aria-label={`${toReply} à répondre`}>
      {toReply}
    </span>
  )
}
