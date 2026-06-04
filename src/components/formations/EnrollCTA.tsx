'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle, Clock, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { requestEnrollment, enrollFree } from '@/lib/formations/actions'
import type { EnrollmentStatus } from '@/types/formation'

interface Props {
  formationId: string
  formationSlug: string
  isLoggedIn: boolean
  enrollmentStatus: EnrollmentStatus | null
  isFree?: boolean
}

export function EnrollCTA({ formationId, formationSlug, isLoggedIn, enrollmentStatus, isFree = false }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ phone: '', message: '' })

  // Accès accordé → bouton commencer
  if (enrollmentStatus === 'active' || enrollmentStatus === 'completed') {
    return (
      <Link href={`/apprendre/${formationSlug}`}>
        <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6 text-base font-semibold">
          <PlayCircle className="w-5 h-5 mr-2" />
          Commencer la formation
        </Button>
      </Link>
    )
  }

  // ── Formation GRATUITE : accès direct, juste un compte Studia ──
  if (isFree) {
    if (!isLoggedIn) {
      return (
        <div className="space-y-2">
          <Link href={`/signup?redirect=/formations/en-ligne/${formationSlug}`}>
            <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6 text-base font-semibold">
              Créer un compte gratuit
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href={`/login?redirect=/formations/en-ligne/${formationSlug}`} className="block text-center text-sm text-gray-500 hover:text-[#e97e42]">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      )
    }
    const startFree = async () => {
      setLoading(true)
      const res = await enrollFree(formationId)
      setLoading(false)
      if (res.success) router.push(`/apprendre/${formationSlug}`)
      else alert(res.error || 'Erreur')
    }
    return (
      <Button
        onClick={startFree}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6 text-base font-semibold"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlayCircle className="w-5 h-5 mr-2" />Accéder gratuitement</>}
      </Button>
    )
  }

  // Demande en attente
  if (enrollmentStatus === 'pending' || done) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-amber-800">Demande envoyée</p>
        <p className="text-xs text-amber-700 mt-1">
          Notre équipe vous recontacte sous 24h pour finaliser votre accès.
        </p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/login?redirect=/formations/en-ligne/${formationSlug}`}>
        <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6 text-base font-semibold">
          Se connecter pour s'inscrire
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    )
  }

  const submit = async () => {
    setLoading(true)
    const res = await requestEnrollment({
      formation_id: formationId,
      phone: form.phone,
      message: form.message || undefined,
    })
    setLoading(false)
    if (res.success) {
      setDone(true)
      router.refresh()
    } else {
      alert(res.error || 'Erreur')
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl py-6 text-base font-semibold"
      >
        Demander l'accès
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm text-gray-700">Votre WhatsApp *</label>
        <Input
          placeholder="+241 06 XX XX XX"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42]"
        />
      </div>
      <Textarea
        placeholder="Une question ? (optionnel)"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        rows={2}
        className="rounded-xl border-[#e2e8f0] focus:border-[#e97e42] resize-none text-sm"
      />
      <Button
        onClick={submit}
        disabled={!form.phone || loading}
        className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Envoyer ma demande</>}
      </Button>
      <p className="text-xs text-gray-400 text-center">
        Sans engagement · réponse sous 24h
      </p>
    </div>
  )
}
