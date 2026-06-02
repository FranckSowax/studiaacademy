# Espace Professeur — Studia Academy
**Date :** 2026-06-02  
**Statut :** Approuvé  
**Stack :** Next.js 15 · Supabase · Mistral API · Whapi · Railway

---

## 1. Contexte & Objectif

Ajouter un **espace professeur** à Studia Academy permettant à tout utilisateur d'activer un mode enseignant depuis son dashboard. Deux fonctionnalités principales :

1. **Correction de copie adaptative** — OCR des copies + apprentissage du style du prof + validation + envoi
2. **Génération de devoirs QCM** — Génération IA depuis un cours + lien élève + timer + correction automatique + rapports

Cible : enseignants du Gabon et d'Afrique Centrale, francophones, contexte mobile-first.

---

## 2. Architecture Générale

### Mode Professeur (hybride)
- Pas de nouveau rôle Supabase. Champ `is_teacher: boolean` sur `profiles`.
- Un bouton "Activer l'espace professeur" dans le dashboard déclenche un wizard de 3 étapes (matière, niveau, établissement).
- Le dashboard prof est accessible via le groupe de routes `(professeur)`.

### Déploiement
- **Railway** — serveur Node.js persistant, aucun timeout sur les opérations longues.
- Les workers IA tournent dans les API routes Next.js via `process.nextTick` (non-bloquant).
- Aucun service séparé nécessaire pour le MVP.

### Pattern de traitement asynchrone
```
Upload fichiers → Supabase Storage
      ↓
POST /api/jobs/[type] → crée job (status: pending) en DB
      ↓
process.nextTick(() => runWorker(jobId))  // non-bloquant
      ↓
Worker appelle Mistral → met à jour job.progress (0→100)
      ↓
Supabase Realtime → UI suit la progression en live
      ↓
Job done → Whapi envoie WhatsApp
```

---

## 3. Modèle de Données

### Modifications table existante
```sql
ALTER TABLE profiles ADD COLUMN is_teacher BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN teacher_onboarding_done BOOLEAN DEFAULT FALSE;
```

### Nouvelles tables

#### `teacher_profiles`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| user_id | UUID → profiles | |
| matiere | TEXT | Discipline principale |
| niveau_enseignement | TEXT | collège/lycée/université/professionnel |
| etablissement | TEXT | Nom de l'établissement |
| ville | TEXT | |
| created_at | TIMESTAMPTZ | |

#### `correction_profiles`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| teacher_id | UUID → teacher_profiles | |
| wizard_config | JSONB | Réglages initiaux du wizard |
| learned_patterns | JSONB | Patterns extraits des corrections validées |
| few_shot_examples | JSONB | 3-5 exemples pour Mistral |
| version | INTEGER | Incrémenté à chaque apprentissage |
| updated_at | TIMESTAMPTZ | |

#### `correction_sessions`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| teacher_id | UUID → teacher_profiles | |
| titre | TEXT | |
| matiere | TEXT | |
| niveau | TEXT | |
| bareme | JSONB | `{ questions: [{ numero, enonce, reponse_attendue, points_max }] }` |
| nb_copies | INTEGER | |
| status | TEXT | draft / processing / done |
| created_at | TIMESTAMPTZ | |

#### `correction_jobs`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| session_id | UUID → correction_sessions | |
| eleve_nom | TEXT | |
| eleve_prenom | TEXT | |
| eleve_phone | TEXT | Pour WhatsApp (optionnel) |
| input_files | TEXT[] | URLs Supabase Storage |
| ocr_text | TEXT | Texte extrait par Pixtral |
| status | TEXT | pending / processing / done / error |
| progress | INTEGER | 0-100 (pour Realtime) |
| result_json | JSONB | Rapport brut Mistral |
| validated | BOOLEAN | Validé par le prof ? |
| sent_at | TIMESTAMPTZ | Date d'envoi à l'élève |
| report_token | UUID | Token lien rapport élève |
| error_message | TEXT | |
| created_at, updated_at | TIMESTAMPTZ | |

#### `qcm_devoirs`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| teacher_id | UUID → teacher_profiles | |
| titre | TEXT | |
| matiere | TEXT | |
| niveau | TEXT | |
| source_content | TEXT | Contenu cours extrait |
| nb_questions_qcm | INTEGER | |
| nb_questions_ouvertes | INTEGER | |
| duree_minutes | INTEGER | |
| questions | JSONB | Array généré par Mistral |
| bareme_json | JSONB | |
| access_code | VARCHAR(8) | Code classe (ex: MATHS-4B2) |
| link_token | UUID | Token lien public |
| is_locked | BOOLEAN | Prof peut bloquer l'accès |
| locked_at, unlocked_at | TIMESTAMPTZ | |
| status | TEXT | draft / active / closed |
| created_at | TIMESTAMPTZ | |

#### `qcm_sessions`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| devoir_id | UUID → qcm_devoirs | |
| eleve_nom | TEXT | |
| eleve_prenom | TEXT | |
| eleve_email | TEXT | Optionnel |
| parent_phone | TEXT | WhatsApp parent (optionnel) |
| started_at | TIMESTAMPTZ | |
| submitted_at | TIMESTAMPTZ | |
| duree_reelle_secondes | INTEGER | |
| score | DECIMAL | |
| score_sur | DECIMAL | |
| mention | VARCHAR | |
| status | TEXT | in_progress / submitted / corrected |
| report_token | UUID | Token lien rapport individuel |

#### `qcm_reponses`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| session_id | UUID → qcm_sessions | |
| question_id | INTEGER | ID dans le JSONB questions |
| type_question | TEXT | qcm / texte_court / texte_long |
| reponse_donnee | TEXT | "A" pour QCM, texte libre sinon |
| est_correcte | BOOLEAN | null si texte libre en attente |
| points_obtenus | DECIMAL | |
| commentaire_ia | TEXT | Feedback Mistral (texte libre) |
| analysed_at | TIMESTAMPTZ | |

#### `classes`
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| teacher_id | UUID → teacher_profiles | |
| nom | TEXT | Ex: "3ème B" |
| niveau | TEXT | |
| annee_scolaire | TEXT | Ex: "2025-2026" |
| nb_eleves | INTEGER | |
| created_at | TIMESTAMPTZ | |

---

## 4. Feature 1 — Correction de Copie Adaptative

### Routes
```
/professeur/correction/              ← liste des sessions
/professeur/correction/nouveau       ← wizard upload + barème
/professeur/correction/[id]          ← validation copie par copie
/professeur/correction/profil        ← profil IA + historique
/rapport/[report_token]              ← vue rapport élève (public)
```

### Flow détaillé
1. **Wizard profil** (première fois) : sévérité, points partiels, tolérance ortho → `wizard_config`
2. **Bootstrap IA** (optionnel) : upload 2-5 copies annotées → `STUDIA_PROFIL_EXTRACTION` → `learned_patterns + few_shot_examples`
3. **Session** : prof crée session + barème + upload photos/scans
4. **Worker** : `Pixtral-large` (OCR) → `Mistral-large` (correction avec profil)
5. **Validation** : prof valide/modifie chaque rapport → `validated = true`
6. **Envoi** : lien rapport généré + WhatsApp via Whapi
7. **Apprentissage continu** : tous les 5 rapports validés → re-extraction profil → `version++`

### Modèles Mistral utilisés
| Étape | Modèle | Raison |
|---|---|---|
| OCR copies | `pixtral-large-latest` | Vision — lit l'écriture manuscrite |
| Extraction profil | `mistral-large-latest` | Raisonnement complexe |
| Correction | `mistral-large-latest` | Fidélité au style du prof |

---

## 5. Feature 2 — Génération de Devoirs QCM

### Routes
```
/professeur/qcm/                     ← liste des devoirs
/professeur/qcm/nouveau              ← wizard création
/professeur/qcm/[id]                 ← gestion + résultats temps réel
/devoir/[link_token]                 ← QCM public élève (sans auth)
/devoir/[link_token]/resultats/[report_token] ← rapport individuel
```

### Flow détaillé
1. **Wizard 4 étapes** : contenu source → paramètres → prévisualisation → configuration accès
2. **Ingestion** : PDF/image → `Pixtral`, URL → fetch, texte → direct ; tout concaténé
3. **Génération** : `STUDIA_GENERATEUR` → questions JSONB
4. **Publication** : `link_token` + `access_code` générés ; verrouillage optionnel
5. **Session élève** : nom + prénom + code → timer démarre → soumission
6. **Correction** : QCM (instantané) + texte (`STUDIA_ANALYSE_REPONSE` en batch)
7. **Rapports** : lien individuel élève + tableau classe prof + WhatsApp Whapi

### Modèles Mistral utilisés
| Étape | Modèle | Raison |
|---|---|---|
| OCR source PDF/image | `pixtral-large-latest` | Extraction texte |
| Génération QCM | `mistral-large-latest` | Qualité pédagogique |
| Analyse réponses texte | `mistral-small-latest` | Rapide + économique en batch |

---

## 6. Prompts Mistral

### PROMPT 1 — `STUDIA_PROFIL_EXTRACTION`
**Modèle :** `mistral-large-latest`  
**Déclenchement :** Bootstrap initial + après chaque 5 corrections validées

```
Tu es STUDIA ANALYSTE PÉDAGOGIQUE. Tu analyses des copies corrigées
par un professeur pour modéliser son style de notation unique.

## DONNÉES FOURNIES
- copies_annotees : array de { bareme, ocr_copie, correction_prof }
  (entre 2 et 10 exemples validés par le professeur)
- wizard_config : préférences déclarées du professeur

## CE QUE TU DOIS EXTRAIRE
1. Sévérité réelle : compare les points attribués aux réponses
   partielles vs les réponses parfaites
2. Règles points partiels : comment le prof divise les points
   (demi-points, tiers, ou tout-ou-rien)
3. Tolérance orthographe : des fautes sont-elles pénalisées ?
4. Valorisation de la démarche : des points sont-ils accordés
   même si le résultat final est faux mais la méthode est bonne ?
5. Ton des commentaires : bienveillant / neutre / direct / exigeant
6. Formulations récurrentes : extraire les phrases types du prof
7. Traitement des erreurs propagées : pénalisées à chaque étape
   ou comptées une seule fois ?

## SORTIE JSON STRICTE
{
  "severite": "strict|standard|bienveillant",
  "points_partiels": {
    "style": "tout_ou_rien|demi_points|fraction_libre",
    "seuil_minimum": 0.25,
    "description": "string"
  },
  "tolerance_ortho": "aucune|mineure|moderee",
  "valorise_demarche": true|false,
  "penalise_propagation": false,
  "ton": "exigeant|direct|neutre|encourage|bienveillant",
  "formulations_types": ["string", "string"],
  "few_shot_examples": [
    {
      "question_type": "string",
      "reponse_partielle": "string",
      "points_accordes": "X/Y",
      "commentaire_prof": "string"
    }
  ],
  "score_confiance": 0.85,
  "nb_exemples_analyses": 3,
  "recommandation": "string"
}

## RÈGLES
- Ne jamais inventer un pattern non présent dans les exemples
- Si les données sont insuffisantes (< 2 exemples), retourner
  score_confiance < 0.5 et signaler dans recommandation
- Langue : français académique
```

---

### PROMPT 2 — `STUDIA_CORRECTEUR`
**Modèle :** `mistral-large-latest`  
**Déclenchement :** Après OCR Pixtral, pour chaque copie

```
Tu es STUDIA CORRECTEUR ADAPTATIF. Tu corriges une copie d'élève
en adoptant EXACTEMENT le style de notation du professeur.

## DONNÉES FOURNIES
- profil_correcteur : profil JSON du professeur (issu de STUDIA_PROFIL_EXTRACTION)
- few_shot_examples : 3-5 corrections récentes validées par le prof
- bareme : { questions: [{ numero, enonce, reponse_attendue, points_max, criteres }] }
- ocr_copie : texte extrait de la copie de l'élève
- eleve : { nom, prenom }
- matiere : string
- niveau : string

## PROCESSUS
Pour chaque question du barème :
1. Localiser la réponse de l'élève dans ocr_copie
2. Comparer à reponse_attendue selon les criteres
3. Appliquer profil_correcteur.points_partiels pour les réponses incomplètes
4. Appliquer profil_correcteur.valorise_demarche si pertinent
5. Rédiger un commentaire dans le TON de profil_correcteur.ton
   en s'inspirant de few_shot_examples (même style, même longueur)
6. Marquer [LECTURE_INCERTAINE] si le texte OCR est illisible ou ambigu

## SORTIE JSON STRICTE
{
  "eleve": { "nom": "string", "prenom": "string" },
  "note_obtenue": 14.5,
  "note_sur": 20,
  "pourcentage": 72.5,
  "mention": "Bien",
  "appreciation_generale": "string",
  "questions": [
    {
      "numero": 1,
      "points_obtenus": 3,
      "points_max": 4,
      "statut": "correct|partiel|incorrect|non_repondu",
      "reponse_eleve": "string",
      "commentaire": "string",
      "lecture_incertaine": false,
      "erreurs": ["string"]
    }
  ],
  "points_forts": ["string"],
  "axes_amelioration": ["string"],
  "necessite_validation_manuelle": false,
  "questions_a_verifier": [1, 3]
}

## RÈGLES NON NÉGOCIABLES
- Ne JAMAIS attribuer des points pour une réponse absente
- Marquer necessite_validation_manuelle: true si :
  (a) lecture_incertaine sur une question ≥ 3 points
  (b) réponse hors-contexte (possible erreur OCR)
  (c) doute sur l'interprétation du barème
- Reproduire le style des few_shot_examples
- Langue : français académique adapté au niveau de l'élève
```

---

### PROMPT 3 — `STUDIA_GENERATEUR`
**Modèle :** `mistral-large-latest`  
**Déclenchement :** Création d'un nouveau QCM

```
Tu es STUDIA GÉNÉRATEUR, expert en ingénierie pédagogique pour
Studia Academy (Libreville, Gabon / Afrique Centrale).

## MISSION
Créer un devoir complet et équilibré à partir d'un contenu de cours.
Chaque question doit être directement déductible du contenu fourni.

## DONNÉES FOURNIES
- source_content   : contenu du cours (texte extrait)
- matiere          : discipline
- niveau           : "collège|lycée|université|professionnel"
- nb_qcm           : nombre de questions QCM (0-50)
- nb_texte_court   : nombre de questions réponse courte (0-10)
- nb_texte_long    : nombre de questions réponse développée (0-5)
- duree_minutes    : durée totale du devoir
- difficulte       : "facile|moyen|difficile|mixte"
- objectifs        : compétences ciblées (optionnel)

## PROCESSUS OBLIGATOIRE
1. Lire entièrement source_content avant de générer
2. Identifier les concepts clés, définitions, dates, formules
3. Répartir les questions sur l'ensemble du cours
4. Distribution Bloom : mémorisation 30% · compréhension 40% · application 30%
5. Pour chaque QCM : 4 options, 1 seule correcte, 3 distracteurs plausibles
6. Barème : total 20 points, distribué proportionnellement

## SORTIE JSON STRICTE
{
  "devoir": {
    "titre": "string",
    "matiere": "string",
    "niveau": "string",
    "duree_minutes": 45,
    "consignes": "string",
    "note_totale": 20
  },
  "questions": [
    {
      "id": 1,
      "type": "qcm",
      "enonce": "string",
      "options": [
        { "lettre": "A", "texte": "string" },
        { "lettre": "B", "texte": "string" },
        { "lettre": "C", "texte": "string" },
        { "lettre": "D", "texte": "string" }
      ],
      "reponse_correcte": "B",
      "explication": "string",
      "points": 1,
      "concept_cle": "string",
      "niveau_bloom": "memorisation|comprehension|application",
      "difficulte": "facile|moyen|difficile"
    },
    {
      "id": 2,
      "type": "texte_court",
      "enonce": "string",
      "reponse_modele": "string",
      "mots_cles_requis": ["string"],
      "longueur_attendue": "2-3 phrases",
      "points": 3,
      "concept_cle": "string"
    },
    {
      "id": 3,
      "type": "texte_long",
      "enonce": "string",
      "reponse_modele": "string",
      "criteres": [{ "description": "string", "points": 2 }],
      "longueur_attendue": "1 paragraphe de 8-10 lignes",
      "points": 5,
      "concept_cle": "string"
    }
  ],
  "bareme": {
    "qcm_total": 10,
    "texte_court_total": 6,
    "texte_long_total": 4
  },
  "concepts_couverts": ["string"],
  "couverture_cours_pct": 85,
  "conseils_prof": ["string"]
}

## RÈGLES ABSOLUES
- Aucune question inventée hors du source_content
- Distracteurs QCM = erreurs typiques réelles d'élèves
- Vocabulaire adapté au niveau indiqué
- Couvrir au minimum 70% du contenu source
- Français académique, précis, sans ambiguïté
```

---

### PROMPT 4 — `STUDIA_ANALYSE_REPONSE`
**Modèle :** `mistral-small-latest`  
**Déclenchement :** En batch après soumission du devoir (questions texte uniquement)

```
Tu es STUDIA CORRECTEUR RÉPONSES LIBRES. Tu notes rapidement et
objectivement les réponses texte d'élèves.

## DONNÉES FOURNIES
- question        : { enonce, reponse_modele, mots_cles_requis,
                      criteres, points_max, longueur_attendue }
- reponse_eleve   : texte de l'élève
- niveau          : niveau scolaire

## PROCESSUS
1. Vérifier mots_cles_requis (sens, pas mot exact)
2. Évaluer la justesse conceptuelle vs reponse_modele
3. Appliquer les criteres un par un
4. Ajuster si longueur_attendue non respectée (−10% max)

## SORTIE JSON STRICTE
{
  "points_obtenus": 2.5,
  "points_max": 3,
  "mots_cles_trouves": ["string"],
  "mots_cles_manquants": ["string"],
  "commentaire": "string (2 phrases max, constructif)",
  "justification": "string",
  "niveau_comprehension": "excellent|satisfaisant|partiel|insuffisant|hors_sujet"
}

## RÈGLES
- Commentaire court, bienveillant, actionnable
- Ne jamais pénaliser deux fois la même erreur
- Bénéfice du doute pour les approximations correctes
- Langue : français, adapté au niveau de l'élève
```

---

## 7. Intégration Whapi

### Variables d'environnement (Railway)
```
WHAPI_TOKEN=...
WHAPI_CHANNEL_ID=...
MISTRAL_API_KEY=...
```

### Messages types

**Rapport élève (correction copie ou QCM)**
```
Bonjour {prenom} 👋
Votre devoir *{titre}* a été corrigé.
📊 Note : *{note}/{sur}* — {mention}
🔗 Rapport détaillé : {lien_rapport}
— {nom_prof} via Studia Academy
```

**Bilan classe (professeur)**
```
📋 Bilan devoir *{titre}*
👥 {nb_rendus}/{nb_eleves} copies reçues
📈 Moyenne : {moyenne}/20
🏆 Max : {max}/20 · Min : {min}/20
🔗 Tableau complet : {lien_dashboard}
```

**Notification parent**
```
Bonjour,
Résultat de {prenom} en {matiere} :
*{note}/{sur}* — {mention}
🔗 Rapport : {lien_rapport}
```

---

## 8. Routes API

```
POST /api/teacher/activate              ← active le mode professeur
POST /api/teacher/profile               ← sauvegarde wizard profil

POST /api/correction/sessions           ← crée une session
POST /api/correction/jobs               ← upload copies + lance OCR
GET  /api/correction/jobs/[id]          ← status (polling fallback)
PUT  /api/correction/jobs/[id]/validate ← valide un rapport
POST /api/correction/jobs/[id]/send     ← envoie à l'élève

POST /api/qcm/devoirs                   ← crée + génère QCM
GET  /api/qcm/devoirs/[id]              ← récupère le devoir
PUT  /api/qcm/devoirs/[id]/toggle-lock  ← verrouille/déverrouille
POST /api/qcm/sessions                  ← démarre session élève
POST /api/qcm/sessions/[id]/submit      ← soumet le devoir
GET  /api/rapport/[report_token]        ← rapport public élève

POST /api/worker/correction             ← worker interne (Pixtral + Mistral)
POST /api/worker/qcm-generate          ← worker interne (génération)
POST /api/worker/qcm-correct           ← worker interne (analyse textes)
```

---

## 9. Variables d'Environnement

```env
# Mistral
MISTRAL_API_KEY=

# Whapi
WHAPI_TOKEN=
WHAPI_CHANNEL_ID=

# Supabase (existant)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   ← nécessaire pour les workers
```

---

## 10. Ordre d'Implémentation Recommandé

1. Migration Supabase (toutes les tables)
2. Mode professeur (toggle + wizard profil + routes)
3. Feature 1 — Correction :
   - Upload + OCR Pixtral
   - Worker correction + Realtime
   - UI validation prof
   - Envoi Whapi
4. Feature 2 — QCM :
   - Ingestion contenu + génération
   - Interface élève (public, timer)
   - Correction auto + analyse texte
   - Rapports + Whapi
5. Apprentissage continu (re-extraction profil)
6. Gestion des classes + rapports parents
