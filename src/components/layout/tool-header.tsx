import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function ToolHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="font-bold">
            Studia Academy
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <X className="mr-2 h-4 w-4" />
              Quitter
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
