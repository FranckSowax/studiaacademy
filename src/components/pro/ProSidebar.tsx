'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, BarChart3, GraduationCap, Building2, ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: '/pro' },
  { icon: BarChart3, label: 'Diagnostic effectifs', href: '/entreprise/diagnostic' },
  { icon: Sparkles, label: 'Outils IA & RH', href: '/outils' },
  { icon: GraduationCap, label: 'Formations entreprise', href: '/formations/en-ligne' },
  { icon: Building2, label: 'Espace entreprise', href: '/entreprise' },
]

export function ProSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/pro' ? pathname === '/pro' : pathname.startsWith(href))

  return (
    <aside className={cn('bg-[#fbf8f3] min-h-screen p-6 flex flex-col border-r border-[#f0ebe3] sticky top-0 h-screen w-64', className)}>
      <div className="flex items-center gap-3 mb-2">
        <Image src="/logo.png" alt="Studia Academy" width={40} height={40} className="w-10 h-10 object-contain" />
        <div>
          <span className="text-xl font-bold font-heading text-gray-800">Studia</span>
          <span className="text-xl font-light text-[#7C3AED]"> Pro</span>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 bg-violet-50 text-[#7C3AED] px-2.5 py-1 rounded-full text-xs font-medium mb-8 w-fit">
        <Building2 className="w-3 h-3" />Espace Professionnel
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavigate}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative',
                    active ? 'bg-violet-50 text-[#7C3AED]' : 'text-gray-600 hover:bg-violet-50/50 hover:text-[#7C3AED]')}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#7C3AED] to-[#6d28d9] rounded-r-full" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Link href="/dashboard" onClick={onNavigate} className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />Espace apprenant
      </Link>
    </aside>
  )
}
