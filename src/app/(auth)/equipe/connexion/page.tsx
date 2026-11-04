import type { Metadata } from 'next'
import { getAppConfig } from '@/lib/config/app-config'
import { StaffLoginForm } from './StaffLoginForm'

export function generateMetadata(): Metadata {
  return { title: `Connexion équipe — ${getAppConfig().brand.name}`, robots: { index: false } }
}

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <StaffLoginForm next={typeof next === 'string' ? next : null} />
}
