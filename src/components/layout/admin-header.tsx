import { UserNav } from './user-nav'
import { createClient } from '@/lib/supabase/server'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AdminSidebar } from './admin-sidebar'
import Link from 'next/link'

export async function AdminHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="mr-4 hidden md:flex">
          <Link href="/admin" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-red-600">
              Studia Admin
            </span>
          </Link>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
             <AdminSidebar className="pt-4" />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/dashboard">Retour au site</Link>
          </Button>
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
