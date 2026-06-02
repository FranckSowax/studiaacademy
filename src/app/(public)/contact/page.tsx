'use client'

import { useState } from 'react'
import { MessageCircle, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { modules } from '@/lib/modules'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    module: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  const whatsappText = encodeURIComponent(
    `Bonjour Studia Academy, je m'appelle ${form.nom || 'un visiteur'} et je souhaite en savoir plus sur ${form.module || 'vos modules'}.`
  )

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#fff7ed] text-[#a84d16] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-gray-900 mb-4">
            Parlons de votre projet
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Notre équipe à Libreville vous répond sous 24h. Ou directement sur WhatsApp pour une
            réponse immédiate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Formulaire */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-[#fbf8f3] rounded-3xl border border-[#f0ebe3]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">
                  Message envoyé !
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Nous vous répondrons dans les 24h. En attendant, rejoignez-nous sur WhatsApp pour
                  une réponse immédiate.
                </p>
                <a
                  href={`https://wa.me/24100000000?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Continuer sur WhatsApp
                </a>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 bg-[#fbf8f3] rounded-3xl p-8 border border-[#f0ebe3]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                      Nom complet *
                    </Label>
                    <Input
                      id="nom"
                      required
                      placeholder="Jean Dupont"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="jean@exemple.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                      Téléphone (+241)
                    </Label>
                    <Input
                      id="telephone"
                      placeholder="+241 06 XX XX XX"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      className="border-[#e2e8f0] rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="module" className="text-sm font-medium text-gray-700">
                      Module concerné
                    </Label>
                    <select
                      id="module"
                      value={form.module}
                      onChange={(e) => setForm({ ...form, module: e.target.value })}
                      className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-gray-700 focus:border-[#e97e42] focus:outline-none focus:ring-2 focus:ring-[#e97e42]/20"
                    >
                      <option value="">Choisir un module</option>
                      {modules.map((m) => (
                        <option key={m.slug} value={m.titre}>
                          {m.titre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    required
                    rows={5}
                    placeholder="Décrivez votre projet ou votre question..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="border-[#e2e8f0] focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl bg-white resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white py-5 rounded-xl font-semibold"
                  >
                    {loading ? 'Envoi...' : 'Envoyer le message'}
                    <Send className="ml-2 w-4 h-4" />
                  </Button>
                  <a
                    href={`https://wa.me/24100000000?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50 py-5 rounded-xl font-semibold"
                    >
                      <MessageCircle className="mr-2 w-4 h-4" />
                      WhatsApp (immédiat)
                    </Button>
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* Infos de contact */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#fbf8f3] rounded-3xl p-8 border border-[#f0ebe3] space-y-6">
              <h3 className="text-xl font-bold font-heading text-gray-900">Nos coordonnées</h3>

              {[
                {
                  icon: MapPin,
                  label: 'Adresse',
                  value: 'Libreville, Gabon\nAfrique Centrale',
                },
                {
                  icon: Phone,
                  label: 'Téléphone',
                  value: '+241 XX XX XX XX',
                },
                {
                  icon: Mail,
                  label: 'Email',
                  value: 'contact@studiaacademy.com',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#fff7ed] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#e97e42]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className="text-gray-700 text-sm font-medium whitespace-pre-line">
                        {item.value}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* WhatsApp CTA prominent */}
            <a
              href={`https://wa.me/24100000000?text=${encodeURIComponent('Bonjour Studia Academy, je souhaite en savoir plus sur vos programmes.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-green-500 to-green-600 rounded-3xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg font-heading">WhatsApp</p>
                  <p className="text-green-100 text-sm">Réponse en moins de 2h en semaine</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-green-100">
                Cliquez pour démarrer une conversation directe avec notre équipe.
              </p>
            </a>

            <div className="bg-white border border-[#f0ebe3] rounded-3xl p-6">
              <p className="text-sm font-semibold text-gray-800 mb-2">Horaires d'ouverture</p>
              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Lun – Ven</span>
                  <span className="font-medium text-gray-700">08h00 – 18h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Samedi</span>
                  <span className="font-medium text-gray-700">09h00 – 14h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimanche</span>
                  <span className="text-gray-400">Fermé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
