'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  AlertTriangle,
  Settings,
  GraduationCap,
  MapPin,
  Inbox,
  FlaskConical,
} from 'lucide-react'

interface AdminSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()

  const sidebarItems = [
    {
      title: 'Vue d\'ensemble',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Utilisateurs',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Services',
      href: '/admin/services',
      icon: Briefcase,
    },
    {
      title: 'Formations en ligne',
      href: '/admin/formations',
      icon: GraduationCap,
    },
    {
      title: 'Inscriptions',
      href: '/admin/formations/inscriptions',
      icon: Inbox,
    },
    {
      title: 'Présentiel',
      href: '/admin/presentiel',
      icon: MapPin,
    },
    {
      title: 'Studia Labs',
      href: '/admin/labs',
      icon: FlaskConical,
    },
    {
      title: 'Signalements',
      href: '/admin/reports',
      icon: AlertTriangle,
    },
    {
      title: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  return (
    <div className={cn("pb-12 h-screen border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-red-600">
            Administration
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
