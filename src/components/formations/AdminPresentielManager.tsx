'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, MapPin, Trash2, Loader2, X, Eye, EyeOff, Users, CalendarDays, Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveSession, deleteSession } from '@/lib/formations/admin-actions'
import { formatNumber } from '@/lib/utils'
import type { PresentielSession, PresentielReservation } from '@/types/formation'

export function AdminPresentielManager({
  initialSessions,
  reservations,
}: {
  initialSessions: PresentielSession[]
  reservations: PresentielReservation[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'sessions' | 'reservations'>('sessions')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({
    titre: '', description: '', categorie: '', lieu: '', ville: 'Libreville',
    date_debut: '', places_total: 20, prix_fcfa: 0, formateur_nom: '', is_published: true,
  })

  const create = async () => {
    if (!form.date_debut) { alert('Date requise'); return }
    setSaving(true)
    const res = await saveSession({ ...form, date_debut: new Date(form.date_debut).toISOString() })
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setForm({ titre: '', description: '', categorie: '', lieu: '', ville: 'Libreville', date_debut: '', places_total: 20, prix_fcfa: 0, formateur_nom: '', is_published: true })
      router.refresh()
    } else alert(res.error || 'Erreur')
  }

  const reservationsBySession = (sessionId: string) =>
    reservations.filter((r) => r.session_id === sessionId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Formations présentiel</h2>
          <p className="text-sm text-muted-foreground mt-1">Gérez le planning et les réservations.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#e97e42] hover:bg-[#d56a2e] text-white">
          <Plus className="w-4 h-4 mr-1" />Nouvelle session
        </Button>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {(['sessions', 'reservations'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-white shadow-sm text-[#e97e42]' : 'text-muted-foreground'}`}>
            {t === 'sessions' ? 'Sessions' : `Réservations (${reservations.length})`}
          </button>
        ))}
      </div>

      {/* Formulaire session */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Nouvelle session présentiel</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <Field label="Titre *"><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Date et heure *"><Input type="datetime-local" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className="rounded-xl" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Lieu"><Input placeholder="Centre Studia" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} className="rounded-xl" /></Field>
                <Field label="Ville"><Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} className="rounded-xl" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Places"><Input type="number" value={form.places_total} onChange={(e) => setForm({ ...form, places_total: Number(e.target.value) })} className="rounded-xl" /></Field>
                <Field label="Prix (FCFA)"><Input type="number" value={form.prix_fcfa} onChange={(e) => setForm({ ...form, prix_fcfa: Number(e.target.value) })} className="rounded-xl" /></Field>
              </div>
              <Field label="Formateur"><Input value={form.formateur_nom} onChange={(e) => setForm({ ...form, formateur_nom: e.target.value })} className="rounded-xl" /></Field>
              <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl resize-none" /></Field>
              <Button onClick={create} disabled={!form.titre || saving} className="w-full bg-[#e97e42] hover:bg-[#d56a2e] text-white rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer la session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions */}
      {tab === 'sessions' && (
        initialSessions.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialSessions.map((s) => {
              const resa = reservationsBySession(s.id)
              const isOpen = expanded === s.id
              return (
                <div key={s.id} className="bg-white border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <button onClick={() => setExpanded(isOpen ? null : s.id)} className="flex items-center gap-4 flex-1 text-left min-w-0">
                      <div className="w-12 h-12 bg-[#fff7ed] rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-base font-extrabold text-[#e97e42] leading-none">{new Date(s.date_debut).getDate()}</span>
                        <span className="text-[10px] text-[#a84d16] uppercase">{new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{s.titre}</h3>
                          {s.is_published ? <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Publié</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {s.lieu || s.ville} · {s.places_reservees}/{s.places_total} places · {s.prix_fcfa > 0 ? `${formatNumber(s.prix_fcfa)} FCFA` : 'Gratuit'}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={async () => { await saveSession({ id: s.id, titre: s.titre, date_debut: s.date_debut, is_published: !s.is_published, places_total: s.places_total, prix_fcfa: s.prix_fcfa, lieu: s.lieu ?? undefined, ville: s.ville }); router.refresh() }}>
                        {s.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Supprimer ?')) { await deleteSession(s.id); router.refresh() } }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t p-4 bg-muted/20">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" />{resa.length} réservation{resa.length > 1 ? 's' : ''}</p>
                      {resa.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune réservation.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {resa.map((r) => (
                            <div key={r.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border">
                              <span>{r.prenom} {r.nom}</span>
                              <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:underline">
                                <Phone className="w-3.5 h-3.5" />{r.phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Réservations globales */}
      {tab === 'reservations' && (
        reservations.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune réservation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reservations.map((r) => {
              const session = initialSessions.find((s) => s.id === r.session_id)
              return (
                <div key={r.id} className="flex items-center justify-between bg-white border rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm">{r.prenom} {r.nom}</p>
                    <p className="text-xs text-muted-foreground">{session?.titre ?? '—'}</p>
                  </div>
                  <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline">
                    <Phone className="w-3.5 h-3.5" />{r.phone}
                  </a>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm text-gray-700">{label}</Label>{children}</div>
}
