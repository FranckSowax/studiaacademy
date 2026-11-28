'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EVENEMENTS_MAX_MAX, EVENEMENTS_MAX_MIN } from '@/lib/home/event-settings'
import { saveHomeSlide } from '@/lib/home/slide-actions'
import { cleanMessage } from '@/lib/formations/enrollment-payment'
import { sendWhatsApp } from '@/lib/whatsapp'
import {
  dateEvenement, isEventType, isFrequence, occurrences, peutDecider, slidePourEvenement,
} from '@/lib/events/rules'

/**
 * Gestion des événements en présentiel (table `presentiel_sessions`) et de
 * leur affichage sur la page d'accueil, depuis l'écran d'administration.
 * Chaque action vérifie le rôle admin ; les policies RLS le revérifient.
 */

type Resultat = { success: boolean; error?: string }
/** Création : nombre de dates créées, et avertissement si le slide n'a pas pu être ajouté. */
type ResultatCreation = Resultat & { crees?: number; avertissement?: string }

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
  /** formation | masterclass | presentation | evenement (défaut : formation). */
  type?: string
  /** Formation en ligne dont l'événement est la version en présentiel. */
  formation_id?: string | null
  /** Création seulement : répète l'événement (une ligne par date, même série). */
  recurrence?: { frequence: string; nombre: number }
  /** Création seulement : annonce la première date dans un slide de l'accueil. */
  creer_slide?: boolean
}

const URL_IMAGE = /^(\/[^/]|https:\/\/)\S{0,1000}$/
const MIGRATION = 'Appliquez la migration 20261129120000_events_home.sql pour activer ce réglage.'
const MIGRATION_TYPES =
  'Appliquez la migration 20261202120000_events_types_payments.sql pour gérer les types, les séries et les paiements.'
const COLONNES_RECENTES = /\b(type|formation_id|serie_id|payment_\w+|admin_note|decided_\w+)\b/
const messageErreur = (message: string) => (COLONNES_RECENTES.test(message) ? MIGRATION_TYPES : message)

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
export async function saveEvenement(input: EvenementInput): Promise<ResultatCreation> {
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
  const base = {
    ...champs,
    type: isEventType(input.type) ? input.type : 'formation',
    afficher_accueil: input.afficher_accueil !== false,
    // WHY: le formulaire de modification n'envoie pas la formation d'origine ;
    // on ne l'écrit que si elle est fournie, pour ne pas l'effacer.
    ...(input.formation_id !== undefined ? { formation_id: input.formation_id } : {}),
  }

  if (input.id) {
    const { error } = await supabase.from('presentiel_sessions').update(base).eq('id', input.id)
    if (error) return { success: false, error: messageErreur(error.message) }
    revalider()
    return { success: true }
  }

  // Création : une ligne par date, reliées par serie_id quand il y en a plusieurs.
  const frequence = isFrequence(input.recurrence?.frequence) ? input.recurrence.frequence : 'none'
  const dates = occurrences(debut, fin, frequence, input.recurrence?.nombre ?? 1)
  const serieId = dates.length > 1 ? crypto.randomUUID() : null
  const { data: crees, error } = await supabase
    .from('presentiel_sessions')
    .insert(dates.map((d) => ({ ...base, date_debut: d.debut, date_fin: d.fin, serie_id: serieId })))
    .select('id, date_debut')
  if (error) return { success: false, error: messageErreur(error.message) }

  let avertissement: string | undefined
  const premier = [...(crees ?? [])].sort((x, y) => String(x.date_debut).localeCompare(String(y.date_debut)))[0]
  if (input.creer_slide && !champs.is_published) {
    avertissement = "L'événement est enregistré en brouillon : le slide d'accueil n'a pas été créé. Ajoutez-le depuis Page d'accueil une fois l'événement publié."
  } else if (input.creer_slide && premier) {
    const slide = await saveHomeSlide({
      ...slidePourEvenement({ ...base, id: premier.id as string, date_debut: premier.date_debut as string }),
      is_active: true,
    })
    if (!slide.success) {
      avertissement = `L'événement est créé, mais le slide d'accueil n'a pas pu être ajouté : ${slide.error ?? 'erreur inconnue'}`
    }
  }

  revalider()
  return { success: true, crees: crees?.length ?? 0, avertissement }
}

/**
 * Programme une formation en ligne en présentiel : crée l'événement (ou la
 * série d'événements) à partir de la fiche de la formation — titre,
 * description, image, catégorie, formateur — avec la date, les places et le
 * prix choisis. La formation en ligne n'est pas modifiée.
 *
 * @example
 * await programmerFormationEnPresentiel({ formation_id, date_debut, places_total: 20, prix_fcfa: 15000, creer_slide: true })
 */
export async function programmerFormationEnPresentiel(input: {
  formation_id: string
  type?: string
  date_debut: string
  date_fin?: string | null
  lieu?: string | null
  places_total: number
  prix_fcfa: number
  is_published?: boolean
  recurrence?: { frequence: string; nombre: number }
  creer_slide?: boolean
}): Promise<ResultatCreation> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }

  const { data: formation } = await supabase
    .from('formations')
    .select('id, titre, sous_titre, description, cover_image, categorie, formateur_nom')
    .eq('id', input.formation_id)
    .maybeSingle()
  if (!formation) return { success: false, error: 'Formation introuvable.' }

  return saveEvenement({
    titre: formation.titre as string,
    description: (formation.description as string | null) ?? (formation.sous_titre as string | null),
    categorie: formation.categorie as string | null,
    cover_image: formation.cover_image as string | null,
    formateur_nom: formation.formateur_nom as string | null,
    date_debut: input.date_debut,
    date_fin: input.date_fin ?? null,
    lieu: input.lieu ?? 'Studia Academy',
    ville: 'Libreville',
    places_total: input.places_total,
    prix_fcfa: input.prix_fcfa,
    is_published: input.is_published !== false,
    afficher_accueil: true,
    type: input.type ?? 'formation',
    formation_id: formation.id as string,
    recurrence: input.recurrence,
    creer_slide: input.creer_slide,
  })
}

/**
 * Confirme ou annule une réservation. Confirmer valide le paiement (espèces
 * encaissées ou capture Airtel Money vérifiée) ; annuler libère la place.
 * `notified` indique si le message WhatsApp est bien parti.
 */
export async function decideReservation(
  reservationId: string,
  decision: 'confirmed' | 'cancelled',
  note?: string,
): Promise<Resultat & { notified?: boolean }> {
  const supabase = await clientAdmin()
  if (!supabase) return { success: false, error: 'Accès admin requis' }
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // WHY: les réservations se font sans compte ; elles ne sont lues et écrites
  // que par le serveur (service_role), après la vérification du rôle ci-dessus.
  const admin = createAdminClient()
  const { data: resa } = await admin
    .from('presentiel_reservations')
    .select('id, status, phone, prenom, session_id')
    .eq('id', reservationId)
    .maybeSingle()
  if (!resa) return { success: false, error: 'Réservation introuvable.' }
  if (!peutDecider(resa.status as string, decision)) {
    return { success: false, error: 'Cette réservation a déjà été traitée. Actualisez la page.' }
  }

  const adminNote = decision === 'cancelled' ? cleanMessage(note) : null
  const { data: maj, error } = await admin
    .from('presentiel_reservations')
    .update({ status: decision, admin_note: adminNote, decided_at: new Date().toISOString(), decided_by: user?.id ?? null })
    .eq('id', reservationId)
    .eq('status', resa.status)
    .select('id')
  if (error) return { success: false, error: messageErreur(error.message) }
  if (!maj?.length) return { success: false, error: 'Cette réservation a déjà été traitée. Actualisez la page.' }

  if (decision === 'cancelled') {
    const { error: placeError } = await admin.rpc('release_presentiel_seat', { p_session_id: resa.session_id })
    if (placeError) console.error('[evenements] place non libérée:', placeError.code)
  }

  const { data: evenement } = await admin
    .from('presentiel_sessions')
    .select('titre, date_debut, lieu, ville')
    .eq('id', resa.session_id)
    .maybeSingle()
  let notified = false
  if (resa.phone && evenement) {
    const quand = dateEvenement(evenement.date_debut as string)
    const ou = (evenement.lieu as string | null) || (evenement.ville as string | null) || 'Libreville'
    notified = await sendWhatsApp(
      resa.phone as string,
      decision === 'confirmed'
        ? `✅ Bonjour ${resa.prenom}, votre place est confirmée pour *${evenement.titre}*.\n📅 ${quand}\n📍 ${ou}\nÀ très vite !\n— Studia Academy`
        : `Bonjour ${resa.prenom}, votre réservation pour *${evenement.titre}* (${quand}) est annulée.${adminNote ? `\nMotif : ${adminNote}` : ''}\nÉcrivez-nous pour toute question.\n— Studia Academy`,
    )
  }

  revalider()
  return { success: true, notified }
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
