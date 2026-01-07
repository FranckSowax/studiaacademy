'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Zap,
  BookOpen,
  Trophy,
  BarChart3,
  GraduationCap,
  Award,
  MessageSquare,
  Settings,
  Sparkles,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  icon: React.ElementType
  label: string
  href: string
  badge?: string | number | null
}

const menuItems: MenuItem[] = [
  { id: 'overview', icon: Home, label: "Vue d'ensemble", href: '/dashboard', badge: null },
  { id: 'services', icon: Zap, label: 'Micro-Services', href: '/services', badge: 'Nouveau' },
  { id: 'lessons', icon: BookOpen, label: 'Mes Formations', href: '/dashboard/courses', badge: null },
  { id: 'leaderboard', icon: Trophy, label: 'Classement', href: '/dashboard/leaderboard', badge: null },
  { id: 'skills', icon: BarChart3, label: 'Compétences', href: '/dashboard/skills', badge: null },
  { id: 'courses', icon: GraduationCap, label: 'Catalogue', href: '/services', badge: null },
  { id: 'certificates', icon: Award, label: 'Certificats', href: '/dashboard/certificates', badge: null },
  { id: 'messages', icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', badge: 3 },
  { id: 'settings', icon: Settings, label: 'Paramètres', href: '/dashboard/settings', badge: null },
]

interface StudiaSidebarProps {
  className?: string
  defaultOpen?: boolean
}

export function StudiaSidebar({ className, defaultOpen = true }: StudiaSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'bg-white min-h-screen p-6 transition-all duration-300 flex flex-col border-r border-[#f0ebe3]',
        sidebarOpen ? 'w-64' : 'w-20',
        className
      )}
    >
      {/* Logo Studia Academy */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-xl flex items-center justify-center shadow-lg shadow-[#e97e42]/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <span className="text-xl font-bold text-gray-800">Studia</span>
            <span className="text-xl font-light text-[#e97e42]"> Academy</span>
          </div>
        )}
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {sidebarOpen ? 'Menu' : ''}
        </p>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                    active
                      ? 'bg-[#fff7ed] text-[#e97e42]'
                      : 'text-gray-600 hover:bg-[#fff7ed]/50 hover:text-[#e97e42]'
                  )}
                >
                  <item.icon
                    className={cn('w-5 h-5 flex-shrink-0', active && 'text-[#e97e42]')}
                  />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'ml-auto text-xs px-2 py-0.5 rounded-full',
                            typeof item.badge === 'number'
                              ? 'bg-red-500 text-white'
                              : 'bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#e97e42] to-[#d56a2e] rounded-r-full" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* CTA Premium - Studia Lab */}
      {sidebarOpen && (
        <div className="mt-6 p-4 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-2xl text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <h4 className="font-bold mb-1">Passez Premium !</h4>
            <p className="text-xs text-white/80 mb-3">
              Accès illimité à tous nos services et formations.
            </p>
            <Link
              href="/pricing"
              className="w-full bg-white text-[#e97e42] font-semibold py-2 px-4 rounded-xl hover:bg-[#fbf8f3] transition-colors flex items-center justify-center gap-2"
            >
              Découvrir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Toggle Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mt-4 p-2 rounded-xl hover:bg-[#fff7ed] text-gray-400 hover:text-[#e97e42] transition-colors self-center"
      >
        <Menu className="w-5 h-5" />
      </button>
    </aside>
  )
}
