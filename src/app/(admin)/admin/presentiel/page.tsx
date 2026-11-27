import { redirect } from 'next/navigation'

/** Ancienne adresse de l'onglet « Présentiel » : remplacé par « Événements ». */
export default function AdminPresentielPage() {
  redirect('/admin/evenements')
}
