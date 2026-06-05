'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { ProSidebar } from './ProSidebar'

export function ProLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen bg-white">
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-[#f0ebe3] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/pro" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Studia" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="text-base font-bold font-heading text-gray-800">Studia <span className="text-[#7C3AED] font-light">Pro</span></span>
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-violet-50 text-gray-600" aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}
      <div className={`lg:hidden fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <ProSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex">
        <div className="hidden lg:block"><ProSidebar /></div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 bg-[#faf8f5]">{children}</main>
      </div>
    </div>
  )
}
