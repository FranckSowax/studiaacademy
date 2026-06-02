'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { activateTeacherMode } from '@/app/(professeur)/actions'

const MATIERES = [
  'Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'SVT',
  'Histoire-Géographie', 'Philosophie', 'Économie', 'Informatique',
  'Espagnol', 'Allemand', 'EPS', 'Arts', 'Autre',
]

const NIVEAUX = ['Collège', 'Lycée', 'Université', 'Formation professionnelle']

export function ActivateTeacher() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    matiere: '',
    niveau_enseignement: '',
    etablissement: '',
    ville: 'Libreville',
  })

  const canNext =
    (step === 1 && form.matiere) ||
    (step === 2 && form.niveau_enseignement) ||
    step === 3

  const handleSubmit = async () => {
    setLoading(true)
    const res = await activateTeacherMode(form)
    setLoading(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || 'Erreur lors de l\'activation')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf8f3] px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#f0ebe3] p-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#e97e42]/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Activer l'espace professeur
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Correction de copies par IA et génération de devoirs QCM
          </p>
        </div>

        {/* Progression */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-[#e97e42]' : s < step ? 'w-8 bg-[#e97e42]/40' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Étape 1 — Matière */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Quelle matière enseignez-vous ?</h2>
            <div className="grid grid-cols-2 gap-2">
              {MATIERES.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, matiere: m })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                    form.matiere === m
                      ? 'border-[#e97e42] bg-[#fff7ed] text-[#a84d16]'
                      : 'border-[#f0ebe3] text-gray-600 hover:border-[#e97e42]/40'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 — Niveau */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">À quel niveau ?</h2>
            <div className="space-y-2">
              {NIVEAUX.map((n) => (
                <button
                  key={n}
                  onClick={() => setForm({ ...form, niveau_enseignement: n })}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left flex items-center justify-between ${
                    form.niveau_enseignement === n
                      ? 'border-[#e97e42] bg-[#fff7ed] text-[#a84d16]'
                      : 'border-[#f0ebe3] text-gray-600 hover:border-[#e97e42]/40'
                  }`}
                >
                  {n}
                  {form.niveau_enseignement === n && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 3 — Établissement */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Votre établissement</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="etablissement" className="text-sm text-gray-700">
                  Nom de l'établissement (optionnel)
                </Label>
                <Input
                  id="etablissement"
                  placeholder="Ex: Lycée Léon Mba"
                  value={form.etablissement}
                  onChange={(e) => setForm({ ...form, etablissement: e.target.value })}
                  className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ville" className="text-sm text-gray-700">Ville</Label>
                <Input
                  id="ville"
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="rounded-xl border-[#e2e8f0]"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl disabled:opacity-50"
            >
              Continuer
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl"
            >
              {loading ? 'Activation...' : 'Activer mon espace professeur'}
              <Check className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
