'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
  Settings,
  CreditCard,
  MessageSquare
} from 'lucide-react'

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()

  const sidebarItems = [
    {
      title: 'Vue d\'ensemble',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Mes Formations',
      href: '/dashboard/courses',
      icon: BookOpen,
    },
    {
      title: 'Mes CVs',
      href: '/dashboard/cvs',
      icon: FileText,
    },
    {
      title: 'Assistants IA',
      href: '/dashboard/assistants',
      icon: MessageSquare,
    },
    {
      title: 'Transactions',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
    {
      title: 'Profil',
      href: '/dashboard/profile',
      icon: User,
    },
    {
      title: 'Paramètres',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ]

  return (
    <div className={cn("pb-12 h-screen border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Studia Academy
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
