export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { SlidesManager, type SlideRow } from '@/components/admin/SlidesManager'

export default async function AdminSlidesPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('entreprise_slides')
    .select('*')
    .order('ordre', { ascending: true })

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/entreprise" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#7C3AED]"><ArrowLeft className="w-4 h-4" />Espace Entreprise</Link>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Slides du hero — /entreprise</h2>
        <p className="text-muted-foreground text-sm mt-1">Gérez le carrousel défilant : images, textes, ordre et visibilité.</p>
      </div>
      <SlidesManager initial={(data ?? []) as SlideRow[]} />
    </div>
  )
}
