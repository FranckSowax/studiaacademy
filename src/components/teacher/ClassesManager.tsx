'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Trash2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClasse, deleteClasse } from '@/app/(professeur)/actions'
import type { Classe } from '@/types/teacher'

export function ClassesManager({ initialClasses }: { initialClasses: Classe[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    niveau: '',
    annee_scolaire: '2025-2026',
    nb_eleves: 30,
  })

  const submit = async () => {
    setSaving(true)
    const res = await createClasse(form)
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setForm({ nom: '', niveau: '', annee_scolaire: '2025-2026', nb_eleves: 30 })
      router.refresh()
    } else {
      alert(res.error || 'Erreur')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette classe ?')) return
    await deleteClasse(id)
    router.refresh()
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Mes classes</h1>
          <p className="text-gray-500 mt-1">Organisez vos élèves par classe</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#10B981] to-emerald-600 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nouvelle classe
        </Button>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold font-heading text-gray-900">Nouvelle classe</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Nom de la classe *</Label>
                <Input
                  placeholder="Ex: 3ème B"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="rounded-xl border-[#e2e8f0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Niveau</Label>
                  <Input
                    placeholder="3ème"
                    value={form.niveau}
                    onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                    className="rounded-xl border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-700">Nb d'élèves</Label>
                  <Input
                    type="number"
                    value={form.nb_eleves}
                    onChange={(e) => setForm({ ...form, nb_eleves: Number(e.target.value) })}
                    className="rounded-xl border-[#e2e8f0]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-700">Année scolaire</Label>
                <Input
                  value={form.annee_scolaire}
                  onChange={(e) => setForm({ ...form, annee_scolaire: e.target.value })}
                  className="rounded-xl border-[#e2e8f0]"
                />
              </div>
              <Button
                onClick={submit}
                disabled={!form.nom || saving}
                className="w-full bg-gradient-to-r from-[#10B981] to-emerald-600 text-white rounded-xl"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer la classe'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {initialClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3] text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Aucune classe</h3>
          <p className="text-gray-500 max-w-sm">
            Créez vos classes pour organiser vos corrections et vos devoirs QCM.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialClasses.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-[#f0ebe3] p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <button
                  onClick={() => remove(c.id)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold font-heading text-gray-900">{c.nom}</h3>
              <p className="text-sm text-gray-500">
                {c.niveau} · {c.nb_eleves} élèves
              </p>
              <p className="text-xs text-gray-400 mt-1">{c.annee_scolaire}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
