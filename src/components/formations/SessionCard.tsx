'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, MapPin, Users, Clock, Loader2, CheckCircle, X, Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatNumber } from '@/lib/utils'
import { reserveSession } from '@/lib/formations/actions'
import type { PresentielSession } from '@/types/formation'

export function SessionCard({ session }: { session: PresentielSession }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', phone: '' })

  const placesLeft = session.places_total - session.places_reservees
  const full = placesLeft <= 0
  const date = new Date(session.date_debut)

  const submit = async () => {
    setLoading(true)
    const res = await reserveSession({ session_id: session.id, ...form })
    setLoading(false)
    if (res.success) {
      setDone(true)
      router.refresh()
    } else {
      alert(res.error || 'Erreur')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Date */}
        <div className="flex-shrink-0 w-16 h-16 bg-[#fff7ed] rounded-2xl flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold font-heading text-[#e97e42] leading-none">
            {date.getDate()}
          </span>
          <span className="text-xs text-[#a84d16] uppercase">
            {date.toLocaleDateString('fr-FR', { month: 'short' })}
          </span>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-heading text-gray-900">{session.titre}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })} ·{' '}
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{session.lieu || session.ville}</span>
            <span className={`inline-flex items-center gap-1 ${full ? 'text-red-500' : placesLeft <= 3 ? 'text-amber-600' : ''}`}>
              <Users className="w-3.5 h-3.5" />
              {full ? 'Complet' : `${placesLeft} place${placesLeft > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Prix + CTA */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <span className="font-bold text-[#e97e42] whitespace-nowrap">
            {session.prix_fcfa > 0 ? `${formatNumber(session.prix_fcfa)} FCFA` : 'Gratuit'}
          </span>
          {done ? (
            <span className="inline-flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Réservé
            </span>
          ) : (
            <Button
              onClick={() => setOpen(true)}
              disabled={full}
              className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl disabled:opacity-50 whitespace-nowrap"
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              {full ? 'Complet' : 'Réserver'}
            </Button>
          )}
        </div>
      </div>

      {session.description && !open && (
        <p className="text-sm text-gray-500 mt-3 line-clamp-2">{session.description}</p>
      )}

      {/* Modal réservation */}
      {open && !done && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold font-heading text-gray-900">Réserver ma place</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#e97e42]" />
              {session.titre}
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Prénom *</Label>
                  <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Nom *</Label>
                  <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">WhatsApp *</Label>
                <Input placeholder="+241 06 XX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Email (optionnel)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border-[#e2e8f0]" />
              </div>
              <Button
                onClick={submit}
                disabled={!form.prenom || !form.nom || !form.phone || loading}
                className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer ma réservation'}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Vous recevrez une confirmation WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
