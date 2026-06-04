// ============================================
// Fonctions métier Mistral — Espace Professeur
// ============================================

import { mistralChatJSON, mistralOCR } from './client'
import {
  STUDIA_PROFIL_EXTRACTION,
  STUDIA_CORRECTEUR,
  STUDIA_GENERATEUR,
  STUDIA_ANALYSE_REPONSE,
  STUDIA_OCR_INSTRUCTION,
  STUDIA_FORMATION_OUTLINE,
  STUDIA_FORMATION_SECTION,
  STUDIA_FINAL_QUIZ,
} from './prompts'
import type { OutlineSection, QuizQuestion } from '@/types/generation'
import type {
  CorrectionResult,
  LearnedPatterns,
  AnalyseReponse,
  Question,
  DevoirMeta,
  Bareme,
  WizardConfig,
  FewShotExample,
} from '@/types/teacher'

// ── OCR d'une copie ─────────────────────────
export async function ocrCopie(imageUrls: string[]): Promise<string> {
  return mistralOCR(imageUrls, STUDIA_OCR_INSTRUCTION)
}

// ── OCR d'un corrigé de référence (cours ou devoir déjà corrigé) ──
export async function ocrCorrige(imageUrls: string[]): Promise<string> {
  return mistralOCR(
    imageUrls,
    `Tu es un système OCR. Extrais FIDÈLEMENT tout le texte de ce document
qui sert de CORRIGÉ DE RÉFÉRENCE (cours, barème ou devoir déjà corrigé par le professeur).

Règles :
- Transcris les énoncés, les réponses attendues, les annotations et les points
- Conserve la structure (numéros de questions, barème, points par question)
- Préserve les corrections/annotations manuscrites du professeur si présentes
- Pour les formules, utilise une notation texte claire
- Marque [ILLISIBLE] si nécessaire

Retourne uniquement le texte extrait, structuré par question.`
  )
}

// ── Extraction du profil de correction ──────
interface ProfilExtractionInput {
  copies_annotees: Array<{
    bareme: Bareme
    ocr_copie: string
    correction_prof: string
  }>
  wizard_config: WizardConfig
}

export async function extraireProfilCorrection(
  input: ProfilExtractionInput
): Promise<LearnedPatterns & { few_shot_examples: FewShotExample[] }> {
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.2,
    messages: [
      { role: 'system', content: STUDIA_PROFIL_EXTRACTION },
      { role: 'user', content: JSON.stringify(input) },
    ],
  })
}

// ── Correction d'une copie ──────────────────
interface CorrectionInput {
  profil_correcteur: LearnedPatterns
  few_shot_examples: FewShotExample[]
  bareme: Bareme
  corrige_reference?: string
  ocr_copie: string
  eleve: { nom: string; prenom: string }
  matiere: string
  niveau: string
}

export async function corrigerCopie(
  input: CorrectionInput
): Promise<CorrectionResult> {
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.25,
    maxTokens: 6144,
    messages: [
      { role: 'system', content: STUDIA_CORRECTEUR },
      { role: 'user', content: JSON.stringify(input) },
    ],
  })
}

// ── Génération d'un QCM ─────────────────────
interface GenerationInput {
  source_content: string
  matiere: string
  niveau: string
  nb_qcm: number
  nb_texte_court: number
  nb_texte_long: number
  duree_minutes: number
  difficulte: string
  objectifs?: string
}

export interface GenerationResult {
  devoir: DevoirMeta
  questions: Question[]
  bareme: Record<string, number>
  concepts_couverts: string[]
  couverture_cours_pct: number
  conseils_prof: string[]
}

export async function genererQCM(
  input: GenerationInput
): Promise<GenerationResult> {
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.4,
    maxTokens: 8192,
    messages: [
      { role: 'system', content: STUDIA_GENERATEUR },
      { role: 'user', content: JSON.stringify(input) },
    ],
  })
}

// ── Analyse d'une réponse texte libre ───────
interface AnalyseInput {
  question: {
    enonce: string
    reponse_modele?: string
    mots_cles_requis?: string[]
    criteres?: Array<{ description: string; points: number }>
    points_max: number
    longueur_attendue?: string
  }
  reponse_eleve: string
  niveau: string
}

export async function analyserReponseTexte(
  input: AnalyseInput
): Promise<AnalyseReponse> {
  return mistralChatJSON({
    model: 'mistral-small-latest',
    temperature: 0.2,
    messages: [
      { role: 'system', content: STUDIA_ANALYSE_REPONSE },
      { role: 'user', content: JSON.stringify(input) },
    ],
  })
}

// ── Génération du sommaire de formation ─────
interface OutlineInput {
  titre: string
  niveau: string
  objectif?: string
  source_content: string
}
export interface OutlineResult {
  titre: string
  niveau: string
  sections: OutlineSection[]
}
export async function genererSommaire(input: OutlineInput): Promise<OutlineResult> {
  // Borner la source pour le contexte
  const source = input.source_content.slice(0, 80000)
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.3,
    maxTokens: 4096,
    messages: [
      { role: 'system', content: STUDIA_FORMATION_OUTLINE },
      { role: 'user', content: JSON.stringify({ ...input, source_content: source }) },
    ],
  })
}

// ── Génération d'une section (paragraphe + quiz) ─
interface SectionInput {
  formation_titre: string
  niveau: string
  sommaire: { titre: string }[]
  section: OutlineSection
  source_content: string
}
export interface SectionResult {
  content: string
  duree_minutes: number
  quiz: QuizQuestion[]
}
export async function genererSection(input: SectionInput): Promise<SectionResult> {
  const source = input.source_content.slice(0, 60000)
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.4,
    maxTokens: 6144,
    messages: [
      { role: 'system', content: STUDIA_FORMATION_SECTION },
      { role: 'user', content: JSON.stringify({ ...input, source_content: source }) },
    ],
  })
}

// ── Analyse des effectifs (diagnostic entreprise) ──
const STUDIA_ANALYSE_RH = `Tu es consultant en formation & transformation digitale chez Studia Academy (Gabon).
On te fournit l'agrégat ANONYME d'un diagnostic de compétences des salariés d'une entreprise
(niveaux moyens par domaine, répartition, par département) et le catalogue de formations disponible.

RÈGLES STRICTES :
- Jamais de nom de salarié : tu raisonnes uniquement sur des agrégats.
- N'invente aucun chiffre : appuie-toi sur les pourcentages fournis.
- Ton orienté ROI et action, adapté au contexte gabonais.
- Mappe CHAQUE recommandation à une formation du catalogue (par "ref") quand c'est pertinent.
- Priorise les domaines à faible niveau ET concernant le plus de personnes/départements.

Réponds en JSON STRICT :
{
  "synthese_executive": "2-3 phrases pour un dirigeant",
  "niveaux_domaines": [{ "domaine": "slug", "niveau": "Débutant|Intermédiaire|Avancé|Expert", "pct": 0, "commentaire": "..." }],
  "forces": ["..."],
  "lacunes_prioritaires": [{ "domaine": "slug", "impact": "...", "priorite": "haute|moyenne" }],
  "recommandations": [{ "ref": "F1", "titre": "...", "domaine": "slug", "justification": "...", "prix_fcfa": 0 }],
  "pack_resume": "Description du pack recommandé",
  "prix_total_estime_fcfa": 0
}`
export async function analyserEffectifsRH(aggregate: unknown): Promise<Record<string, unknown>> {
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.3,
    maxTokens: 4000,
    messages: [
      { role: 'system', content: STUDIA_ANALYSE_RH },
      { role: 'user', content: JSON.stringify(aggregate) },
    ],
  })
}

// ── Leçon interactive (cours « vivant ») ──
interface LeconInteractiveInput {
  titre: string
  niveau: string
  contenu: string
  /** Questions du quiz de la leçon à tisser subtilement dans le cours. */
  quiz?: { question: string; options: string[]; reponse_correcte: number; explication: string }[]
}
const STUDIA_LECON_INTERACTIVE = `Tu es concepteur pédagogique chez Studia Academy (edtech, contexte africain/gabonais).
On te donne le texte d'une leçon, son niveau, et une liste de questions de quiz.
Transforme la leçon en un parcours INTERACTIF, vivant et progressif, sous forme de blocs.

RÈGLES :
- Reste fidèle au contenu fourni : n'invente pas de faits, reformule et structure.
- Ne mentionne JAMAIS l'IA ni la génération automatique.
- Français clair, ton pédagogique et motivant. Markdown léger autorisé dans les textes (gras, listes).
- Découpe en 3 à 6 blocs "section" (titre + résumé court visible + détails dépliables).
- Ajoute 1 bloc "concepts" (3 à 6 termes-clés avec définition courte).
- Ajoute 1 bloc "a_retenir" (3 à 5 points essentiels).
- Ajoute si pertinent 1 bloc "exemple" et/ou 1 bloc "le_saviez_vous" ancré dans le contexte africain.
- TISSE les questions du quiz fournies sous forme de blocs "question_flash", RÉPARTIES naturellement
  APRÈS les sections auxquelles elles se rapportent (pas toutes à la fin). Conserve EXACTEMENT
  le libellé, les options, l'index de bonne réponse et l'explication fournis.
- Ordonne les blocs dans une logique pédagogique : accroche → sections (entrecoupées de concepts,
  exemples et questions flash) → à retenir.

Réponds en JSON STRICT :
{
  "blocks": [
    { "type": "accroche", "texte": "…" },
    { "type": "section", "titre": "…", "resume": "…", "details": "…" },
    { "type": "concepts", "items": [ { "terme": "…", "definition": "…" } ] },
    { "type": "exemple", "titre": "…", "texte": "…" },
    { "type": "le_saviez_vous", "texte": "…" },
    { "type": "question_flash", "question": "…", "options": ["…"], "reponse_correcte": 0, "explication": "…" },
    { "type": "a_retenir", "points": ["…"] }
  ]
}`
export async function genererLeconInteractive(
  input: LeconInteractiveInput
): Promise<{ blocks: unknown[] }> {
  const contenu = input.contenu.slice(0, 30000)
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.5,
    maxTokens: 6144,
    messages: [
      { role: 'system', content: STUDIA_LECON_INTERACTIVE },
      { role: 'user', content: JSON.stringify({ ...input, contenu }) },
    ],
  })
}

// ── Présentation marketing de la formation ──
interface PresentationInput {
  titre: string
  niveau: string
  sommaire: string[] // titres des sections
}
const STUDIA_PRESENTATION = `Tu es responsable marketing pédagogique chez Studia Academy (edtech au Gabon).
À partir du titre d'une formation, de son niveau et de la liste de ses chapitres, rédige une présentation commerciale engageante et professionnelle.

RÈGLES STRICTES :
- N'invente pas de chiffres ni de témoignages.
- Ne mentionne JAMAIS l'IA, la génération automatique, ni la manière dont le contenu a été produit.
- Ton positif, concret, orienté bénéfices pour l'apprenant (contexte africain / gabonais bienvenu).
- Français impeccable.

Réponds en JSON strict :
{
  "description": "2 à 3 paragraphes (Markdown léger autorisé : sauts de ligne). Présente la formation, à qui elle s'adresse, ce qu'elle apporte concrètement.",
  "objectifs": ["6 à 8 objectifs d'apprentissage concrets, commençant par un verbe d'action"]
}`
export async function genererPresentationFormation(
  input: PresentationInput
): Promise<{ description: string; objectifs: string[] }> {
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.6,
    maxTokens: 1500,
    messages: [
      { role: 'system', content: STUDIA_PRESENTATION },
      { role: 'user', content: JSON.stringify(input) },
    ],
  })
}

// ── Génération du quiz final (Kahoot) ───────
interface FinalQuizInput {
  formation_titre: string
  niveau: string
  contenu: string
}
export async function genererQuizFinal(input: FinalQuizInput): Promise<{ questions: QuizQuestion[] }> {
  const contenu = input.contenu.slice(0, 70000)
  return mistralChatJSON({
    model: 'mistral-large-latest',
    temperature: 0.5,
    maxTokens: 5000,
    messages: [
      { role: 'system', content: STUDIA_FINAL_QUIZ },
      { role: 'user', content: JSON.stringify({ ...input, contenu }) },
    ],
  })
}

// ── Extraction texte depuis PDF/image source ─
export async function ocrSourceCours(imageUrls: string[]): Promise<string> {
  return mistralOCR(
    imageUrls,
    `Extrais l'intégralité du texte de ce document de cours.
Conserve la structure (titres, sections, listes, formules).
Retourne uniquement le texte extrait, bien structuré.`
  )
}
