-- ============================================================
-- Studia Academy — formations proposées à une entreprise
--
-- Après l'analyse des sessions passées (par règles, sans IA), l'admin
-- obtient des propositions : formations du catalogue entreprise ou
-- formations sur mesure à créer. Il les retient ou les écarte. Une
-- formation sur mesure retenue reste « à créer » tant qu'aucune
-- formation Academy ne lui est reliée (formation_id).
--
-- RLS activée SANS politique → aucune lecture ni écriture pour anon et
-- authenticated : tout passe par la clé service, derrière requireAdmin().
-- Additif et rejouable. Prérequis : 20261205120000_entreprises_admin.sql.
-- ============================================================

create table if not exists public.company_proposals (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.company_profiles (id) on delete cascade,
  type          text not null check (type in ('catalogue', 'sur_mesure')),
  -- Référence du catalogue entreprise (F1…F8) ; null pour le sur-mesure.
  catalogue_ref text,
  titre         text not null check (length(btrim(titre)) between 1 and 200),
  justification text,
  score         integer not null default 0,
  origine       text not null default 'analyse' check (origine in ('analyse', 'manuelle')),
  statut        text not null default 'proposee' check (statut in ('proposee', 'retenue', 'ecartee')),
  -- Formation Academy mise à disposition (sur-mesure une fois créé).
  formation_id  uuid references public.formations (id) on delete set null,
  cree_par      uuid references public.profiles (id) on delete set null,
  decidee_par   uuid references public.profiles (id) on delete set null,
  decidee_le    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint company_proposals_reference
    check ((type = 'catalogue') = (catalogue_ref is not null))
);

-- Une même formation n'est proposée qu'une fois par entreprise.
create unique index if not exists company_proposals_catalogue_unique
  on public.company_proposals (company_id, catalogue_ref)
  where catalogue_ref is not null;
create unique index if not exists company_proposals_sur_mesure_unique
  on public.company_proposals (company_id, lower(btrim(titre)))
  where type = 'sur_mesure';

create index if not exists company_proposals_company_idx
  on public.company_proposals (company_id);
-- File « formations sur mesure à créer » de l'admin.
create index if not exists company_proposals_a_creer_idx
  on public.company_proposals (decidee_le)
  where type = 'sur_mesure' and statut = 'retenue' and formation_id is null;
create index if not exists company_proposals_formation_idx
  on public.company_proposals (formation_id);
create index if not exists company_proposals_cree_par_idx
  on public.company_proposals (cree_par);
create index if not exists company_proposals_decidee_par_idx
  on public.company_proposals (decidee_par);

alter table public.company_proposals enable row level security;
revoke all on public.company_proposals from anon, authenticated;

drop trigger if exists company_proposals_updated_at on public.company_proposals;
create trigger company_proposals_updated_at
  before update on public.company_proposals
  for each row execute function public.update_updated_at_column();
