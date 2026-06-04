'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCompanyProfile } from '@/lib/entreprise/actions'

export function CompanyOnboarding() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom_entreprise: '', secteur: '', effectif_estime: '', ville: 'Libreville', contact_nom: '', contact_phone: '' })

  const submit = async () => {
    setSaving(true)
    const res = await saveCompanyProfile(form)
    setSaving(false)
    if (res.success) router.refresh()
    else alert(res.error || 'Erreur')
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-3"><Building2 className="w-7 h-7 text-[#7C3AED]" /></div>
        <h1 className="text-2xl font-bold font-heading text-gray-900">Votre espace entreprise</h1>
        <p className="text-gray-500 mt-1">Renseignez votre entreprise pour lancer un diagnostic.</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#f0ebe3] p-6 space-y-4">
        <div className="space-y-1.5"><Label className="text-sm">Nom de l&apos;entreprise *</Label><Input value={form.nom_entreprise} onChange={(e) => setForm({ ...form, nom_entreprise: e.target.value })} className="rounded-xl" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-sm">Secteur</Label><Input placeholder="Banque, télécom…" value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value })} className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label className="text-sm">Effectif</Label><Input placeholder="Ex: 25" value={form.effectif_estime} onChange={(e) => setForm({ ...form, effectif_estime: e.target.value })} className="rounded-xl" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-sm">Ville</Label><Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label className="text-sm">Contact (WhatsApp)</Label><Input placeholder="+241…" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="rounded-xl" /></div>
        </div>
        <Button onClick={submit} disabled={!form.nom_entreprise || saving} className="w-full bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}
