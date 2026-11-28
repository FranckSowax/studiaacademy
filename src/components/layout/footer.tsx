import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { WHATSAPP_AFFICHAGE, WHATSAPP_NUMBER } from '@/lib/formations-ia'

const CONTACT_EMAIL = 'contact@studia.academy'

// WHY: uniquement les pages encore proposées dans le menu et sur l'accueil.
const COLONNES = [
  {
    titre: 'Formations',
    liens: [
      { label: 'Formations en ligne', href: '/formations/en-ligne' },
      { label: 'Collection Upgrade Métier', href: '/#metiers' },
      { label: 'Événements en présentiel', href: '/#evenements' },
      { label: 'Studia Live', href: '/#studia-live' },
    ],
  },
  {
    titre: 'Entreprise',
    liens: [
      { label: 'Espace entreprise', href: '/entreprise' },
      { label: 'Diagnostic gratuit', href: '/entreprise/diagnostic' },
      { label: 'À propos', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    titre: 'Légal',
    liens: [
      { label: "Conditions d'utilisation", href: '/terms' },
      { label: 'Politique de confidentialité', href: '/privacy' },
    ],
  },
]

const LIGNE = 'flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-[#a84d16]'
const PUCE = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#fff7ed]'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#f0ebe3] bg-[#fbf8f3]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Marque + coordonnées */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-gray-800">Studia</span>
                <span className="text-xl font-light text-[#e97e42]"> Academy</span>
              </div>
            </Link>
            <p className="mb-6 max-w-sm text-gray-600">
              Formations en ligne, événements en présentiel à Libreville et diagnostic pour les
              entreprises : montez en compétences avec les bons outils IA.
            </p>

            <ul className="space-y-3">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LIGNE}
                >
                  <span className={PUCE}>
                    <MessageCircle className="h-4 w-4 text-[#e97e42]" />
                  </span>
                  <span>
                    WhatsApp&nbsp;: <span className="font-semibold text-gray-800">{WHATSAPP_AFFICHAGE}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={LIGNE}>
                  <span className={PUCE}>
                    <Mail className="h-4 w-4 text-[#e97e42]" />
                  </span>
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <span className={PUCE}>
                  <MapPin className="h-4 w-4 text-[#e97e42]" />
                </span>
                Libreville, Gabon
              </li>
            </ul>
          </div>

          {COLONNES.map((col) => (
            <nav key={col.titre} aria-label={col.titre}>
              <h3 className="mb-4 font-bold text-gray-800">{col.titre}</h3>
              <ul className="space-y-3">
                {col.liens.map((lien) => (
                  <li key={lien.href}>
                    <Link href={lien.href} className="text-sm text-gray-600 transition-colors hover:text-[#a84d16]">
                      {lien.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-[#f0ebe3]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-gray-500 md:text-left">
              © {currentYear} Studia Academy. Tous droits réservés.
            </p>
            <p className="text-sm text-gray-500">
              Fait avec <span className="text-[#e97e42]">❤</span> au Gabon
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
