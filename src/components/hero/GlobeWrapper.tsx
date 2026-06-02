'use client'

import dynamic from 'next/dynamic'

const Globe3D = dynamic(
  () => import('./Globe3D').then((m) => m.Globe3D),
  { ssr: false, loading: () => null }
)

export function GlobeWrapper({ className }: { className?: string }) {
  return <Globe3D className={className} />
}
