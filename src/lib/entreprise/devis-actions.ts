'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireAdmin } from '@/lib/auth/require-admin'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'
import { emailValide } from '@/lib/studia-live/suivi-regles'
import { createAdminClient } from '@/lib/supabase/admin'
import { empreinteJeton, genererJeton } from './bilan-jeton'
import {
  composerEmailDevis, devisDepuisSaisie, nettoyerSaisie, numeroDevis, VALIDITE_LIEN_JOURS, type ContenuEmailDevis, type StatutDevis,
} from './devis'
import { lireDevisAdmin } from './devis-acces'
import { estUuid } from './dossier-regles'

/**
 * Actions de l'admin sur les devis d'une entreprise : enregistrer un
 * brouillon, le supprimer, l'envoyer au contact, suivre sa décision.
 *
 * Chaque action commence par requireAdmin(). Les montants sont toujours
 * recalculés ici à partir de la grille : un total envoyé par le
 * navigateur n'est jamais repris. Un devis envoyé ne se modifie plus.
 */

type Echec = { ok: false; error: string }
const INTROUVABLE: Echec = { ok: false, error: 'Devis introuvable.' }
const MIGRATION = 'Appliquez la migration 20261208120000_company_quotes.sql pour créer des devis.'
const SITE_PAR_DEFAUT = 'https://www.studia.academy'
const ABSENT = new Set(['42P01', 'PGRST205'])

type Admin = ReturnType<typeof createAdminClient>

const texte = (v: unknown, max: number): string | null => {
  const t = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
  return t === '' ? null : t
}
const messageBase = (code: string | undefined) => (code && ABSENT.has(code) ? MIGRATION : 'Enregistrement impossible. Réessayez dans un instant.')

/** Adresse du site pour le lien : celle depuis laquelle l'admin envoie (https), sinon NEXT_PUBLIC_SITE_URL. */
async function adresseSite(): Promise<string> {
  for (const c of [(await headers()).get('origin'), process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!c) continue
    try {
      const u = new URL(c)
      if (u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') return u.origin
    } catch {
      // candidat suivant
    }
  }
  return SITE_PAR_DEFAUT
}

async function lireEntreprise(admin: Admin, id: string) {
  const { data } = await admin.from('company_profiles').select('id, nom_entreprise, contact_nom, contact_email').eq('id', id).maybeSingle()
  return data as { id: string; nom_entreprise: string; contact_nom: string | null; contact_email: string | null } | null
}

/**
 * Crée un brouillon de devis, ou met à jour un brouillon existant. Les
 * lignes et le total sont recalculés à partir de la grille.
 */
export async function enregistrerDevis(
  id: string,
  demande: { devisId?: string | null; objet: string; saisie: unknown },
): Promise<{ ok: true; devisId: string; numero: string; alertes: string[] } | Echec> {
  const { userId } = await requireAdmin()
  if (!estUuid(id)) return { ok: false, error: 'Entreprise introuvable.' }
  const objet = texte(demande?.objet, 200)
  if (!objet) return { ok: false, error: 'Donnez un objet au devis (par exemple « Initiation IA »).' }
  const saisie = nettoyerSaisie(demande.saisie)

  const admin = createAdminClient()
  const entreprise = await lireEntreprise(admin, id)
  if (!entreprise) return { ok: false, error: 'Entreprise introuvable.' }
  const maintenant = Date.now()
  const base = { objet, entreprise: entreprise.nom_entreprise, contactNom: entreprise.contact_nom, saisie }

  // Mise à jour d'un brouillon.
  if (demande.devisId) {
    if (!estUuid(demande.devisId)) return INTROUVABLE
    const existant = await lireDevisAdmin(admin, id, demande.devisId)
    if (!existant) return INTROUVABLE
    if (existant.statut !== 'brouillon') return { ok: false, error: 'Ce devis a déjà été envoyé : il ne se modifie plus. Créez-en un nouveau.' }
    const { contenu, alertes } = devisDepuisSaisie({ ...base, numero: existant.numero }, maintenant)
    if (contenu.lignes.length === 0) return { ok: false, error: 'Ajoutez au moins une prestation au devis.' }
    const { error } = await admin
      .from('company_quotes')
      .update({ objet, saisie, contenu, total_ht: contenu.total_ht })
      .eq('id', existant.id)
      .eq('company_id', id)
      .eq('statut', 'brouillon')
    if (error) {
      console.error(`[entreprises] devis non enregistré (${error.code})`)
      return { ok: false, error: messageBase(error.code) }
    }
    revalidatePath(`/admin/entreprise/${id}`)
    return { ok: true, devisId: existant.id, numero: existant.numero, alertes }
  }

  // Création : le numéro suit le dernier devis de l'entreprise cette année.
  const annee = new Date(maintenant).getUTCFullYear()
  const prefixe = numeroDevis(annee, entreprise.nom_entreprise, 1).slice(0, -3)
  const existants = await admin.from('company_quotes').select('numero').like('numero', `${prefixe}%`).limit(1000)
  if (existants.error) {
    console.error(`[entreprises] numéros de devis illisibles (${existants.error.code})`)
    return { ok: false, error: messageBase(existants.error.code) }
  }
  const dernier = ((existants.data ?? []) as { numero: string }[]).reduce((max, d) => Math.max(max, Number(d.numero.slice(prefixe.length)) || 0), 0)

  // Deux admins peuvent créer en même temps : en cas de numéro déjà pris, on passe au suivant.
  for (let essai = 1; essai <= 5; essai++) {
    const numero = numeroDevis(annee, entreprise.nom_entreprise, dernier + essai)
    const { contenu, alertes } = devisDepuisSaisie({ ...base, numero }, maintenant)
    if (contenu.lignes.length === 0) return { ok: false, error: 'Ajoutez au moins une prestation au devis.' }
    const { data, error } = await admin
      .from('company_quotes')
      .insert({ company_id: id, numero, objet, saisie, contenu, total_ht: contenu.total_ht, cree_par: userId })
      .select('id')
      .single()
    if (!error && data) {
      revalidatePath(`/admin/entreprise/${id}`)
      return { ok: true, devisId: (data as { id: string }).id, numero, alertes }
    }
    if (error?.code !== '23505') {
      console.error(`[entreprises] devis non créé (${error?.code})`)
      return { ok: false, error: messageBase(error?.code) }
    }
  }
  return { ok: false, error: 'Le numéro du devis n’a pas pu être attribué. Réessayez.' }
}

/** Supprime un brouillon. Un devis envoyé est conservé. */
export async function supprimerBrouillon(id: string, devisId: string): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(devisId)) return INTROUVABLE
  const { data, error } = await createAdminClient()
    .from('company_quotes')
    .delete()
    .eq('id', devisId)
    .eq('company_id', id)
    .eq('statut', 'brouillon')
    .select('id')
  if (error) return { ok: false, error: messageBase(error.code) }
  if (!data || data.length === 0) return { ok: false, error: 'Seul un brouillon peut être supprimé.' }
  revalidatePath(`/admin/entreprise/${id}`)
  return { ok: true }
}

/** Aperçu de l'e-mail d'envoi, sans créer de lien. */
export async function apercuEnvoiDevis(
  id: string,
  devisId: string,
  saisie: { email: string; nom?: string | null },
): Promise<{ ok: true; destinataire: string; apercu: ContenuEmailDevis } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(devisId)) return INTROUVABLE
  const destinataire = emailValide(saisie?.email)
  if (!destinataire) return { ok: false, error: 'Saisissez l’e-mail du contact.' }
  const devis = await lireDevisAdmin(createAdminClient(), id, devisId)
  if (!devis?.contenu) return INTROUVABLE
  return { ok: true, destinataire, apercu: composerEmailDevis({ contenu: devis.contenu, contactNom: texte(saisie.nom, 120), lien: null }) }
}

/**
 * Envoie le devis au contact de l'entreprise : crée le lien secret de la
 * page du devis et l'envoie à l'adresse saisie puis confirmée. Renvoyer
 * un devis remplace son lien précédent.
 */
export async function envoyerDevis(
  id: string,
  devisId: string,
  saisie: { email: string; emailConfirme: string; nom?: string | null },
): Promise<{ ok: true; destinataire: string; lien: string } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(devisId)) return INTROUVABLE
  const destinataire = emailValide(saisie?.email)
  if (!destinataire) return { ok: false, error: 'Saisissez l’e-mail du contact.' }
  if (emailValide(saisie.emailConfirme) !== destinataire) return { ok: false, error: 'Confirmez l’adresse du contact avant l’envoi.' }
  if (!isEmailConfigured()) return { ok: false, error: 'L’envoi d’e-mails n’est pas configuré sur Studia Academy.' }

  const admin = createAdminClient()
  const [devis, entreprise] = await Promise.all([lireDevisAdmin(admin, id, devisId), lireEntreprise(admin, id)])
  if (!devis || !entreprise) return INTROUVABLE
  if (devis.statut === 'accepte' || devis.statut === 'refuse') return { ok: false, error: 'Ce devis a déjà reçu une décision : il ne se renvoie plus.' }

  const maintenant = Date.now()
  const nom = texte(saisie.nom, 120)
  // Un brouillon est daté du jour de son envoi ; un devis déjà envoyé garde sa date et sa validité.
  const contenu =
    devis.statut === 'brouillon'
      ? devisDepuisSaisie({ numero: devis.numero, objet: devis.objet, entreprise: entreprise.nom_entreprise, contactNom: nom ?? entreprise.contact_nom, saisie: devis.saisie }, maintenant).contenu
      : devis.contenu
  if (!contenu || contenu.lignes.length === 0) return { ok: false, error: 'Ce devis est vide : ajoutez une prestation avant de l’envoyer.' }

  const jeton = genererJeton()
  const lien = `${await adresseSite()}/devis/${jeton}`
  const mail = composerEmailDevis({ contenu, contactNom: nom, lien })
  const envoye = await sendEmail({ to: destinataire, subject: mail.sujet, text: mail.texte, html: mail.html })
  // Rien n'est activé tant que l'e-mail n'est pas parti : un brouillon reste un brouillon.
  if (!envoye) return { ok: false, error: 'L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.' }

  const { error } = await admin
    .from('company_quotes')
    .update({
      contenu,
      total_ht: contenu.total_ht,
      statut: 'envoye',
      destinataire,
      jeton_hash: empreinteJeton(jeton),
      lien_expire_le: new Date(maintenant + VALIDITE_LIEN_JOURS * 24 * 3600 * 1000).toISOString(),
      envoye_le: new Date(maintenant).toISOString(),
    })
    .eq('id', devis.id)
    .eq('company_id', id)
  if (error) {
    console.error(`[entreprises] devis non marqué envoyé (${error.code})`)
    return { ok: false, error: 'L’e-mail est parti mais le lien n’a pas pu être activé. Renvoyez le devis.' }
  }
  const fiche = await admin.from('company_profiles').update({ contact_email: destinataire, ...(nom ? { contact_nom: nom } : {}) }).eq('id', id)
  if (fiche.error) console.error(`[entreprises] contact non mis à jour (${fiche.error.code})`)
  revalidatePath(`/admin/entreprise/${id}`)
  return { ok: true, destinataire, lien }
}

/** Enregistre la décision du client sur un devis envoyé, ou la retire. */
export async function deciderDevis(id: string, devisId: string, statut: StatutDevis): Promise<{ ok: true } | Echec> {
  await requireAdmin()
  if (!estUuid(id) || !estUuid(devisId)) return INTROUVABLE
  if (statut !== 'envoye' && statut !== 'accepte' && statut !== 'refuse') return { ok: false, error: 'Décision inconnue.' }
  const { data, error } = await createAdminClient()
    .from('company_quotes')
    .update({ statut, decide_le: statut === 'envoye' ? null : new Date().toISOString() })
    .eq('id', devisId)
    .eq('company_id', id)
    .in('statut', ['envoye', 'accepte', 'refuse'])
    .select('id')
  if (error) return { ok: false, error: messageBase(error.code) }
  if (!data || data.length === 0) return { ok: false, error: 'Seul un devis envoyé peut recevoir une décision.' }
  revalidatePath(`/admin/entreprise/${id}`)
  return { ok: true }
}
