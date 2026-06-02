# AUDIT — Studia Academy Portal
> Produit le 2026-06-02. Base : codebase local + analyse structurelle.

---

## 1.1 Inventaire Technique

### Stack & versions
| Dépendance | Version | Note |
|---|---|---|
| Next.js | **16.1.1** | App Router, React Server Components |
| React | **19.2.3** | Dernière version |
| TypeScript | ^5 | Strict activé (tsconfig à vérifier) |
| Tailwind CSS | **v4** | Avec `tw-animate-css`, PostCSS plugin |
| shadcn/ui | Composants Radix UI | accordion, avatar, badge, button, card, dialog, dropdown, form, input, label, progress, radio-group, scroll-area, select, separator, sheet, slider, switch, table, tabs, textarea, toggle |
| Framer Motion | **^12.24.7** | Installé, **mais peu ou pas utilisé** dans les composants vitrine |
| Supabase | `@supabase/ssr ^0.8.0` + `@supabase/supabase-js ^2.89.0` | Auth + data |
| recharts | ^3.6.0 | Graphiques (dashboard) |
| react-hook-form + zod | ^7 + ^4 | Formulaires |
| lucide-react | ^0.562.0 | Icônes |
| next-themes | ^0.4.6 | Dark mode (non activé sur la home) |

### Structure des dossiers
```
src/
├── app/
│   ├── (public)/        — vitrine + layout Header/Footer
│   │   ├── page.tsx     — landing page
│   │   ├── about/
│   │   ├── pricing/
│   │   ├── community/
│   │   ├── privacy/
│   │   └── terms/
│   ├── (auth)/          — login, signup
│   ├── (dashboard)/     — dashboard utilisateur + /services/[slug]
│   ├── (admin)/         — admin panel
│   ├── (tool)/          — services/[slug]/start
│   └── auth/            — callback Supabase
├── components/
│   ├── layout/          — header, footer, sidebar, user-nav, tool-header
│   ├── dashboard/       — StudiaHeader, StudiaSidebar, MicroServicesGrid, etc.
│   ├── services/        — service-card, service-filters, service-search
│   ├── tools/           — cv-builder, analysis, interview, quiz, assistant, courses
│   ├── billing/         — payment-modal, top-up-modal
│   └── ui/              — composants shadcn/ui
├── contexts/AuthContext.tsx
├── hooks/               — useAuth, useCredits, useNotifications
├── lib/
│   ├── supabase/        — client, server, middleware, api
│   ├── data/            — mock-services, mock-courses, mock-cvs, mock-billing...
│   └── utils.ts
└── types/               — analysis, billing, course, cv, database, interview, quiz, service
```

### État de l'auth Supabase
- ✅ `@supabase/ssr` correctement configuré (browser client + server client)
- ✅ Middleware met à jour la session sur toutes les routes
- ✅ Trigger `on_auth_user_created` crée profil + wallet + settings + notification de bienvenue
- ✅ RLS activé sur toutes les tables
- ⚠️ Les données sont encore en grande partie des **mocks locaux** (`lib/data/mock-*.ts`) — la base Supabase contient le schéma mais les composants lisent les mocks

### Sources de données
| Composant | Source actuelle | Cible |
|---|---|---|
| Services vitrine (page.tsx) | Hardcodé inline | `lib/modules.ts` (Phase 2) |
| Services dashboard | `lib/data/mock-services.ts` | Supabase `services` table |
| Cours | `lib/data/mock-courses.ts` | Supabase `courses` table |
| CVs | `lib/data/mock-cvs.ts` | Supabase `cvs` table |
| Stats | Hardcodé inline | Supabase ou config |
| Témoignages | Hardcodé inline | Supabase `testimonials` (à créer) |

---

## 1.2 Audit de l'Écart Positionnement

### Tableau comparatif

| # | Service Live | Module Spec | Statut | Action |
|---|---|---|---|---|
| 1 | Évaluer / Test de Compétences (`/services/assess`) | Tests de Compétences | ✅ DOUBLON | Conserver, enrichir |
| 2 | Créer / Générateur de CV (`/services/create`) | — | 🔵 LIVE UNIQUEMENT | Conserver comme service IA |
| 3 | Analyse CV IA (`/services/analyze`) | — | 🔵 LIVE UNIQUEMENT | Conserver comme service IA |
| 4 | Simulateur d'Entretien (`/services/interview`) | Préparation Soutenance | 🟡 CHEVAUCHEMENT | Fusionner / étendre |
| 5 | Micro-Cours (`/services/learn`) | Formations Présentiel + Training Sessions | 🟡 CHEVAUCHEMENT | Diviser en 2 modules |
| 6 | Assistant Carrière IA (`/services/assistant`) | Accompagnement Pédagogique | 🟡 CHEVAUCHEMENT | Conserver, repositionner |
| 7 | Entreprises / Recrutement (`/services/business`) | Audit IA Entreprises | 🟡 CHEVAUCHEMENT | Élargir |
| 8 | Forum Communautaire (`/community`) | Expérience Interactive | 🟡 CHEVAUCHEMENT | Repositionner |
| 9 | — | Universités Chinoises | 🆕 MANQUANT | Créer module phare |
| 10 | — | Digitalisation | 🆕 MANQUANT | Créer module |

### Architecture d'information (IA) unifiée recommandée

```
PORTAIL VITRINE (/)
 ├── 9 MODULES (grid)
 │   ├── Universités Chinoises          (🆕 flagship)
 │   ├── Tests de Compétences           (= assess existant)
 │   ├── Préparation Soutenance         (= interview existant, élargi)
 │   ├── Training Sessions              (= learn existant, sous-module)
 │   ├── Audit IA Entreprises           (= business existant, élargi)
 │   ├── Formations Présentiel          (nouveau sous-module learn)
 │   ├── Digitalisation                 (🆕)
 │   ├── Accompagnement Pédagogique     (= assistant existant)
 │   └── Expérience Interactive         (= community existant, repositionné)
 │
 ├── OUTILS IA (micro-services, derrière auth)
 │   ├── Générateur de CV              (/services/create)
 │   ├── Analyse CV par IA             (/services/analyze)
 │   └── Assistant Carrière 24/7       (/services/assistant)
 │
 ├── /modules/[slug]                   (pages de détail par module)
 ├── /pricing                          (tarifs)
 ├── /about                            (à étoffer)
 ├── /contact                          (🆕 à créer)
 └── /community                        (forum, existant)
```

**Règle** : les 9 modules sont l'offre "centre d'excellence" visible depuis la vitrine. Les outils IA (CV, analyse, assistant) sont les services interactifs accessibles après connexion.

---

## 1.3 Audit Incohérences Contenu

### Bugs critiques à corriger

| Fichier | Ligne | Problème | Correction |
|---|---|---|---|
| `src/app/layout.tsx` | 21 | `keywords: [..., "Burkina Faso"]` | Remplacer par `"Gabon"`, `"Libreville"`, `"Afrique Centrale"` |
| `supabase/schema.sql` | 84 | `country TEXT DEFAULT 'Burkina Faso'` | `DEFAULT 'Gabon'` |
| `supabase/schema.sql` | 408 | `timezone TEXT DEFAULT 'Africa/Ouagadougou'` | `DEFAULT 'Africa/Libreville'` |
| `src/app/layout.tsx` | 18-22 | `description` trop générique | Mentionner Libreville, Gabon, excellence, Sowax Group |
| `src/app/(public)/about/page.tsx` | tout | Page quasi-vide (2 lignes) | À réécrire complètement |
| `src/components/layout/footer.tsx` | 75 | Téléphone `+241 XX XX XX XX` | À compléter avec le vrai numéro |

### Points corrects
- ✅ Footer : "Libreville, Gabon" et "Fait avec ❤ au Gabon"
- ✅ `lang="fr"` sur le HTML root
- ✅ Noms gabonais dans les témoignages (Marie Nguema, Patrick Mba, Claire Ndong)

---

## 1.4 Audit Performance & Accessibilité

### Performance estimée (pas de Lighthouse réel disponible sans serveur live)

| Critère | État actuel | Problème |
|---|---|---|
| `next/image` | ✅ Utilisé pour `/logo.png` | OK |
| Fonts | Geist (Google Fonts) | ⚠️ Spec demande Poppins/Inter — non chargés |
| Framer Motion | Installé mais **non utilisé** côté vitrine | 0 animations d'entrée |
| 3D / WebGL | ❌ Absent | Hero statique |
| Code splitting | Géré par Next.js | OK par défaut |
| `prefers-reduced-motion` | ❌ Non implémenté | À ajouter |
| LCP cible | Non mesuré | Objectif < 2,5s sur 4G |

### Accessibilité

| Critère | État |
|---|---|
| `lang="fr"` | ✅ |
| Alt-text images | ✅ Logo (`alt="Studia Academy"`) |
| Focus visible | ⚠️ Tailwind par défaut, à tester |
| Navigation clavier | ⚠️ Sheet mobile non testé au clavier |
| Contraste WCAG AA | ⚠️ Orange `#e97e42` sur blanc = ratio ~3.1:1 → **INSUFFISANT** pour texte normal (besoin ≥ 4.5:1) |
| `aria-label` | Partiel (hamburger menu = OK, footer socials = OK) |

### SEO

| Critère | État |
|---|---|
| `<title>` | "Studia Academy" — trop générique |
| `description` | "Plateforme de micro-services pour la formation et l'emploi" — OK mais améliorable |
| OpenGraph | ❌ Absent |
| sitemap.xml | ❌ Absent |
| robots.txt | ❌ Absent |
| Structured data | ❌ Absent |

---

## 1.5 Audit Responsive

| Breakpoint | État |
|---|---|
| Mobile < 640px | ✅ Hero adaptatif, illustration cachée (`hidden sm:block`), scroll horizontal témoignages |
| Tablet 640-1024px | ✅ Grille 2 cols services, layout correct |
| Desktop > 1024px | ✅ Layout 3 cols services, hero split |
| Navigation mobile | ✅ Sheet/Drawer avec hamburger |
| Touch targets | ✅ `min-height: 44px` appliqué globalement |

---

## QUESTION BLOQUANTE — Palette couleur (à valider avant Phase 3)

La **spécification** demande une palette **violette** : `#667eea → #764ba2`

Le **live actuel** utilise une palette **orange** : `#e97e42 → #d56a2e`

Ces deux palettes sont incompatibles — migrer vers le violet effacerait toute l'identité visuelle actuelle.

**Recommandation** : conserver l'orange comme couleur primaire de la marque Studia Academy (cohérent avec le logo, les tokens CSS déjà en place, et le positionnement chaleureux/africain), et introduire le violet **uniquement** pour le module "Universités Chinoises" (contexte premium/international) et certains éléments décoratifs secondaires.

→ **Merci de valider ce choix avant que la Phase 3 (Design System) soit codée.**

---

## Résumé des actions par phase

### Bugs immédiats (corrigés dans cet audit)
- [x] Keywords metadata : "Burkina Faso" → "Gabon, Libreville, Afrique Centrale"
- [x] Description metadata enrichie
- [x] Schema SQL : country + timezone (commentaires dans le fichier)

### Phase 2 — Architecture (à implémenter)
- [ ] Créer `src/lib/modules.ts` — type `Module` + tableau des 9 modules
- [ ] Route `/modules/[slug]` pour pages de détail
- [ ] Route `/contact` (page de contact + WhatsApp)
- [ ] Étoffer `/about`

### Phase 3 — Design System (en attente validation palette)
- [ ] Tokens CSS étendus (Poppins + Inter, 9 couleurs modules)
- [ ] Corriger contraste WCAG AA pour orange sur blanc
- [ ] Support `prefers-reduced-motion`

### Phase 4 — Sections (après Phase 3)
- [ ] Nav sticky scroll-aware
- [ ] Hero refactorisé
- [ ] Bandeau partenaires
- [ ] Grille 9 modules
- [ ] "Comment ça marche"
- [ ] Spotlight Universités Chinoises + Audit IA
- [ ] FAQ accordéon
- [ ] CTA WhatsApp

### Phase 5 — Hero 3D
- [ ] Choix techno 3D (recommandé : `cobe` pour perf mobile)
- [ ] Dynamic import + fallback statique
- [ ] IntersectionObserver pause

### Phase 7 — Fonctionnel
- [ ] Formulaire contact avec validation
- [ ] Modules/témoignages depuis Supabase (tables à créer)
- [ ] OpenGraph + sitemap + robots.txt
