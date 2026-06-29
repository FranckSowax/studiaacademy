import type { Metadata } from 'next'
import { ScrollExperience } from '@/components/institut/ScrollExperience'

export const metadata: Metadata = {
  title: 'Institut Français × Studia Academy — Formations & plateforme IA',
  description:
    "Partenariat IA : formations pour le staff de l'Institut Français et sa communauté, plus une plateforme Studia pour créer des contenus image/vidéo, lancer des campagnes WhatsApp et publier sur tous les réseaux sociaux.",
}

export default function InstitutFrancaisPage() {
  return <ScrollExperience />
}
