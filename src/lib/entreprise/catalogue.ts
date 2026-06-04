// ============================================
// Catalogue de formations B2B (référentiel pour le pack sur mesure)
// ============================================

export interface CatalogueFormation {
  ref: string
  slug: string            // slug de la formation réelle (table formations)
  titre: string
  domaines: string[]      // slugs de competences.ts
  format: string
  duree: string
  niveau: string
  prix_fcfa: number       // prix indicatif par participant
}

export const CATALOGUE_B2B: CatalogueFormation[] = [
  { ref: 'F1', slug: 'b2b-ia-generative-travail', titre: 'IA générative au travail : produire 3× plus vite', domaines: ['ia_generative'], format: 'Hybride', duree: '8 h / 2 sem.', niveau: 'Initiation', prix_fcfa: 75000 },
  { ref: 'F2', slug: 'b2b-automatisation-no-code', titre: 'Automatisation & no-code (avec MCP)', domaines: ['ia_generative', 'gestion_projet'], format: 'Hybride', duree: '14 h / 3 sem.', niveau: 'Intermédiaire', prix_fcfa: 120000 },
  { ref: 'F3', slug: 'b2b-digitalisation-process', titre: 'Digitalisation des process : du papier au numérique', domaines: ['bureautique', 'gestion_projet'], format: 'Présentiel + e-learning', duree: '2 j + 4 h', niveau: 'Initiation', prix_fcfa: 150000 },
  { ref: 'F4', slug: 'b2b-data-tableaux-bord', titre: 'Data & tableaux de bord : piloter par les chiffres', domaines: ['data'], format: 'Hybride', duree: '12 h / 2 sem.', niveau: 'Intermédiaire', prix_fcfa: 110000 },
  { ref: 'F5', slug: 'b2b-cybersecurite-base', titre: 'Cybersécurité de base : protéger l\'entreprise', domaines: ['securite'], format: 'E-learning + atelier', duree: '6 h', niveau: 'Initiation', prix_fcfa: 60000 },
  { ref: 'F6', slug: 'b2b-marketing-digital', titre: 'Marketing digital : acquérir des clients en ligne', domaines: ['communication_digitale'], format: 'Hybride', duree: '14 h / 3 sem.', niveau: 'Initiation', prix_fcfa: 110000 },
  { ref: 'F7', slug: 'b2b-ia-service-client', titre: 'IA pour le service client : répondre vite et bien', domaines: ['ia_generative', 'communication_digitale'], format: 'Hybride', duree: '10 h / 2 sem.', niveau: 'Intermédiaire', prix_fcfa: 95000 },
  { ref: 'F8', slug: 'b2b-conduite-changement', titre: 'Conduite du changement : embarquer les équipes', domaines: ['gestion_projet'], format: 'Présentiel + coaching', duree: '2 j + 3 séances', niveau: 'Avancé', prix_fcfa: 180000 },
]

export function catalogueForPrompt() {
  return CATALOGUE_B2B.map((f) => ({ ref: f.ref, titre: f.titre, domaines: f.domaines, niveau: f.niveau, prix_fcfa: f.prix_fcfa }))
}

export function getCatalogueByRef(ref: string): CatalogueFormation | undefined {
  return CATALOGUE_B2B.find((f) => f.ref === ref)
}
