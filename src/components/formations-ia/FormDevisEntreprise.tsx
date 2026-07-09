'use client'

import { useState } from 'react'
import { CheckCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PHONE_REGEX, normalizePhone, WHATSAPP_NUMBER } from '@/lib/formations-ia'

const formationsChoix = [
  { code: 'F1', label: 'F1 — IA : Les Bases' },
  { code: 'F2', label: 'F2 — IA & Communication' },
  { code: 'F3', label: 'F3 — IA & Administratif' },
  { code: 'F4', label: 'F4 — IA & Direction (Executive)' },
]

/**
 * Formulaire de lead entreprise (devis intra).
 * variant="entretien-f4" : formulaire court de demande d'entretien F4.
 */
export function FormDevisEntreprise({
  variant = 'devis',
}: {
  variant?: 'devis' | 'entretien-f4'
}) {
  const isF4 = variant === 'entretien-f4'
  const [societe, setSociete] = useState('')
  const [contact, setContact] = useState('')
  const [fonction, setFonction] = useState('')
  const [telephone, setTelephone] = useState('+241')
  const [effectif, setEffectif] = useState('')
  const [selection, setSelection] = useState<string[]>(isF4 ? ['F4'] : [])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (code: string) =>
    setSelection((sel) =>
      sel.includes(code) ? sel.filter((c) => c !== code) : [...sel, code]
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const tel = normalizePhone(telephone)
    if (!PHONE_REGEX.test(tel)) {
      setError('Numéro invalide : format +241 suivi de 8 ou 9 chiffres.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('fia_leads_entreprises')
        .insert({
          societe: societe.trim(),
          contact: contact.trim(),
          fonction: fonction.trim() || null,
          telephone: tel,
          effectif: effectif || null,
          formations: isF4 ? ['F4'] : selection,
          message:
            (isF4 ? "Demande d'entretien F4 Executive. " : '') + message.trim(),
        })
      if (insertError) throw insertError
      setSent(true)
    } catch {
      setError(
        'Envoi momentanément indisponible — contactez-nous directement sur WhatsApp.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-[0_10px_30px_rgba(20,24,40,0.10)]">
        <CheckCircle className="mb-3 h-10 w-10 text-[#0d9488]" />
        <h3 className="font-heading text-xl font-extrabold text-[#141828]">
          Demande envoyée
        </h3>
        <p className="mt-2 max-w-sm text-sm text-[#4a5068]">
          {isF4
            ? 'Notre équipe vous recontacte sous 48 h pour convenir d’un entretien.'
            : 'Devis sous 48 h. Notre équipe vous recontacte sur WhatsApp pour cadrer le programme.'}
        </p>
      </div>
    )
  }

  const waText = encodeURIComponent(
    isF4
      ? "Bonjour Studia Academy, je souhaite un entretien au sujet de la formation F4 Executive — IA & Direction."
      : 'Bonjour Studia Academy, je souhaite un devis pour former mes équipes à l’IA.'
  )
  const inputCls =
    'w-full rounded-xl border border-[#e3e5f0] bg-white px-3 py-2.5 text-sm text-[#141828] focus:border-[#141828] focus:outline-none focus:ring-2 focus:ring-[#141828]/10'
  const labelCls = 'mb-1 block text-sm font-semibold text-[#141828]'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-societe" className={labelCls}>
            {isF4 ? 'Organisation *' : 'Société *'}
          </label>
          <input id="lead-societe" required value={societe}
            onChange={(e) => setSociete(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-contact" className={labelCls}>Nom du contact *</label>
          <input id="lead-contact" required value={contact}
            onChange={(e) => setContact(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-fonction" className={labelCls}>Fonction{isF4 ? ' *' : ''}</label>
          <input id="lead-fonction" required={isF4} value={fonction}
            onChange={(e) => setFonction(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lead-tel" className={labelCls}>Téléphone *</label>
          <input id="lead-tel" required inputMode="tel" value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className={inputCls} placeholder="+241 06 XX XX XX" />
        </div>
      </div>

      {!isF4 && (
        <>
          <div>
            <label htmlFor="lead-effectif" className={labelCls}>Effectif à former</label>
            <select id="lead-effectif" value={effectif}
              onChange={(e) => setEffectif(e.target.value)} className={inputCls}>
              <option value="">Choisir</option>
              <option value="3-5">3 à 5 personnes</option>
              <option value="6-10">6 à 10 personnes</option>
              <option value="11-15">11 à 15 personnes</option>
              <option value="15+">Plus de 15 personnes</option>
            </select>
          </div>
          <div>
            <span className={labelCls}>Formations souhaitées</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {formationsChoix.map((f) => (
                <label
                  key={f.code}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    selection.includes(f.code)
                      ? 'border-[#141828] bg-[#141828] text-white'
                      : 'border-[#e3e5f0] bg-white text-[#4a5068]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selection.includes(f.code)}
                    onChange={() => toggle(f.code)}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <label htmlFor="lead-message" className={labelCls}>
          {isF4 ? 'Vos enjeux (confidentiel)' : 'Votre besoin'}
        </label>
        <textarea id="lead-message" rows={4} value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputCls} resize-none`}
          placeholder={isF4
            ? 'Contexte, taille de l’organisation, échéances…'
            : 'Contexte, calendrier souhaité, objectifs…'} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{' '}
          <a className="font-bold underline" target="_blank" rel="noopener noreferrer"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}>
            Ouvrir WhatsApp
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#f5b301] px-6 py-3.5 text-sm font-extrabold text-[#141828] transition-opacity disabled:opacity-60"
      >
        {loading ? 'Envoi…' : isF4 ? 'Demander un entretien' : 'Demander un devis'}
        <Send className="h-4 w-4" />
      </button>
    </form>
  )
}
