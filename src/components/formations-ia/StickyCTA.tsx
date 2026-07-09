import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER } from '@/lib/formations-ia'

/**
 * Barre CTA fixe en bas d'écran, mobile uniquement.
 * F1-F3 : "S'inscrire" · F4 : "Demander un entretien".
 */
export function StickyCTA({
  slug,
  titre,
  from,
  to,
  executive = false,
}: {
  slug: string
  titre: string
  from: string
  to: string
  executive?: boolean
}) {
  const waText = encodeURIComponent(
    `Bonjour Studia Academy, je suis intéressé(e) par la formation ${titre}.`
  )
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 p-3 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <Link
          href={
            executive
              ? `/formations-ia/${slug}#entretien`
              : `/formations-ia/inscription?f=${slug}`
          }
          className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {executive ? 'Demander un entretien' : "S'inscrire"}
        </Link>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white"
          aria-label="Contacter sur WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
    </div>
  )
}
