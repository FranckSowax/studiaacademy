import type { Metadata } from 'next'
import { getAppConfig } from '@/lib/config/app-config'
import { RequestsBoard } from '@/components/inbox/RequestsBoard'

export function generateMetadata(): Metadata {
  return { title: `Recherches clients — ${getAppConfig().brand.name}`, robots: { index: false } }
}

export default function RecherchesPage() {
  return <RequestsBoard />
}
