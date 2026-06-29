'use client'

import { useState } from 'react'
import { CheckCircle, Send, MessageCircle, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const publics = [
  'Équipe & staff interne',
  'Adhérents & clients',
  'Expatriés',
  'Les deux volets',
]

export function PartnershipForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    organisation: 'Institut Français',
    email: '',
    telephone: '',
    publicCible: '',
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
    `Bonjour Studia Academy, je représente ${form.organisation || "l'Institut Français"} et je souhaite discuter d'un partenariat formations IA${form.publicCible ? ` (${form.publicCible})` : ''}.`
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Handshake className="w-4 h-4 text-[#f3a268]" /> Construisons le partenariat
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-white mb-3">
          Allumons-la ensemble
        </h2>
        <p className="text-white/70 text-lg">
          Décrivez votre besoin — notre équipe à Libreville revient vers vous sous 24h.
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold font-heading text-white mb-2">Demande envoyée !</h3>
          <p className="text-white/70 max-w-sm">
            Merci. Notre équipe partenariats vous recontacte sous 24h pour cadrer le programme.
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
        <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="nom" className="text-sm font-medium text-white/80">Nom du contact *</Label>
              <Input id="nom" required placeholder="Prénom Nom" value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organisation" className="text-sm font-medium text-white/80">Organisation</Label>
              <Input id="organisation" value={form.organisation}
                onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                className="border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-white/80">Email *</Label>
              <Input id="email" type="email" required placeholder="contact@if-gabon.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone" className="text-sm font-medium text-white/80">Téléphone (+241)</Label>
              <Input id="telephone" placeholder="+241 06 XX XX XX" value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="border-white/15 bg-white/10 text-white placeholder:text-white/40 rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publicCible" className="text-sm font-medium text-white/80">Public visé</Label>
            <select id="publicCible" value={form.publicCible}
              onChange={(e) => setForm({ ...form, publicCible: e.target.value })}
              className="w-full h-10 rounded-xl border border-white/15 bg-white/10 text-white px-3 text-sm focus:border-[#e97e42] focus:outline-none focus:ring-2 focus:ring-[#e97e42]/20">
              <option value="" className="text-gray-800">Choisir un public</option>
              {publics.map((p) => (
                <option key={p} value={p} className="text-gray-800">{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-sm font-medium text-white/80">Votre besoin *</Label>
            <Textarea id="message" required rows={4}
              placeholder="Profil des participants, volume, calendrier souhaité..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-[#e97e42] focus:ring-[#e97e42]/20 rounded-xl resize-none" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white py-5 rounded-xl font-semibold">
              {loading ? 'Envoi...' : 'Envoyer la demande'}
              <Send className="ml-2 w-4 h-4" />
            </Button>
            <a href={`https://wa.me/24100000000?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button type="button" variant="outline"
                className="w-full border-2 border-green-500 text-green-400 hover:bg-green-500/10 py-5 rounded-xl font-semibold">
                <MessageCircle className="mr-2 w-4 h-4" /> WhatsApp (immédiat)
              </Button>
            </a>
          </div>
        </form>
      )}
    </div>
  )
}
