'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Plus, Trash2, Loader2, X, ChevronDown, ChevronUp, UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createClasse, deleteClasse, addClassStudent, deleteClassStudent,
} from '@/app/(professeur)/actions'
import type { Classe, ClassStudent } from '@/types/teacher'

export function ClassesManager({
  initialClasses,
  initialStudents,
}: {
  initialClasses: Classe[]
  initialStudents: ClassStudent[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '', niveau: '', annee_scolaire: '2025-2026', nb_eleves: 0,
  })

  const studentsByClass = (classId: string) =>
    initialStudents.filter((s) => s.class_id === classId)

  const submit = async () => {
    setSaving(true)
    const res = await createClasse(form)
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setForm({ nom: '', niveau: '', annee_scolaire: '2025-2026', nb_eleves: 0 })
      router.refresh()
    } else {
      alert(res.error || 'Erreur')
    }
  }

  const removeClasse = async (id: string) => {
    if (!confirm('Supprimer cette classe et ses élèves ?')) return
    await deleteClasse(id)
    router.refresh()
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Mes classes</h1>
          <p className="text-gray-500 mt-1">
            Créez vos classes et leur registre d'élèves (réutilisé en correction)
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#10B981] to-emerald-600 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nouvelle classe
        </Button>
      </div>

      {/* Modal création classe */}
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
                  <Label className="text-sm text-gray-700">Année scolaire</Label>
                  <Input
                    value={form.annee_scolaire}
                    onChange={(e) => setForm({ ...form, annee_scolaire: e.target.value })}
                    className="rounded-xl border-[#e2e8f0]"
                  />
                </div>
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
            Créez vos classes et ajoutez-y vos élèves pour les retrouver lors des corrections.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialClasses.map((c) => {
            const students = studentsByClass(c.id)
            const isOpen = expanded === c.id
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-[#f0ebe3] overflow-hidden">
                <div className="flex items-center justify-between p-5">
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold font-heading text-gray-900">{c.nom}</h3>
                      <p className="text-sm text-gray-500">
                        {c.niveau ? `${c.niveau} · ` : ''}{students.length} élève{students.length > 1 ? 's' : ''} · {c.annee_scolaire}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeClasse(c.id)}
                      className="text-gray-300 hover:text-red-500 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="text-gray-400 p-1"
                    >
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <StudentRoster classId={c.id} students={students} onChange={() => router.refresh()} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StudentRoster({
  classId,
  students,
  onChange,
}: {
  classId: string
  students: ClassStudent[]
  onChange: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ prenom: '', nom: '', eleve_phone: '', parent_phone: '' })

  const add = async () => {
    setSaving(true)
    const res = await addClassStudent({ class_id: classId, ...form })
    setSaving(false)
    if (res.success) {
      setForm({ prenom: '', nom: '', eleve_phone: '', parent_phone: '' })
      setAdding(false)
      onChange()
    } else {
      alert(res.error || 'Erreur')
    }
  }

  const remove = async (id: string) => {
    await deleteClassStudent(id, classId)
    onChange()
  }

  return (
    <div className="border-t border-[#f0ebe3] p-5 bg-[#fbf8f3]">
      {students.length > 0 ? (
        <div className="space-y-2 mb-4">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-[#f0ebe3]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-xs font-semibold text-emerald-600">
                  {s.prenom[0]}{s.nom[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.prenom} {s.nom}</p>
                  {(s.eleve_phone || s.parent_phone) && (
                    <p className="text-xs text-gray-400">
                      {s.eleve_phone && `Élève: ${s.eleve_phone}`}
                      {s.eleve_phone && s.parent_phone && ' · '}
                      {s.parent_phone && `Parent: ${s.parent_phone}`}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => remove(s.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">Aucun élève dans cette classe.</p>
      )}

      {adding ? (
        <div className="bg-white rounded-xl p-4 border border-[#f0ebe3] space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Prénom *" value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              className="rounded-lg border-[#e2e8f0]" />
            <Input placeholder="Nom *" value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="rounded-lg border-[#e2e8f0]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="WhatsApp élève (+241)" value={form.eleve_phone}
              onChange={(e) => setForm({ ...form, eleve_phone: e.target.value })}
              className="rounded-lg border-[#e2e8f0]" />
            <Input placeholder="WhatsApp parent" value={form.parent_phone}
              onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
              className="rounded-lg border-[#e2e8f0]" />
          </div>
          <div className="flex gap-2">
            <Button onClick={add} disabled={!form.prenom || !form.nom || saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
            </Button>
            <Button variant="outline" onClick={() => setAdding(false)} className="rounded-lg border-[#e2e8f0] text-sm">
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border-dashed border-[#e2e8f0] text-gray-600 text-sm"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Ajouter un élève
        </Button>
      )}
    </div>
  )
}
