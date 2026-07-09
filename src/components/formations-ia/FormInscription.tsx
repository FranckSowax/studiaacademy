'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  PHONE_REGEX,
  WHATSAPP_NUMBER,
  fcfa,
  formatDateFr,
  normalizePhone,
  type SessionIA,
} from '@/lib/formations-ia'

interface FormationOption {
  slug: string
  code: string
  titre: string
  prixFcfa: number | null
  prixGroupeFcfa: number | null
  from: string
}

const sources = ['WhatsApp', 'Facebook', 'Instagram', 'Recommandation', 'Autre']

export function FormInscription({
  formations,
  sessionsBySlug,
  initialSlug,
  initialSessionId,
}: {
  formations: FormationOption[]
  sessionsBySlug: Record<string, SessionIA[]>
  initialSlug?: string
  initialSessionId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const utm = useMemo(() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    const out: Record<string, string> = {}
    keys.forEach((k) => {
      const v = searchParams.get(k)
      if (v) out[k] = v
    })
    return out
  }, [searchParams])

  const defaultSlug =
    formations.find((f) => f.slug === initialSlug)?.slug ?? formations[0]?.slug ?? ''

  const [slug, setSlug] = useState(defaultSlug)
  const [sessionId, setSessionId] = useState(initialSessionId ?? '')
  const [type, setType] = useState<'individuel' | 'entreprise'>('individuel')
  const [societe, setSociete] = useState('')
  const [nbParticipants, setNbParticipants] = useState(1)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [fonction, setFonction] = useState('')
  const [telephone, setTelephone] = useState('+241')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formation = formations.find((f) => f.slug === slug)
  const sessions = sessionsBySlug[slug] ?? []
  const session = sessions.find((s) => s.id === sessionId) ?? null

  const groupe = type === 'entreprise' && nbParticipants >= 3
  const prixUnitaire = formation
    ? groupe
      ? formation.prixGroupeFcfa ?? formation.prixFcfa
      : formation.prixFcfa
    : null
  const montant =
    prixUnitaire != null ? prixUnitaire * Math.max(nbParticipants, 1) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const tel = normalizePhone(telephone)
    if (!PHONE_REGEX.test(tel)) {
      setError('Numéro WhatsApp invalide : format +241 suivi de 8 ou 9 chiffres.')
      return
    }
    if (!sessionId || sessionId.startsWith('fallback-')) {
      setError('Veuillez choisir une session.')
      return
    }
    if (type === 'entreprise' && !societe.trim()) {
      setError('Le nom de la société est requis pour une inscription entreprise.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('fia_inscrire', {
        p_session_id: sessionId,
        p_type: type,
        p_societe: type === 'entreprise' ? societe : null,
        p_nb_participants: type === 'entreprise' ? nbParticipants : 1,
        p_nom: nom,
        p_prenom: prenom,
        p_fonction: fonction || null,
        p_telephone: tel,
        p_email: email || null,
        p_source: source || null,
        p_utm: utm,
      })
      if (rpcError) throw rpcError

      const code = Array.isArray(data) ? data[0]?.code_public : undefined
      const params = new URLSearchParams({
        code: code ?? '',
        f: slug,
        d: session?.date ?? '',
        type,
        nb: String(type === 'entreprise' ? nbParticipants : 1),
      })
      router.push(`/formations-ia/merci?${params.toString()}`)
    } catch {
      setError(
        "L'inscription en ligne est momentanément indisponible. Contactez-nous directement sur WhatsApp, nous créons votre dossier en 2 minutes."
      )
      setLoading(false)
    }
  }

  const waText = encodeURIComponent(
    `Bonjour Studia Academy, je souhaite m'inscrire à la formation ${formation?.titre ?? ''}${session ? ` du ${formatDateFr(session.date)}` : ''}.`
  )

  const inputCls =
    'w-full rounded-xl border border-[#e3e5f0] bg-white px-3 py-2.5 text-sm text-[#141828] focus:border-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4338ca]/15'
  const labelCls = 'mb-1 block text-sm font-semibold text-[#141828]'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Formation + session */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fia-formation" className={labelCls}>Formation *</label>
          <select
            id="fia-formation"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSessionId('')
            }}
            className={inputCls}
          >
            {formations.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.code} — {f.titre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fia-session" className={labelCls}>Session *</label>
          <select
            id="fia-session"
            required
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className={inputCls}
          >
            <option value="">Choisir une date</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDateFr(s.date)}
                {s.placesRestantes != null ? ` · ${s.placesRestantes} places` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type */}
      <div>
        <span className={labelCls}>Vous vous inscrivez en tant que *</span>
        <div className="flex gap-2">
          {(['individuel', 'entreprise'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                type === t
                  ? 'border-[#141828] bg-[#141828] text-white'
                  : 'border-[#e3e5f0] bg-white text-[#4a5068]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {type === 'entreprise' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fia-societe" className={labelCls}>Nom de la société *</label>
            <input id="fia-societe" required value={societe}
              onChange={(e) => setSociete(e.target.value)}
              className={inputCls} placeholder="Votre entreprise" />
          </div>
          <div>
            <label htmlFor="fia-nb" className={labelCls}>Nombre de participants *</label>
            <input id="fia-nb" type="number" min={1} max={15} required
              value={nbParticipants}
              onChange={(e) => setNbParticipants(Number(e.target.value))}
              className={inputCls} />
            <p className="mt-1 text-xs text-[#4a5068]">−15 % à partir de 3 participants.</p>
          </div>
        </div>
      )}

      {/* Identité */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fia-nom" className={labelCls}>Nom *</label>
          <input id="fia-nom" required value={nom}
            onChange={(e) => setNom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fia-prenom" className={labelCls}>Prénom *</label>
          <input id="fia-prenom" required value={prenom}
            onChange={(e) => setPrenom(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fia-fonction" className={labelCls}>Fonction</label>
          <input id="fia-fonction" value={fonction}
            onChange={(e) => setFonction(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fia-tel" className={labelCls}>Téléphone WhatsApp *</label>
          <input id="fia-tel" required inputMode="tel" value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className={inputCls} placeholder="+241 06 XX XX XX" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fia-email" className={labelCls}>E-mail (optionnel)</label>
          <input id="fia-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fia-source" className={labelCls}>Comment avez-vous connu Studia ?</label>
          <select id="fia-source" value={source}
            onChange={(e) => setSource(e.target.value)} className={inputCls}>
            <option value="">Choisir</option>
            {sources.map((s) => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Récap montant */}
      {montant != null && (
        <div className="rounded-xl bg-[#f7f8fc] px-4 py-3 text-sm">
          <span className="text-[#4a5068]">Montant à régler par Mobile Money : </span>
          <b className="text-[#141828]">{fcfa(montant)}</b>
          {groupe && <span className="ml-1 text-[#0d9488]">(tarif groupe −15 %)</span>}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#141828] px-6 py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
        >
          {loading ? 'Envoi…' : "Valider mon inscription"}
          <Send className="h-4 w-4" />
        </button>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-500 px-6 py-3.5 text-sm font-bold text-green-600"
        >
          <MessageCircle className="h-4 w-4" />
          S&apos;inscrire via WhatsApp
        </a>
      </div>

      <p className="text-xs text-[#4a5068]">
        Aucun paiement en ligne : votre inscription crée un dossier « en attente
        de paiement ». Vous recevez immédiatement le code de référence et les
        numéros Mobile Money (Airtel / Moov).
      </p>
    </form>
  )
}
