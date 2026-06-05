export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUsersTable, type AdminUserRow } from '@/components/admin/AdminUsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : { data: null }
  const isSuperAdmin = me?.role === 'super_admin'

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email, role, account_type, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Utilisateurs</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {(profiles ?? []).length} comptes
          {isSuperAdmin ? " · vous pouvez vous connecter en tant que n'importe quel utilisateur" : ''}
        </p>
      </div>
      <AdminUsersTable users={(profiles ?? []) as AdminUserRow[]} isSuperAdmin={isSuperAdmin} />
    </div>
  )
}
