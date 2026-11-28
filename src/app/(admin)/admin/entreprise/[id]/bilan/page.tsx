export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { BilanView } from '@/components/entreprise/BilanView'
import { requireAdmin } from '@/lib/auth/require-admin'
import { preparerBilan } from '@/lib/entreprise/bilan-acces'
import { estUuid } from '@/lib/entreprise/dossier-regles'
import { createAdminClient } from '@/lib/supabase/admin'

/** Admin — aperçu de la page de bilan telle que la direction la verra si elle est envoyée maintenant. */
export default async function AdminEntrepriseBilanApercuPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!estUuid(id)) notFound()
  const prepare = await preparerBilan(createAdminClient(), id)
  if (!prepare) notFound()

  return (
    <div className="max-w-4xl space-y-4">
      <Link href={`/admin/entreprise/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#a84d16]">
        <ArrowLeft className="h-4 w-4" />
        {prepare.entreprise.nom_entreprise}
      </Link>
      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Aperçu : c’est la page que la direction verra si le bilan est envoyé maintenant. Seules les formations « retenues » y figurent.
      </p>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <BilanView bilan={prepare.bilan} />
      </div>
    </div>
  )
}
