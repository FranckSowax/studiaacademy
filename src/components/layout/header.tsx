import Link from 'next/link'
import Image from 'next/image'
import { UserNav } from './user-nav'
import { createClient } from '@/lib/supabase/server'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#f0ebe3] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Studia Academy"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-gray-800">Studia</span>
              <span className="text-xl font-light text-[#e97e42]"> Academy</span>
            </div>
          </Link>
          <nav className="flex items-center space-x-1">
            <Link
              href="/services"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#e97e42] hover:bg-[#fff7ed] transition-colors"
            >
              Services
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#e97e42] hover:bg-[#fff7ed] transition-colors"
            >
              À propos
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#e97e42] hover:bg-[#fff7ed] transition-colors"
            >
              Tarifs
            </Link>
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-[#fbf8f3]">
            <div className="flex items-center gap-2 mb-8 px-4">
              <Image
                src="/logo.png"
                alt="Studia Academy"
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
              />
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-gray-800">Studia</span>
                <span className="text-xl font-light text-[#e97e42]"> Academy</span>
              </div>
            </div>
            <Sidebar className="pt-4" />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search component can go here */}
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-[#e97e42] hover:bg-[#fff7ed]"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white shadow-md shadow-[#e97e42]/20">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
            {user && <UserNav user={user} />}
          </div>
        </div>
      </div>
    </header>
  )
}
