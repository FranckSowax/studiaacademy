# Messagerie WhatsApp — bilan et mise en production

Boîte de réception partagée (`/messagerie`) qui permet à l'équipe de répondre
aux clients WhatsApp via WAHA. Développée et recettée **en local** le 2026-10-31.
Rien n'est encore appliqué en production.

## 1. Ce qui est livré (jalons 1 à 6)

| Jalon | Contenu |
|---|---|
| 1 | Réception : webhook WAHA signé (HMAC), conversations et messages en base, accusés de lecture, reprise d'historique |
| 2 | Interface : liste filtrée (à répondre, à moi, épinglées, chauds…), fil, attribution à la première réponse, note interne, clôture |
| 3 | Réponse : texte, émojis, liens, phrases rapides (modifiables par les admins), médiathèque (photo, vidéo, PDF) |
| 4 | Panier : inscriptions Formations IA créées au nom du client (`fia_inscrire`), prix recalculés depuis `fia_formations`, envoi en plusieurs messages avec reprise des échecs |
| 5 | Qualification IA (OpenRouter) : stade d'achat, intention, objections, prochaine action avec bouton « Faire », bilan quotidien, coût suivi |
| 6 | Recherches clients : demandes hors catalogue numérotées (`W-XXXXXXXX`), notes signées empilées, 10 photos max, page `/messagerie/recherches` |

Accès : admins, et collaborateurs avec `profiles.inbox_access = true`.
Le navigateur ne lit jamais la base : tout passe par `/api/inbox/*` (clé service côté serveur).

## 2. Check-list de mise en production

Chaque étape est une écriture sur un système distant : **accord explicite requis avant chacune**.

1. ✅ **Base Supabase prod** — fait le 2026-10-31 (projet STUDIA ACADEMY) :
   - `security-p0` et `security-p1` étaient déjà en place ; deux correctifs appliqués par migration :
     `20261031170000` (fonctions serveur retirées à `anon`/`authenticated` — elles étaient appelables
     avec la clé publique) et `20261031171000` (résultats Kahoot solo fermés au public) ;
   - les 5 migrations `wa_*` appliquées une par une, RLS active, aucun accès `anon`/`authenticated` ;
   - méthode : `npx supabase db query --linked -f <fichier>` puis `npx supabase migration repair --status applied <version> --linked`.
     `db push` est refusé tant que les 19 migrations de juin 2026 (présentes en prod) ne sont pas dans le dépôt ;
     les 4 `legacy_*` ne doivent jamais être rejouées en prod.
2. **Service WAHA sur Railway** — voir `docs/whatsapp-waha.md` §3 (image épinglée, volume `/app/.sessions`,
   webhook vers `https://<domaine-app>/api/whatsapp/webhook`, événements `message.any,message.ack,session.status`).
3. **Variables du service app** (Railway) :
   - `WAHA_BASE_URL`, `WAHA_API_KEY`, `WAHA_SESSION=default`, `WAHA_WEBHOOK_HMAC_KEY`, `STUDIA_TEAM_PHONE` ;
   - `OPENROUTER_API_KEY` (déjà posée), `INBOX_ANALYSIS_MODEL`, éventuellement `INBOX_ANALYSIS_DAILY_CAP` / `INBOX_ANALYSIS_BATCH` ;
   - `INBOX_CRON_SECRET` (≥ 16 caractères, généré, jamais affiché) ;
   - `NEXT_PUBLIC_SITE_URL` = domaine de prod (les liens envoyés aux clients en dépendent).
4. **Tâches planifiées** (cron Railway), en-tête `Authorization: Bearer $INBOX_CRON_SECRET` :
   - `POST /api/inbox/jobs/analyze` — toutes les 15 min ;
   - `POST /api/inbox/jobs/daily-report` — une fois par jour, en fin de journée (fuseau Africa/Libreville).
5. **Déploiement de l'app**, puis appairage WhatsApp (QR ou code) du numéro de l'équipe.
6. **Accès** : passer `inbox_access = true` sur les profils des collaborateurs concernés.
7. **Recette prod** : un message depuis le numéro de test uniquement → visible dans l'inbox → réponse reçue.

## 3. Points ouverts

- Le catalogue public affiche encore des prix codés en dur ; la page merci les lit désormais en base.
- La page merci lit encore `type` et `nb` depuis l'URL.
- La page `/login` affiche les identifiants de démonstration : à retirer avant ouverture publique.
- WAHA Core : une seule session, pas d'API catalogue/commande WhatsApp (phase 6B abandonnée).
- La qualification envoie des extraits de conversation (numéros et e-mails masqués) à OpenRouter.

## 4. Vérifications locales

`npx vitest run` (174 tests), `npx eslint .` (146 problèmes, base inchangée depuis le début),
`npm run build`. Données de recette uniquement en base locale ; messages de test envoyés au seul numéro de test.
