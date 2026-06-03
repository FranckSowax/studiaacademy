'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, Check, X, Loader2, Phone, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { decideEnrollment } from '@/lib/formations/admin-actions'
import type { EnrollmentRow } from '@/app/(admin)/admin/formations/inscriptions/page'

export function AdminEnrollmentsManager({ initial }: { initial: EnrollmentRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const rows = filter === 'pending' ? initial.filter((r) => r.status === 'pending') : initial

  const decide = async (id: string, decision: 'active' | 'rejected') => {
    setBusy(id)
    await decideEnrollment(id, decision)
    setBusy(null)
    router.refresh()
  }

  const statusBadge = (s: string) => {
    if (s === 'pending') return <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />En attente</span>
    if (s === 'active') return <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Accès accordé</span>
    if (s === 'rejected') return <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Refusé</span>
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Demandes d'accès</h2>
          <p className="text-sm text-muted-foreground mt-1">Validez les inscriptions aux formations en ligne.</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(['pending', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-white shadow-sm text-[#e97e42]' : 'text-muted-foreground'}`}>
              {f === 'pending' ? 'En attente' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune demande {filter === 'pending' ? 'en attente' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{r.user_name}</h3>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.user_email}</p>
                  <p className="text-sm text-gray-700 mt-1">📚 {r.formation_titre}</p>
                  {r.phone && (
                    <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 mt-1 hover:underline">
                      <Phone className="w-3.5 h-3.5" />{r.phone}
                    </a>
                  )}
                  {r.message && <p className="text-sm text-gray-500 mt-1 italic">"{r.message}"</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => decide(r.id, 'active')} disabled={busy === r.id}
                      className="bg-green-500 hover:bg-green-600 text-white">
                      {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Accorder</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, 'rejected')} disabled={busy === r.id}>
                      <X className="w-4 h-4 mr-1" />Refuser
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
