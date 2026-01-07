'use client'

import { StudiaSidebar } from '@/components/dashboard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-300 to-amber-200 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <StudiaSidebar />

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
