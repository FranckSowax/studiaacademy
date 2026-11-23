'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { estFormateurDesigne } from '@/lib/studia-live/etat'

/** Bandeau du tableau de bord élève, affiché seulement à un formateur
 * désigné : il mène à son espace formateur. */
export function LienEspaceFormateur() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let actif = true
    estFormateurDesigne()
      .then((ok) => {
        if (actif) setVisible(ok)
      })
      .catch(() => undefined)
    return () => {
      actif = false
    }
  }, [])

  if (!visible) return null

  return (
    <Link
      href="/professeur"
      className="group mb-4 flex items-center gap-3 rounded-2xl border border-[#f0ebe3] bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md sm:mb-6"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff7ed]">
        <GraduationCap className="h-5 w-5 text-[#e97e42]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">Vous êtes formateur Studia Academy</span>
        <span className="block text-xs text-gray-500">Ouvrez votre espace formateur et Studia Live.</span>
      </span>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#e97e42] transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
