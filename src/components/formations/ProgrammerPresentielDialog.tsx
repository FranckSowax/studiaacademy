'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarPlus, CheckCircle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { programmerFormationEnPresentiel } from '@/lib/events/actions'
import {
  EVENT_TYPE_LABELS, EVENT_TYPES, FREQUENCE_LABELS, FREQUENCES, OCCURRENCES_MAX,
} from '@/lib/events/rules'
import type { Formation } from '@/types/formation'

const SELECT = 'h-9 w-full rounded-xl border border-input bg-white px-3 text-sm'

/**
 * Programme une formation en ligne en présentiel à Studia Academy : l'admin
 * choisit la date, les places et le prix ; le titre, la description, l'image
 * et le formateur sont repris de la formation, qui n'est pas modifiée.
 * Option : annoncer la date dans un slide de la page d'accueil, avec le
 * bouton d'inscription.
 *
 * @example
 * <ProgrammerPresentielDialog formation={f} onClose={() => setCible(null)} />
 */
export function ProgrammerPresentielDialog({ formation, onClose }: { formation: Formation; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [fait, setFait] = useState<{ crees: number; avertissement?: string } | null>(null)
  const [form, setForm] = useState({
    type: 'formation',
    date_debut: '',
    date_fin: '',
    lieu: 'Studia Academy',
    places_total: '20',
    prix_fcfa: String(formation.prix_fcfa ?? 0),
    frequence: 'none',
    nombre: '4',
    creer_slide: true,
    is_published: true,
  })
  const champ = (cle: 'date_debut' | 'date_fin' | 'lieu' | 'places_total' | 'prix_fcfa' | 'nombre') => ({
    value: form[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [cle]: e.target.value })),
  })

  const enregistrer = async () => {
    setErreur(null)
    if (!form.date_debut) {
      setErreur('Choisissez la date et l’heure de début.')
      return
    }
    setSaving(true)
    const res = await programmerFormationEnPresentiel({
      formation_id: formation.id,
      type: form.type,
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
      lieu: form.lieu,
      places_total: Number(form.places_total),
      prix_fcfa: Number(form.prix_fcfa),
      is_published: form.is_published,
      recurrence: { frequence: form.frequence, nombre: Number(form.nombre) },
      creer_slide: form.creer_slide,
    })
    setSaving(false)
    if (!res.success) setErreur(res.error ?? 'La programmation a échoué.')
    else setFait({ crees: res.crees ?? 1, avertissement: res.avertissement })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div role="dialog" aria-modal="true" aria-labelledby="programmer-titre" className="my-auto w-full max-w-lg rounded-3xl bg-white p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 id="programmer-titre" className="flex items-center gap-2 text-lg font-bold">
            <CalendarPlus className="h-5 w-5 text-[#e97e42]" />
            Programmer en présentiel
          </h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          « {formation.titre} » — le titre, la description, l’image et le formateur sont repris. La formation en ligne n’est pas modifiée.
        </p>

        {fait ? (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {fait.crees > 1 ? `${fait.crees} dates créées.` : 'L’événement est créé.'}
              {form.creer_slide && !fait.avertissement ? ' Le slide d’accueil est ajouté, avec son bouton d’inscription.' : ''}
            </p>
            {fait.avertissement && (
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{fait.avertissement}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Fermer</Button>
              <Button asChild className="bg-[#e97e42] text-white hover:bg-[#d56a2e]">
                <Link href="/admin/evenements">Voir les événements</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label htmlFor="pp-type" className="text-sm text-gray-700">Type</Label>
                <select id="pp-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={SELECT}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pp-debut" className="text-sm text-gray-700">Début *</Label>
                  <Input id="pp-debut" type="datetime-local" {...champ('date_debut')} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pp-fin" className="text-sm text-gray-700">Fin (optionnel)</Label>
                  <Input id="pp-fin" type="datetime-local" min={form.date_debut || undefined} {...champ('date_fin')} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pp-places" className="text-sm text-gray-700">Places</Label>
                  <Input id="pp-places" type="number" min={1} step={1} inputMode="numeric" {...champ('places_total')} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pp-prix" className="text-sm text-gray-700">Prix (FCFA, 0 = gratuit)</Label>
                  <Input id="pp-prix" type="number" min={0} step={1} inputMode="numeric" {...champ('prix_fcfa')} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pp-lieu" className="text-sm text-gray-700">Lieu</Label>
                <Input id="pp-lieu" {...champ('lieu')} className="rounded-xl" />
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#f0ebe3] bg-[#fbf8f3] p-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pp-frequence" className="text-sm text-gray-700">Récurrence</Label>
                  <select id="pp-frequence" value={form.frequence} onChange={(e) => setForm({ ...form, frequence: e.target.value })} className={SELECT}>
                    {FREQUENCES.map((f) => <option key={f} value={f}>{FREQUENCE_LABELS[f]}</option>)}
                  </select>
                </div>
                {form.frequence !== 'none' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="pp-nombre" className="text-sm text-gray-700">Nombre de dates ({OCCURRENCES_MAX} max)</Label>
                    <Input id="pp-nombre" type="number" min={2} max={OCCURRENCES_MAX} step={1} inputMode="numeric" {...champ('nombre')} className="rounded-xl bg-white" />
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.creer_slide} onChange={(e) => setForm({ ...form, creer_slide: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#e97e42]" />
                <span>
                  Créer un slide sur la page d’accueil
                  <span className="block text-xs text-muted-foreground">Titre, date, lieu, image de la formation et bouton d’inscription.</span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 accent-[#e97e42]" />
                Publier tout de suite (ouvert aux inscriptions)
              </label>
            </div>

            {erreur && <p role="alert" className="mt-3 text-sm text-red-600">{erreur}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
              <Button onClick={enregistrer} disabled={saving} className="bg-[#e97e42] text-white hover:bg-[#d56a2e]">
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Programmer
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
