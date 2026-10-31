# WhatsApp via WAHA — installation, déploiement et cas d'usage

> Remplace Whapi depuis le 2026-10-31. Code : `src/lib/whatsapp/` · Webhook : `src/app/api/whatsapp/webhook/route.ts`
> Doc officielle : https://waha.devlike.pro/docs/overview/quick-start/

## 1. Ce qu'est WAHA (et le risque à accepter)

WAHA est une API HTTP **auto-hébergée** (Docker) qui pilote un compte WhatsApp normal, comme
WhatsApp Web, après scan d'un QR code. Pas de coût par message, pas de validation de templates Meta.

⚠️ **Ce n'est pas l'API officielle WhatsApp Business (Meta Cloud API).** WhatsApp peut
restreindre ou bannir un numéro qui envoie en masse à des contacts qui ne l'ont pas sollicité.
Règles appliquées dans le code et à respecter :

- Utiliser un **numéro dédié** à Studia (pas le numéro personnel d'un membre de l'équipe).
- N'écrire qu'à des personnes qui ont **donné leur numéro pour ça** (inscription, réservation, parent renseigné).
- Quotas en place : 5 messages/heure par destinataire, 200 envois/jour par professeur, quotas par IP
  sur les parcours anonymes (`src/lib/security/rate-limit.ts`).
- Répondre aux messages entrants : la conversation devient « initiée par l'utilisateur », c'est le cas le plus sûr.
- Pas de campagnes de masse vers des listes froides.

## 2. Installation locale (5 minutes)

```bash
# 1. Secrets : générer des valeurs longues
cp .env.example .env.waha   # puis renseigner WAHA_API_KEY, WAHA_DASHBOARD_PASSWORD, WAHA_WEBHOOK_HMAC_KEY
# 2. Lancer WAHA (port 3001 pour ne pas gêner Next.js)
docker compose -f docker-compose.waha.yml --env-file .env.waha up -d
# 3. Ouvrir http://localhost:3001/dashboard → se connecter → démarrer la session "default"
#    → statut SCAN_QR → scanner avec le téléphone (WhatsApp > Appareils connectés)
```

Dans `.env.local` de l'app : `WAHA_BASE_URL=http://localhost:3001`, `WAHA_API_KEY` et
`WAHA_WEBHOOK_HMAC_KEY` identiques à ceux du conteneur.

Test d'envoi :

```bash
curl -X POST http://localhost:3001/api/sendText \
  -H "X-Api-Key: $WAHA_API_KEY" -H "Content-Type: application/json" \
  -d '{"session":"default","chatId":"241XXXXXXXX@c.us","text":"Test Studia"}'
```

## 3. Déploiement Railway (production)

1. **Nouveau service** dans le projet Railway de Studia → *Deploy from Docker image* →
   `devlikeapro/waha:<version épinglée>` (choisir la version sur https://portal.devlike.pro/docker-image).
2. **Volume** monté sur `/app/.sessions` (sinon la session WhatsApp est perdue à chaque redéploiement).
3. **Variables du service WAHA** :
   - `WAHA_API_KEY`, `WAHA_DASHBOARD_USERNAME`, `WAHA_DASHBOARD_PASSWORD`,
     `WHATSAPP_SWAGGER_USERNAME`, `WHATSAPP_SWAGGER_PASSWORD`
   - `WHATSAPP_DEFAULT_ENGINE` : `WEBJS` (navigateur embarqué, ~0,5–1 Go RAM) ou `NOWEB`/`GOWS` (sans navigateur, plus léger)
   - `WHATSAPP_HOOK_URL=https://<domaine-app>/api/whatsapp/webhook`
   - `WHATSAPP_HOOK_EVENTS=message.any,message.ack,session.status`
   - `WHATSAPP_HOOK_HMAC_KEY=<secret partagé>`
   - `TZ=Africa/Libreville`
4. **Réseau** : l'app appelle WAHA par le réseau privé Railway :
   `WAHA_BASE_URL=http://<nom-du-service>.railway.internal:3000` (variables du service **app**).
   Ne générer un domaine public pour WAHA que le temps de scanner le QR dans le dashboard, puis le retirer.
5. **Variables du service app** : `WAHA_BASE_URL`, `WAHA_API_KEY`, `WAHA_SESSION=default`,
   `WAHA_WEBHOOK_HMAC_KEY`, `STUDIA_TEAM_PHONE`. Supprimer `WHAPI_TOKEN`.
6. Exécuter `supabase/security-p1.sql` et les migrations de la messagerie **avant** de déployer l'app
   (check-list complète : `docs/messagerie.md`).

Supervision : surveiller l'événement `session.status` (dashboard WAHA) — si la session passe en
`FAILED`/`SCAN_QR`, plus aucun message ne part (l'app journalise `[waha] Erreur envoi`).

## 4. Ce qui est branché aujourd'hui

| Parcours | Déclencheur | Message |
|---|---|---|
| Correction de copies | Prof clique « Envoyer » | Rapport élève + parent |
| Devoir QCM en ligne | Élève soumet | Note au parent (si renseigné) |
| Réservation présentiel | Formulaire public | Confirmation élève + alerte équipe |
| Demande formation en ligne | Élève connecté | Alerte équipe |
| Inscriptions (admin) | Validation admin | Messages élève / équipe |
| Pack entreprise | Demande de pack | Alerte équipe |
| Messages entrants et sortants | Webhook WAHA signé | Boîte de réception `/messagerie` (tables `wa_*`, voir `docs/messagerie.md`) |

## 5. Cas d'usage possibles avec WAHA

Classés par valeur pour Studia, avec ce qu'ils réutilisent dans l'app.

### Élèves, parents, professeurs
1. **QCM directement dans WhatsApp** : questions envoyées une par une (liste ou sondage
   `sendPoll`/`sendList`), réponses reçues par webhook, correction par le worker QCM existant.
   Idéal pour les élèves sans ordinateur ni forfait data confortable.
2. **Rendu de copie par photo** : l'élève envoie la photo de sa copie au numéro Studia →
   OCR Mistral (`document-ocr`) → file de correction du prof.
3. **Groupes de classe** : le prof relie un groupe WhatsApp à sa classe ; publication automatique
   du lien et du code d'un devoir, des rappels J-1, du code d'une partie Kahoot live.
4. **Rapport en PDF** (`sendFile`) en plus du lien, et bulletin hebdomadaire aux parents.
5. **Rappels de devoirs non rendus** aux élèves inscrits (avant la date limite).

### Formations IA et présentiel
6. **Parcours d'inscription complet** : confirmation + référence de paiement Mobile Money,
   relances J-3 / J-1 / H-2, lien de la session, certificat PDF à la fin.
7. **Preuve de paiement Airtel/Moov par capture** : le client envoie la capture du reçu → OCR →
   validation en un clic par l'admin → confirmation automatique.
8. **Micro-formation « 10 jours sur WhatsApp »** : une leçon courte + un quiz par jour (contenu des formations existantes).
9. **Kahoot solo dans WhatsApp** : questions/réponses par sondage, classement renvoyé à la fin.

### Assistant IA
10. **Assistant Studia 24/7** : répond aux questions (catalogue, prix, dates, orientation) avec
    Mistral + le contenu de `formations-ia` ; transfert vers un humain sur demande.
11. **Outils IA par WhatsApp** (CV, lettre de motivation, fiche de révision) facturés en crédits,
    avec le même débit atomique que le site.
12. **Connexion sans mot de passe** : code à usage unique envoyé sur WhatsApp (à concevoir avec soin : quotas, expiration 5 min).

### Entreprises (Studia Business)
13. **Diagnostic de compétences** : envoi du lien de test aux salariés, relances, rapport au manager.
14. **Qualification des demandes de devis** : questions automatiques (effectif, besoin, budget) avant transmission à l'équipe.

### Équipe et pilotage
15. **Boîte de réception WhatsApp dans `/admin`** : fil des messages entrants (déjà stockés),
    réponse depuis l'admin, assignation, statut traité/non traité.
16. **Alertes internes** dans un groupe équipe : nouvelle inscription, paiement à valider, session WAHA déconnectée.
17. **Statuts / Chaîne WhatsApp** pour annoncer les nouvelles sessions (marketing organique, sans envoi individuel).

### Limites à connaître
- WAHA Core gère **une session (un numéro)** ; plusieurs numéros (ex. un par école partenaire) demandent l'édition Plus.
- Boutons et listes interactifs : support variable selon le moteur et les mises à jour WhatsApp ;
  prévoir toujours un repli « répondez 1, 2 ou 3 ».
- Tout envoi proactif à grande échelle augmente le risque de bannissement : pour les campagnes,
  l'API officielle Meta reste la voie sûre.
