# Module Formations IA (F1-F4) — Guide de déploiement

Module web de présentation + inscription des 4 formations IA Studia Academy.
Marché Gabon : FCFA, Mobile Money (pas de paiement carte), mobile-first, français.

## Pages

| Route | Rôle |
|---|---|
| `/formations-ia` | Hub : les 4 formations (« spectre Studia »), parcours F1→F4, prochaines sessions, CTA entreprise |
| `/formations-ia/[slug]` | Page de vente (hero promesse, douleurs, timeline 8h30→16h30, kit, méthode, témoignages, tarifs, FAQ, CTA sticky mobile) |
| `/formations-ia/inscription?f=[slug]&session=[id]` | Formulaire d'inscription (individuel/entreprise, UTM persistés) |
| `/formations-ia/merci` | Confirmation : récap, instructions Mobile Money + code STU-Fx-0000, WhatsApp, .ics |
| `/formations-ia/entreprises` | Offre intra + formulaire de devis |
| `/api/formations-ia/ics` | Génération du fichier calendrier (.ics) |

La page **F4 (ia-direction)** n'a pas de formulaire d'inscription : CTA
« Demander un entretien » (formulaire court → `fia_leads_entreprises`),
tarif « sur devis », ton executive.

## Base de données (Supabase)

⚠️ **Tables préfixées `fia_`** : la table `formations` existe déjà dans ce
projet (formations en ligne du site). Le spec d'origine (`formations`,
`sessions`, `inscriptions`) aurait créé des collisions.

Appliquer dans l'ordre, via le SQL Editor Supabase (ou `supabase db push`) :

1. `supabase/migrations-formations-ia/001_schema.sql` — tables, trigger de
   code public (`STU-F1-0042`), vue `fia_sessions_publiques` (places
   restantes calculées), RPC `fia_inscrire` (validation serveur du téléphone
   +241 et insertion), RLS.
2. `supabase/migrations-formations-ia/002_seed.sql` — 4 formations + 2
   sessions fictives chacune. **Ajuster prix et dates avant production.**

### RLS (résumé)
- `fia_formations`, `fia_sessions` : lecture publique (catalogue).
- `fia_inscriptions` : **insert public uniquement** (anon) ; select/update
  réservés au rôle `authenticated` (équipe Studia). Le code public est
  renvoyé au visiteur par le RPC `fia_inscrire` (security definer), jamais
  par un select direct.
- `fia_leads_entreprises` : insert public, lecture équipe.
- `fia_sessions_publiques` : vue (owner) qui expose uniquement l'agrégat
  « places restantes », sans exposer les inscriptions.

### Validation téléphone
Format exigé : `+241` suivi de 8 ou 9 chiffres. Vérifié **côté client**
(`PHONE_REGEX` dans `src/lib/formations-ia.ts`) **et côté serveur** (regex
dans le RPC `fia_inscrire` — l'insert échoue sinon).

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (déjà utilisée par le site) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (déjà utilisée) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (sitemap/robots), ex. `https://www.studia-academy.ga` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp Studia, format international sans `+` ni espaces, ex. `24106XXXXXX` |
| `NEXT_PUBLIC_AIRTEL_MONEY` | Numéro Airtel Money affiché sur la page merci |
| `NEXT_PUBLIC_MOOV_MONEY` | Numéro Moov Money affiché sur la page merci |

Sans Supabase configuré, les pages restent fonctionnelles : les sessions de
secours (`fallbackSessions`) s'affichent, et le formulaire propose le repli
WhatsApp si l'insert échoue.

## Déploiement Railway

1. **Créer le service** : Railway → New Project → Deploy from GitHub repo
   (`FranckSowax/studiaacademy`). Railway détecte Next.js (build
   `npm run build`, start `npm run start`).
2. **Variables** : Settings → Variables → ajouter les 6 variables ci-dessus.
3. **Domaine** : Settings → Networking → Generate Domain (ou domaine custom
   → mettre à jour `NEXT_PUBLIC_SITE_URL`).
4. **Supabase** : appliquer les 2 fichiers SQL (voir plus haut) dans le
   projet Supabase référencé par `NEXT_PUBLIC_SUPABASE_URL`.
5. Vérifier : `/formations-ia` (sessions réelles affichées, plus les
   fallbacks), une inscription de test → code `STU-F1-0001` sur `/merci`,
   la ligne visible dans `fia_inscriptions` (dashboard Supabase).

## Back-office (confirmation des paiements)

Le règlement Mobile Money est confirmé **manuellement** : l'équipe (connectée,
rôle `authenticated`) passe `fia_inscriptions.statut` de
`en_attente_paiement` à `payee` après réception — depuis le dashboard
Supabase ou un futur écran admin.

## Contenu à finaliser avant production

- [ ] Prix réels (seed + `src/lib/formations-ia.ts`)
- [ ] Dates de sessions réelles (table `fia_sessions`)
- [ ] Numéros WhatsApp / Airtel / Moov (variables d'env)
- [ ] Témoignages réels (placeholder dans `formations-ia.ts`, marqués par un commentaire)
- [ ] `NEXT_PUBLIC_SITE_URL` définitif
