export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DevisView } from '@/components/entreprise/DevisView'
import { requireAdmin } from '@/lib/auth/require-admin'
import { STATUT_DEVIS_LABELS } from '@/lib/entreprise/devis'
import { lireDevisAdmin } from '@/lib/entreprise/devis-acces'
import { estUuid } from '@/lib/entreprise/dossier-regles'
import { createAdminClient } from '@/lib/supabase/admin'

/** Admin — aperçu d'un devis tel que le contact de l'entreprise le verra. */
export default async function AdminEntrepriseDevisApercuPage({ params }: { params: Promise<{ id: string; devisId: string }> }) {
  await requireAdmin()
  const { id, devisId } = await params
  if (!estUuid(id) || !estUuid(devisId)) notFound()
  const devis = await lireDevisAdmin(createAdminClient(), id, devisId)
  if (!devis?.contenu) notFound()

  return (
    <div className="max-w-4xl space-y-4">
      <Link href={`/admin/entreprise/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#a84d16]">
        <ArrowLeft className="h-4 w-4" />
        {devis.contenu.entreprise}
      </Link>
      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Aperçu du devis {devis.numero} ({STATUT_DEVIS_LABELS[devis.statut].toLowerCase()}) : c’est la page que verra le contact.
        {devis.statut === 'brouillon' ? ' Sa date et sa validité seront celles du jour de l’envoi.' : ''}
      </p>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <DevisView devis={devis.contenu} />
      </div>
    </div>
  )
}
