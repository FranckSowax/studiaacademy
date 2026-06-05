'use client'

import { useState } from 'react'
import { Search, LogIn, Loader2, Shield, GraduationCap, Building2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { impersonateUser } from '@/lib/admin/impersonate'

export interface AdminUserRow {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  account_type: string | null
  created_at: string
}

const typeMeta: Record<string, { label: string; icon: typeof User; cls: string }> = {
  student: { label: 'Étudiant', icon: User, cls: 'bg-gray-100 text-gray-600' },
  teacher: { label: 'Professeur', icon: GraduationCap, cls: 'bg-blue-50 text-blue-600' },
  pro: { label: 'Pro', icon: Building2, cls: 'bg-violet-50 text-violet-600' },
}

export function AdminUsersTable({ users, isSuperAdmin }: { users: AdminUserRow[]; isSuperAdmin: boolean }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const filtered = users.filter((u) =>
    (u.full_name ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const impersonate = async (u: AdminUserRow) => {
    if (!confirm(`Se connecter en tant que ${u.full_name || u.email} ? Vous serez déconnecté de votre session admin.`)) return
    setBusy(u.id)
    const r = await impersonateUser(u.id)
    if (r.success && r.link) window.location.href = r.link
    else { alert(r.error || 'Erreur'); setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Rechercher un utilisateur…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="divide-y">
          {filtered.map((u) => {
            const tm = typeMeta[u.account_type ?? 'student'] ?? typeMeta.student
            const TIcon = tm.icon
            return (
              <div key={u.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e97e42]/25 to-[#7C3AED]/20 flex items-center justify-center font-bold text-[#a84d16] flex-shrink-0">
                    {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.full_name || '—'}</p>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tm.cls}`}><TIcon className="w-3 h-3" />{tm.label}</span>
                  {(u.role === 'admin' || u.role === 'super_admin') && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600"><Shield className="w-3 h-3" />{u.role === 'super_admin' ? 'Super admin' : 'Admin'}</span>
                  )}
                  {isSuperAdmin && (
                    <Button size="sm" variant="outline" onClick={() => impersonate(u)} disabled={busy === u.id} className="rounded-xl">
                      {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4 mr-1" />Se connecter</>}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">Aucun utilisateur.</p>}
        </div>
      </div>
    </div>
  )
}
