import Link from 'next/link'
import { RotateCcw, WifiOff } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'Formation momentanément indisponible — Studia Academy',
  robots: { index: false },
}

/** Affichée quand Studia Live n'a pas pu ouvrir la formation (pas de
 * réponse en 10 s, ou erreur). « Réessayer » relance /suivre. */
export default async function FormationIndisponiblePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md rounded-3xl border border-[#f0ebe3] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff7ed]">
            <WifiOff className="h-7 w-7 text-[#e97e42]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            La formation ne s&apos;ouvre pas pour le moment
          </h1>
          <p className="mt-3 text-gray-600">
            Notre espace de cours n&apos;a pas répondu. Votre inscription et votre progression ne
            sont pas touchées. Réessayez dans un instant.
          </p>
          {/* <a> et non <Link> : navigation réelle, un seul appel à /suivre. */}
          <a
            href={`/formations/${encodeURIComponent(slug)}/suivre`}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e97e42] to-[#d56a2e] px-6 py-4 text-base font-semibold text-white"
          >
            <RotateCcw className="h-5 w-5" />
            Réessayer
          </a>
          <Link
            href="/dashboard/courses"
            className="mt-4 block text-sm text-gray-500 hover:text-[#e97e42]"
          >
            Retour à mes formations
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
