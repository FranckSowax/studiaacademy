'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SheetClose } from '@/components/ui/sheet'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Découvrir
          </h2>
          <div className="space-y-1">
            <SheetClose asChild>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/services">
                  Services
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/pricing">
                  Tarifs
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/about">
                  À propos
                </Link>
              </Button>
            </SheetClose>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Compte
          </h2>
          <div className="space-y-1">
            <SheetClose asChild>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/login">
                  Connexion
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/signup">
                  Inscription
                </Link>
              </Button>
            </SheetClose>
          </div>
        </div>
      </div>
    </div>
  )
}
