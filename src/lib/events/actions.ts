'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { EVENEMENTS_MAX_MAX, EVENEMENTS_MAX_MIN } from '@/lib/home/event-settings'

/**
 * Gestion des événements en présentiel (table `presentiel_sessions`) et de
 * leur affichage sur la page d'accueil, depuis l'écran d'administration.
 * Chaque action vérifie le rôle admin ; les policies RLS le revérifient.
 */

type Resultat = { success: boolean; error?: string }

export interface EvenementInput {
  id?: string
  titre: string
  description?: string | null
  categorie?: string | null
  cover_image?: string | null
  /** Date et heure de début, ISO 8601. */
  date_debut: string
  date_fin?: string | null
  lieu?: string | null
  ville?: string | null
  places_total: number
  prix_fcfa: number
  formateur_nom?: string | null
  is_published: boolean
  afficher_accueil: boolean
}

const URL_IMAGE = /^(\/[^/]|https:\/\/)\S{0,1000}$/
const MIGRATION = 'Appliquez la migration 20261129120000_events_home.sql pour activer ce réglage.'

const texte = (v: string | null | undefined, max: number) => {
  const t = (v ?? '').trim().slice(0, max)
  return t === '' ? null : t
}
const dateIso = (v: string | null | undefined) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Client Supabase de l'utilisateur, uniquement s'il est admin. */
async function clientAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: estAdmin } = await supabase.rpc('is_admin')
  return estAdmin === true ? supabase : null
}

function revalider() {
  revalidatePath('/')
  revalidatePath('/formations/presentiel')
  revalidatePath('/admin/evenements')
  revalidatePath('/admin/accueil')
}

/**
 * Crée ou modifie un événement. Tous les champs sont enregistrés tels que
 * fournis : le formulaire envoie toujours l'événement complet.
 */
export async function saveEvenement(input: EvenementInput): Promise<Resultat> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }

  const titre = texte(input.titre, 160)
  if (!titre) return { success: false, error: 'Le titre est obligatoire.' }
  const debut = dateIso(input.date_debut)
  if (!debut) return { success: false, error: 'La date de début est obligatoire.' }
  const fin = dateIso(input.date_fin)
  if (input.date_fin && !fin) return { success: false, error: 'Date de fin invalide.' }
  if (fin && fin < debut) return { success: false, error: 'La date de fin doit être après le début.' }
  if (!Number.isInteger(input.places_total) || input.places_total < 1 || input.places_total > 10_000) {
    return { success: false, error: 'Nombre de places invalide : entier entre 1 et 10 000.' }
  }
  if (!Number.isInteger(input.prix_fcfa) || input.prix_fcfa < 0 || input.prix_fcfa > 100_000_000) {
    return { success: false, error: 'Prix invalide : nombre entier positif, 0 pour un événement gratuit.' }
  }
  const image = texte(input.cover_image, 1000)
  if (image && !URL_IMAGE.test(image)) {
    return { success: false, error: "Adresse d'image invalide : elle doit commencer par https://" }
  }

  const champs = {
    titre,
    description: texte(input.description, 5000),
    categorie: texte(input.categorie, 80),
    cover_image: image,
    date_debut: debut,
    date_fin: fin,
    lieu: texte(input.lieu, 160),
    ville: texte(input.ville, 80) ?? 'Libreville',
    places_total: input.places_total,
    prix_fcfa: input.prix_fcfa,
    formateur_nom: texte(input.formateur_nom, 120),
    is_published: input.is_published === true,
  }
  const ecrire = (ligne: Record<string, unknown>) =>
    input.id
      ? supabase.from('presentiel_sessions').update(ligne).eq('id', input.id)
      : supabase.from('presentiel_sessions').insert(ligne)

  let { error } = await ecrire({ ...champs, afficher_accueil: input.afficher_accueil !== false })
  // WHY: tant que la migration n'est pas appliquée, la colonne n'existe pas ;
  // l'événement doit quand même pouvoir être enregistré.
  if (error && /afficher_accueil/.test(error.message)) ({ error } = await ecrire(champs))
  if (error) return { success: false, error: error.message }

  revalider()
  return { success: true }
}

/** Publie ou dépublie un événement, sans toucher à ses autres champs. */
export async function setEvenementPublie(id: string, publie: boolean): Promise<Resultat> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }
  const { error } = await supabase.from('presentiel_sessions').update({ is_published: publie }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalider()
  return { success: true }
}

/** Affiche ou masque un événement dans l'agenda de la page d'accueil. */
export async function setEvenementAccueil(id: string, affiche: boolean): Promise<Resultat> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }
  const { error } = await supabase.from('presentiel_sessions').update({ afficher_accueil: affiche }).eq('id', id)
  if (error) return { success: false, error: /afficher_accueil/.test(error.message) ? MIGRATION : error.message }
  revalider()
  return { success: true }
}

export async function deleteEvenement(id: string): Promise<Resultat> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }
  const { error } = await supabase.from('presentiel_sessions').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalider()
  return { success: true }
}

/** Enregistre les réglages de la section « Événements » de l'accueil. */
export async function saveReglagesEvenements(input: { max: number; journeesIa: boolean }): Promise<Resultat> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }
  if (!Number.isInteger(input.max) || input.max < EVENEMENTS_MAX_MIN || input.max > EVENEMENTS_MAX_MAX) {
    return { success: false, error: `Nombre d'événements invalide : entre ${EVENEMENTS_MAX_MIN} et ${EVENEMENTS_MAX_MAX}.` }
  }
  const { error } = await supabase.from('home_settings').upsert({
    id: true,
    evenements_max: input.max,
    afficher_journees_ia: input.journeesIa === true,
    updated_at: new Date().toISOString(),
  })
  if (error) return { success: false, error: /home_settings/.test(error.message) ? MIGRATION : error.message }
  revalider()
  return { success: true }
}
