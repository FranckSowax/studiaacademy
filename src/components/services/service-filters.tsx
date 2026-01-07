'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListFilter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export function ServiceFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const categories = [
    { value: 'assess', label: 'Évaluer' },
    { value: 'create', label: 'Créer' },
    { value: 'learn', label: 'Apprendre' },
    { value: 'ai-tools', label: 'Outils IA' },
    { value: 'business', label: 'Entreprises' },
    { value: 'community', label: 'Communauté' },
  ]

  const currentCategory = searchParams.get('category')
  const currentPrice = searchParams.get('price') // 'free' or 'paid'

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
        if (params.get(key) === value) {
            params.delete(key) // Toggle off
        } else {
            params.set(key, value)
        }
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <ListFilter className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Filtrer
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Catégorie</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.value}
              checked={currentCategory === category.value}
              onCheckedChange={() => handleFilterChange('category', category.value)}
            >
              {category.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Prix</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={currentPrice === 'free'}
            onCheckedChange={() => handleFilterChange('price', 'free')}
          >
            Gratuit
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentPrice === 'paid'}
            onCheckedChange={() => handleFilterChange('price', 'paid')}
          >
            Payant
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
