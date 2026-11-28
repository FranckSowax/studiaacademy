export const dynamic = 'force-dynamic'

import { AlertTriangle, Award, GraduationCap, UserCheck, UserPlus, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/require-admin'
import { chargerUtilisateurs } from '@/lib/admin/users-data'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { lireEtiquettesEntreprise } from '@/lib/entreprise/dossier'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminUsersPage() {
  const { role } = await requireAdmin()
  const isSuperAdmin = role === 'super_admin'
  const [{ utilisateurs, formations, chiffres, indisponibles }, entreprises] = await Promise.all([
    chargerUtilisateurs(),
    lireEtiquettesEntreprise(createAdminClient()),
  ])

  const cartes = [
    { icon: Users, label: 'Comptes', valeur: chiffres.comptes },
    { icon: UserPlus, label: 'Nouveaux (30 jours)', valeur: chiffres.nouveaux30j },
    { icon: UserCheck, label: 'Actifs (7 jours)', valeur: chiffres.actifs7j },
    { icon: GraduationCap, label: 'Inscrits à une formation', valeur: chiffres.avecFormation },
    { icon: Award, label: 'Formations terminées', valeur: chiffres.formationsTerminees },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Utilisateurs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi des comptes : formations, progression, provenance et activité. Cliquez sur un utilisateur pour ouvrir sa fiche.
          {isSuperAdmin ? " Vous pouvez aussi vous connecter en tant que n'importe quel utilisateur." : ''}
        </p>
      </div>

      {indisponibles.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Certaines données n&apos;ont pas pu être lues ({indisponibles.join(', ')}) : les chiffres qui en dépendent
            sont incomplets.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cartes.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7ed]">
              <c.icon className="h-4 w-4 text-[#e97e42]" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{c.valeur}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <AdminUsersTable users={utilisateurs} formations={formations} isSuperAdmin={isSuperAdmin} entreprises={entreprises} />
    </div>
  )
}
