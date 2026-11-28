'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Save, Trash2, Video, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateFormation } from '@/lib/formations/admin-actions'
import { INTRO_VIDEO_MAX, resoudreVideoIntro, vignetteVideoIntro } from '@/lib/formations/intro-video'
import { capturerVignette } from '@/lib/formations/video-capture'
import { SECTEURS } from '@/lib/secteurs'
import type { Formation } from '@/types/formation'

const IMAGE_MAX_OCTETS = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// Mêmes limites que le bucket (migration 20261127120000_formation_videos_bucket.sql).
const VIDEO_BUCKET = 'formation-videos'
const VIDEO_MAX_MO = 200
const VIDEO_TYPES = ['video/mp4', 'video/webm']

const lignes = (texte: string) =>
  texte
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

/**
 * Édition complète d'une formation existante (écran d'administration) :
 * titre, prix, description, image de couverture, objectifs, formateur…
 * Le slug (adresse publique) ne change pas, pour ne casser aucun lien.
 */
export function AdminFormationEditor({ formation, onClose }: { formation: Formation; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    titre: formation.titre,
    sous_titre: formation.sous_titre ?? '',
    categorie: formation.categorie ?? '',
    niveau: formation.niveau ?? '',
    duree_estimee: formation.duree_estimee ?? '',
    prix_fcfa: String(formation.prix_fcfa ?? 0),
    cover_image: formation.cover_image ?? '',
    description: formation.description ?? '',
    objectifs: (formation.objectifs ?? []).join('\n'),
    prerequis: (formation.prerequis ?? []).join('\n'),
    formateur_nom: formation.formateur_nom ?? '',
    formateur_bio: formation.formateur_bio ?? '',
    intro_video_url: formation.intro_video_url ?? '',
    secteur_slug: formation.secteur_slug ?? '',
    places_max: formation.places_max ? String(formation.places_max) : '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const champ = (cle: keyof typeof form) => ({
    value: form[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [cle]: e.target.value })),
  })

  const envoyerImage = async (fichier: File) => {
    setErreur(null)
    if (!IMAGE_TYPES.includes(fichier.type)) {
      setErreur('Image refusée : formats acceptés JPG, PNG ou WebP.')
      return
    }
    if (fichier.size > IMAGE_MAX_OCTETS) {
      setErreur('Image trop lourde : 5 Mo maximum.')
      return
    }
    setUploading(true)
    const supabase = createClient()
    const ext = fichier.type === 'image/png' ? 'png' : fichier.type === 'image/webp' ? 'webp' : 'jpg'
    const chemin = `${formation.id}/cover-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('formations')
      .upload(chemin, fichier, { contentType: fichier.type })
    if (error) setErreur(`Envoi de l'image impossible : ${error.message}`)
    else {
      const { data } = supabase.storage.from('formations').getPublicUrl(chemin)
      setForm((f) => ({ ...f, cover_image: data.publicUrl }))
    }
    setUploading(false)
  }

  const envoyerVideo = async (fichier: File) => {
    setErreur(null)
    if (!VIDEO_TYPES.includes(fichier.type)) {
      setErreur('Vidéo refusée : formats acceptés MP4 ou WebM.')
      return
    }
    if (fichier.size > VIDEO_MAX_MO * 1024 * 1024) {
      setErreur(`Vidéo trop lourde : ${VIDEO_MAX_MO} Mo maximum. Compressez-la ou collez un lien YouTube / Vimeo.`)
      return
    }
    setUploadingVideo(true)
    const supabase = createClient()
    const ext = fichier.type === 'video/webm' ? 'webm' : 'mp4'
    const chemin = `${formation.id}/intro-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .upload(chemin, fichier, { contentType: fichier.type, cacheControl: '31536000' })
    if (error) setErreur(`Envoi de la vidéo impossible : ${error.message}`)
    else {
      // Vignette : une capture de la vidéo, déposée à côté (même chemin, .jpg).
      // Sans elle la fiche affiche quand même une image du début de la vidéo.
      const capture = await capturerVignette(fichier)
      const envoiCapture = capture
        ? await supabase.storage
            .from(VIDEO_BUCKET)
            .upload(chemin.replace(/\.(mp4|webm)$/, '.jpg'), capture, { contentType: 'image/jpeg', cacheControl: '31536000' })
        : null
      if (!capture || envoiCapture?.error) {
        setErreur(
          "Vidéo envoyée, mais sa vignette n'a pas pu être créée : la fiche affichera une image du début de la vidéo."
        )
      }
      const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(chemin)
      setForm((f) => ({ ...f, intro_video_url: data.publicUrl }))
    }
    setUploadingVideo(false)
  }

  const apercuVideo = resoudreVideoIntro(form.intro_video_url)

  const enregistrer = async () => {
    setErreur(null)
    const prix = Number(form.prix_fcfa)
    if (!form.titre.trim()) return setErreur('Le titre est obligatoire.')
    if (!Number.isInteger(prix) || prix < 0) return setErreur('Le prix doit être un nombre entier, 0 pour une formation gratuite.')
    const video = form.intro_video_url.trim()
    if (video && !resoudreVideoIntro(video)) {
      return setErreur('Vidéo non prise en charge : collez un lien YouTube, Vimeo, ou un fichier .mp4 / .webm en https://')
    }
    setSaving(true)
    const res = await updateFormation(formation.id, {
      titre: form.titre,
      sous_titre: form.sous_titre,
      categorie: form.categorie,
      niveau: form.niveau,
      duree_estimee: form.duree_estimee,
      prix_fcfa: prix,
      cover_image: form.cover_image,
      description: form.description,
      objectifs: lignes(form.objectifs),
      prerequis: lignes(form.prerequis),
      formateur_nom: form.formateur_nom,
      formateur_bio: form.formateur_bio,
      // Envoyée seulement si elle change : les autres champs restent enregistrables
      // même si la colonne n'existe pas encore en base (migration non appliquée).
      ...(video !== (formation.intro_video_url ?? '') ? { intro_video_url: video } : {}),
      ...(form.secteur_slug !== (formation.secteur_slug ?? '') ? { secteur_slug: form.secteur_slug } : {}),
      // WHY: envoyé seulement s'il change — l'enregistrement reste possible avant la migration.
      ...(form.places_max.trim() !== (formation.places_max ? String(formation.places_max) : '')
        ? { places_max: form.places_max.trim() === '' ? null : Number(form.places_max) }
        : {}),
    })
    setSaving(false)
    if (!res.success) return setErreur(res.error || 'Enregistrement impossible.')
    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editer-formation-titre"
    >
      <div className="my-auto w-full max-w-2xl rounded-3xl bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 id="editer-formation-titre" className="text-lg font-bold">Modifier la formation</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <Champ id="f-titre" label="Titre *"><Input id="f-titre" {...champ('titre')} maxLength={160} className="rounded-xl" /></Champ>
          <Champ id="f-sous-titre" label="Sous-titre"><Input id="f-sous-titre" {...champ('sous_titre')} maxLength={240} className="rounded-xl" /></Champ>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ id="f-prix" label="Prix (FCFA)" aide="0 = formation gratuite, accès immédiat.">
              <Input id="f-prix" type="number" min={0} step={1} inputMode="numeric" {...champ('prix_fcfa')} className="rounded-xl" />
            </Champ>
            <Champ id="f-duree" label="Durée estimée"><Input id="f-duree" placeholder="6 semaines" {...champ('duree_estimee')} className="rounded-xl" /></Champ>
            <Champ id="f-categorie" label="Catégorie"><Input id="f-categorie" {...champ('categorie')} className="rounded-xl" /></Champ>
            <Champ id="f-niveau" label="Niveau"><Input id="f-niveau" placeholder="Tous niveaux" {...champ('niveau')} className="rounded-xl" /></Champ>
          </div>

          <Champ
            id="f-places"
            label="Limiter le nombre d’inscriptions"
            aide="Laissez vide pour ne pas limiter. Avec une limite, la couverture affiche le bandeau « Places limitées », puis « Complet » : les inscriptions se ferment alors toutes seules."
          >
            <Input id="f-places" type="number" min={1} step={1} inputMode="numeric" placeholder="Illimité" {...champ('places_max')} className="rounded-xl sm:max-w-[220px]" />
          </Champ>

          <Champ
            id="f-secteur"
            label="Formation métier du secteur"
            aide="Rattache cette formation à la fiche du secteur et à sa carte « Boostez votre métier » de l'accueil. Une seule formation par secteur : la précédente est détachée."
          >
            <select
              id="f-secteur"
              value={form.secteur_slug}
              onChange={(e) => setForm((f) => ({ ...f, secteur_slug: e.target.value }))}
              className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
            >
              <option value="">Aucun secteur</option>
              {SECTEURS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </Champ>

          <Champ id="f-description" label="Description">
            <Textarea id="f-description" rows={6} {...champ('description')} className="rounded-xl" />
          </Champ>

          {/* Image de couverture */}
          <div className="space-y-1.5">
            <Label htmlFor="f-image">Image de couverture</Label>
            <div className="flex flex-wrap items-start gap-3">
              <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-xl border border-[#f0ebe3] bg-[#fbf8f3]">
                {form.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu admin, source libre
                  <img src={form.cover_image} alt="Aperçu de la couverture" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Aucune image</div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" disabled={uploading}>
                    <label htmlFor="f-image" className="cursor-pointer">
                      {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
                      {form.cover_image ? 'Remplacer' : 'Choisir une image'}
                    </label>
                  </Button>
                  {form.cover_image && (
                    <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, cover_image: '' }))}>
                      <Trash2 className="mr-1 h-4 w-4" />Retirer
                    </Button>
                  )}
                </div>
                <input
                  id="f-image"
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  className="sr-only"
                  onChange={(e) => {
                    const fichier = e.target.files?.[0]
                    if (fichier) void envoyerImage(fichier)
                    e.target.value = ''
                  }}
                />
                <Input
                  aria-label="Adresse de l'image"
                  placeholder="ou collez l'adresse d'une image"
                  {...champ('cover_image')}
                  className="rounded-xl text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP, 5 Mo maximum. Une adresse externe ne s&apos;affiche sur le site que si elle
                  vient de Supabase ou d&apos;Unsplash.
                </p>
              </div>
            </div>
          </div>

          {/* Vidéo de présentation : fichier téléversé ou lien */}
          <div className="space-y-1.5">
            <Label htmlFor="f-video">Vidéo de présentation</Label>
            {apercuVideo?.kind === 'fichier' && (
              <video
                key={apercuVideo.src}
                src={apercuVideo.src.includes('#') ? apercuVideo.src : `${apercuVideo.src}#t=0.1`}
                poster={vignetteVideoIntro(apercuVideo.src) ?? undefined}
                controls
                muted
                playsInline
                preload="metadata"
                className="aspect-video w-full max-w-sm rounded-xl border border-[#f0ebe3] bg-black"
                aria-label="Aperçu de la vidéo de présentation"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" disabled={uploadingVideo}>
                <label htmlFor="f-video-fichier" className="cursor-pointer">
                  {uploadingVideo ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Video className="mr-1 h-4 w-4" />}
                  {uploadingVideo ? 'Envoi en cours…' : form.intro_video_url ? 'Remplacer par un fichier' : 'Téléverser une vidéo'}
                </label>
              </Button>
              {form.intro_video_url && !uploadingVideo && (
                <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, intro_video_url: '' }))}>
                  <Trash2 className="mr-1 h-4 w-4" />Retirer
                </Button>
              )}
            </div>
            <input
              id="f-video-fichier"
              type="file"
              accept={VIDEO_TYPES.join(',')}
              className="sr-only"
              disabled={uploadingVideo}
              onChange={(e) => {
                const fichier = e.target.files?.[0]
                if (fichier) void envoyerVideo(fichier)
                e.target.value = ''
              }}
            />
            <Input
              id="f-video"
              type="url"
              inputMode="url"
              placeholder="ou collez un lien YouTube, Vimeo ou .mp4"
              maxLength={INTRO_VIDEO_MAX}
              {...champ('intro_video_url')}
              className="rounded-xl text-xs"
            />
            {uploadingVideo && (
              <p role="status" className="text-xs text-[#a84d16]">
                Envoi de la vidéo… gardez cette fenêtre ouverte, cela peut prendre plusieurs minutes.
              </p>
            )}
            {apercuVideo?.kind === 'embed' && (
              <p className="text-xs text-green-700">Lien reconnu : la vidéo sera intégrée à la fiche.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Fichier MP4 ou WebM, {VIDEO_MAX_MO} Mo maximum — ou un lien YouTube / Vimeo. Affichée sur la fiche,
              au-dessus de « À propos de cette formation ». Pensez à cliquer sur Enregistrer.
            </p>
          </div>

          <Champ id="f-objectifs" label="Objectifs (un par ligne)">
            <Textarea id="f-objectifs" rows={4} {...champ('objectifs')} className="rounded-xl" />
          </Champ>
          <Champ id="f-prerequis" label="Prérequis (un par ligne)">
            <Textarea id="f-prerequis" rows={3} {...champ('prerequis')} className="rounded-xl" />
          </Champ>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ id="f-formateur" label="Formateur"><Input id="f-formateur" {...champ('formateur_nom')} className="rounded-xl" /></Champ>
            <Champ id="f-bio" label="Présentation du formateur">
              <Textarea id="f-bio" rows={2} {...champ('formateur_bio')} className="rounded-xl" />
            </Champ>
          </div>
        </div>

        {erreur && <p role="alert" className="mt-3 text-sm text-red-600">{erreur}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={enregistrer} disabled={saving || uploading || uploadingVideo} className="bg-[#e97e42] text-white hover:bg-[#d56a2e]">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  )
}

function Champ({ id, label, aide, children }: { id: string; label: string; aide?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
    </div>
  )
}
