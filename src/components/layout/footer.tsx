import Link from 'next/link'
import { Sparkles, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    services: [
      { label: 'Test de Compétences', href: '/services/assess' },
      { label: 'Générateur de CV', href: '/services/create' },
      { label: 'Analyse CV par IA', href: '/services/analyze' },
      { label: 'Simulateur Entretien', href: '/services/interview' },
      { label: 'Assistant Carrière', href: '/services/assistant' },
    ],
    company: [
      { label: 'À propos', href: '/about' },
      { label: 'Tarifs', href: '/pricing' },
      { label: 'Blog', href: '/blog' },
      { label: 'Carrières', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Conditions d\'utilisation', href: '/terms' },
      { label: 'Politique de confidentialité', href: '/privacy' },
      { label: 'Mentions légales', href: '/legal' },
      { label: 'CGV', href: '/cgv' },
    ],
  }

  const socialLinks = [
    { label: 'Facebook', href: '#', icon: 'f' },
    { label: 'Twitter', href: '#', icon: 'x' },
    { label: 'LinkedIn', href: '#', icon: 'in' },
    { label: 'Instagram', href: '#', icon: 'ig' },
  ]

  return (
    <footer className="bg-[#fbf8f3] border-t border-[#f0ebe3]">
      {/* Main Footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-xl flex items-center justify-center shadow-md shadow-[#e97e42]/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-gray-800">Studia</span>
                <span className="text-xl font-light text-[#e97e42]"> Academy</span>
              </div>
            </Link>
            <p className="text-gray-600 mb-6 max-w-sm">
              La plateforme #1 en Afrique Centrale pour booster votre carrière avec des outils
              intelligents et des formations de qualité.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 bg-[#fff7ed] rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#e97e42]" />
                </div>
                <span className="text-sm">contact@studiaacademy.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 bg-[#fff7ed] rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-[#e97e42]" />
                </div>
                <span className="text-sm">+241 XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 bg-[#fff7ed] rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#e97e42]" />
                </div>
                <span className="text-sm">Libreville, Gabon</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-[#e97e42] hover:shadow-md transition-all border border-[#f0ebe3] font-semibold text-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-[#e97e42] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-[#e97e42] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-[#e97e42] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#f0ebe3]">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 text-center md:text-left">
              © {currentYear} Studia Academy. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Fait avec</span>
              <span className="text-[#e97e42]">❤</span>
              <span className="text-sm text-gray-500">au Gabon</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
