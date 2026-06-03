'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrolled } from '@/hooks/useScroll'

const navLinks = [
  { label: 'Modules', href: '/#modules' },
  { label: 'Formations', href: '/formations' },
  { label: 'Studia Labs', href: '/studia-labs' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
]

interface HeaderNavProps {
  userEmail?: string | null
}

export function HeaderNav({ userEmail }: HeaderNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrolled = useScrolled(50)

  return (
    <>
      <header
        id="main-header"
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/97 backdrop-blur-md shadow-sm border-b border-[#f0ebe3]'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Studia Academy"
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
              />
              <span className="text-lg font-bold font-heading">
                <span className={cn('transition-colors duration-300', scrolled ? 'text-gray-800' : 'text-gray-900')}>
                  Studia
                </span>
                <span className="text-[#e97e42]"> Academy</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    scrolled
                      ? 'text-gray-600 hover:text-[#e97e42] hover:bg-[#fff7ed]'
                      : 'text-gray-700 hover:text-[#e97e42] hover:bg-white/60'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {!userEmail ? (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className={cn(
                        'text-sm transition-colors',
                        scrolled
                          ? 'text-gray-600 hover:text-[#e97e42] hover:bg-[#fff7ed]'
                          : 'text-gray-700 hover:text-[#e97e42] hover:bg-white/60'
                      )}
                    >
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white text-sm shadow-md shadow-[#e97e42]/20 rounded-xl">
                      S'inscrire
                      <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white text-sm rounded-xl">
                    Mon espace
                  </Button>
                </Link>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-white/60 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-white shadow-2xl md:hidden',
          'flex flex-col transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#f0ebe3]">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="Studia Academy" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="text-base font-bold font-heading">
              <span className="text-gray-800">Studia</span>
              <span className="text-[#e97e42]"> Academy</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-gray-700 font-medium hover:text-[#e97e42] hover:bg-[#fff7ed] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-5 border-t border-[#f0ebe3] space-y-3">
          {!userEmail ? (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed] rounded-xl">
                  Connexion
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl">
                  S'inscrire gratuitement
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] text-white rounded-xl">
                Mon espace
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
