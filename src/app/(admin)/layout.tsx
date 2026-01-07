import { AdminHeader } from '@/components/layout/admin-header'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
           <AdminSidebar className="h-[calc(100vh-3.5rem)] border-none" />
        </aside>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
            {children}
        </main>
      </div>
    </div>
  )
}
