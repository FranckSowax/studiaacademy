-- ============================================================
-- Studia Academy — formation « métier » d'un secteur d'activité
--
-- `secteur_slug` : rattache une formation créée dans l'admin à la fiche
-- d'un secteur (/entreprise/secteur/<slug>) et à sa carte de la galerie
-- « Boostez votre métier » de l'accueil. Nul (par défaut) : la formation
-- n'est rattachée à aucun secteur, rien ne change pour elle.
-- Aucune autre colonne n'est modifiée ; rien n'est supprimé.
-- ============================================================

alter table public.formations
  add column if not exists secteur_slug text;

alter table public.formations
  drop constraint if exists formations_secteur_slug_format;
alter table public.formations
  add constraint formations_secteur_slug_format
  check (secteur_slug is null or secteur_slug ~ '^[a-z0-9-]{1,60}$');

-- Une seule formation par secteur.
create unique index if not exists formations_secteur_slug_unique
  on public.formations (secteur_slug)
  where secteur_slug is not null;

comment on column public.formations.secteur_slug is
  'Secteur d''activité dont cette formation est la formation métier (slug de src/lib/secteurs.ts). Nul : aucune.';
