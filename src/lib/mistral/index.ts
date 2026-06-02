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
} from './prompts'
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

// ── Extraction texte depuis PDF/image source ─
export async function ocrSourceCours(imageUrls: string[]): Promise<string> {
  return mistralOCR(
    imageUrls,
    `Extrais l'intégralité du texte de ce document de cours.
Conserve la structure (titres, sections, listes, formules).
Retourne uniquement le texte extrait, bien structuré.`
  )
}
