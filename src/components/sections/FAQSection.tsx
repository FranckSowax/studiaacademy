'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Puis-je accéder aux universités chinoises sans parler mandarin ?',
    answer:
      "Oui, absolument. Notre programme inclut des cours de mandarin intensifs dès les premières semaines. Beaucoup de programmes universitaires en Chine sont disponibles en anglais ou en français pour les étudiants étrangers. Nous vous accompagnons dans le choix de l'université adaptée à votre niveau linguistique.",
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      "Nous acceptons les paiements via Airtel Money, Moov Money, carte bancaire (Visa/Mastercard) et virements bancaires. Des facilités de paiement en plusieurs fois sont disponibles pour les formations longues. Nous nous adaptons aux réalités de l'écosystème financier gabonais.",
  },
  {
    question: 'Les certifications délivrées sont-elles reconnues par les entreprises gabonaises ?',
    answer:
      "Nos certifications sont reconnues par un réseau croissant de partenaires employeurs au Gabon et en Afrique Centrale, dont BGFIBank et des entreprises du secteur pétrolier et télécom. Elles sont adossées à des référentiels de compétences internationaux vérifiables numériquement.",
  },
  {
    question: 'Y a-t-il des formations disponibles en présentiel à Libreville ?',
    answer:
      "Oui. Notre centre de formation est situé au cœur de Libreville. Nous proposons des formations en salle de 1 à 5 jours sur des thématiques de leadership, management, digital et soft skills. Un calendrier trimestriel est disponible sur demande.",
  },
  {
    question: "Comment fonctionne l'audit IA pour mon entreprise ?",
    answer:
      "L'audit se déroule en 3 étapes : (1) Diagnostic organisationnel de 2 jours avec vos équipes, (2) Analyse des processus automatisables et rapport détaillé, (3) Plan de déploiement IA priorisé avec ROI estimé. Nous assurons également un suivi post-implémentation de 3 mois.",
  },
  {
    question: 'Puis-je changer de module en cours de parcours ?',
    answer:
      "Oui, vous pouvez ajuster votre parcours à tout moment. Nous comprenons que vos besoins évoluent. Il suffit de contacter votre coach dédié ou notre équipe support pour réorienter votre programme. Les crédits de formation déjà consommés sont partiellement reportables.",
  },
  {
    question: "Y a-t-il une période d'essai gratuite ?",
    answer:
      "Oui. Tout nouvel inscrit bénéficie de 50 crédits offerts dès l'inscription, utilisables sur les tests de compétences, une session d'assistant carrière IA et un accès partiel aux contenus de formation. Aucune carte bancaire n'est requise pour commencer.",
  },
  {
    question: "Comment s'inscrire depuis l'international ?",
    answer:
      "L'inscription est 100% en ligne et accessible depuis n'importe quel pays. Les formations en ligne sont accessibles immédiatement après inscription. Pour les formations présentiel à Libreville ou les programmes Universités Chinoises, notre équipe vous accompagne pour la logistique (visa, hébergement, transport).",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="w-full py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-gray-500 text-lg">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`faq-${idx}`}
              className="border border-[#f0ebe3] rounded-xl px-6 data-[state=open]:border-[#e97e42]/40 data-[state=open]:shadow-sm transition-all"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-[#e97e42] hover:no-underline py-5 text-sm md:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm md:text-base leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            Vous avez d'autres questions ?{' '}
            <a href="/contact" className="text-[#a84d16] font-semibold hover:underline">
              Contactez-nous
            </a>{' '}
            ou rejoignez-nous sur WhatsApp.
          </p>
        </div>
      </div>
    </section>
  )
}
