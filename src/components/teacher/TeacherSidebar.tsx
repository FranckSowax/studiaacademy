'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileCheck,
  ListChecks,
  Users,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: '/professeur' },
  { icon: FileCheck, label: 'Correction de copies', href: '/professeur/correction' },
  { icon: ListChecks, label: 'Devoirs QCM', href: '/professeur/qcm' },
  { icon: Users, label: 'Mes classes', href: '/professeur/classes' },
]

interface TeacherSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function TeacherSidebar({ className, onNavigate }: TeacherSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/professeur') return pathname === '/professeur'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'bg-[#fbf8f3] min-h-screen p-6 flex flex-col border-r border-[#f0ebe3] sticky top-0 h-screen w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <Image src="/logo.png" alt="Studia Academy" width={40} height={40} className="w-10 h-10 object-contain" />
        <div>
          <span className="text-xl font-bold font-heading text-gray-800">Studia</span>
          <span className="text-xl font-light text-[#e97e42]"> Prof</span>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 bg-[#fff7ed] text-[#a84d16] px-2.5 py-1 rounded-full text-xs font-medium mb-8 w-fit">
        <GraduationCap className="w-3 h-3" />
        Espace Professeur
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative',
                    active
                      ? 'bg-[#fff7ed] text-[#e97e42]'
                      : 'text-gray-600 hover:bg-[#fff7ed]/50 hover:text-[#e97e42]'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#e97e42] to-[#d56a2e] rounded-r-full" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Retour espace étudiant */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Espace étudiant
      </Link>
    </aside>
  )
}
