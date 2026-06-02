'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Brain, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateCorrectionWizard } from '@/app/(professeur)/actions'
import type { WizardConfig, LearnedPatterns } from '@/types/teacher'

interface Props {
  initialConfig: WizardConfig
  patterns: LearnedPatterns
  version: number
}

const OPTIONS = {
  severite: [
    { value: 'bienveillant', label: 'Bienveillant', desc: 'Valorise les efforts' },
    { value: 'standard', label: 'Standard', desc: 'Notation équilibrée' },
    { value: 'strict', label: 'Strict', desc: 'Exigence élevée' },
  ],
  points_partiels: [
    { value: 'tout_ou_rien', label: 'Tout ou rien', desc: 'Juste ou faux' },
    { value: 'demi_points', label: 'Demi-points', desc: 'Réponses partielles' },
    { value: 'fraction_libre', label: 'Points fractionnés', desc: 'Granularité fine' },
  ],
  tolerance_ortho: [
    { value: 'aucune', label: 'Aucune', desc: 'Orthographe pénalisée' },
    { value: 'mineure', label: 'Tolérante', desc: 'Fautes mineures OK' },
    { value: 'moderee', label: 'Souple', desc: 'Focus sur le fond' },
  ],
}

export function CorrectionProfilForm({ initialConfig, patterns, version }: Props) {
  const [config, setConfig] = useState<WizardConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await updateCorrectionWizard(config)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/professeur/correction"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e97e42] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      <h1 className="text-2xl font-bold font-heading text-gray-900 mb-1">
        Profil de correction
      </h1>
      <p className="text-gray-500 mb-6">
        Configurez comment l'IA doit corriger selon votre méthode.
      </p>

      {/* Statut apprentissage */}
      <div className="bg-gradient-to-r from-[#fff7ed] to-white border border-[#f0ebe3] rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#e97e42]/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-[#e97e42]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            Apprentissage IA — Version {version}
          </p>
          <p className="text-sm text-gray-500">
            {version === 0
              ? "L'IA utilise vos réglages. Elle s'affinera après vos premières corrections validées."
              : `L'IA a appris de vos corrections validées. Confiance : ${Math.round((patterns.score_confiance ?? 0) * 100)}%`}
          </p>
        </div>
      </div>

      {/* Réglages */}
      <div className="space-y-6 bg-white rounded-2xl border border-[#f0ebe3] p-6">
        {(['severite', 'points_partiels', 'tolerance_ortho'] as const).map((key) => (
          <div key={key}>
            <p className="font-semibold text-gray-800 mb-3 capitalize">
              {key === 'severite' && 'Sévérité de notation'}
              {key === 'points_partiels' && 'Attribution des points'}
              {key === 'tolerance_ortho' && 'Tolérance orthographe'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {OPTIONS[key].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setConfig({ ...config, [key]: opt.value })}
                  className={`px-3 py-3 rounded-xl border text-left transition-all ${
                    config[key] === opt.value
                      ? 'border-[#e97e42] bg-[#fff7ed]'
                      : 'border-[#f0ebe3] hover:border-[#e97e42]/40'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Valorise démarche */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="font-semibold text-gray-800">Valoriser la démarche</p>
            <p className="text-sm text-gray-500">
              Accorder des points si la méthode est bonne même avec un résultat faux
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, valorise_demarche: !config.valorise_demarche })}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              config.valorise_demarche ? 'bg-[#e97e42]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                config.valorise_demarche ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="mt-6 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4 mr-1" />
        ) : (
          <Save className="w-4 h-4 mr-1" />
        )}
        {saved ? 'Enregistré' : 'Enregistrer le profil'}
      </Button>
    </div>
  )
}
