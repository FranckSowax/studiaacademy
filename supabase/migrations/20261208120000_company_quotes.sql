-- ============================================================
-- Studia Academy — devis entreprise
--
-- Devis construits dans l'admin à partir de la grille tarifaire (prix
-- par séance, groupes, remises), puis envoyés au contact de l'entreprise
-- par un lien secret vers une page imprimable.
--
-- `saisie`  : ce que l'admin a choisi (prestations, effectifs, remises),
--             pour pouvoir rouvrir un brouillon.
-- `contenu` : le devis calculé et figé, tel qu'il est montré au client.
-- Le jeton du lien n'est jamais conservé : seule son empreinte SHA-256.
--
-- RLS activée SANS politique → aucune lecture ni écriture pour anon et
-- authenticated : tout passe par la clé service, derrière requireAdmin().
-- La page publique lit un devis côté serveur, à partir de l'empreinte du
-- jeton présenté. Additif et rejouable.
-- Prérequis : 20261205120000_entreprises_admin.sql.
-- ============================================================

create table if not exists public.company_quotes (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.company_profiles (id) on delete cascade,
  -- Numéro du type DEV-2026-SOB-001.
  numero         text not null unique check (numero ~ '^DEV-[0-9]{4}-[A-Z]{3}-[0-9]{3,}$'),
  objet          text not null check (length(btrim(objet)) between 1 and 200),
  saisie         jsonb not null,
  contenu        jsonb not null,
  total_ht       bigint not null default 0 check (total_ht >= 0),
  statut         text not null default 'brouillon' check (statut in ('brouillon', 'envoye', 'accepte', 'refuse')),
  destinataire   text,
  jeton_hash     text unique check (jeton_hash is null or jeton_hash ~ '^[0-9a-f]{64}$'),
  lien_expire_le timestamptz,
  envoye_le      timestamptz,
  decide_le      timestamptz,
  cree_par       uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists company_quotes_company_idx
  on public.company_quotes (company_id, created_at desc);
create index if not exists company_quotes_cree_par_idx
  on public.company_quotes (cree_par);

alter table public.company_quotes enable row level security;
revoke all on public.company_quotes from anon, authenticated;

drop trigger if exists company_quotes_updated_at on public.company_quotes;
create trigger company_quotes_updated_at
  before update on public.company_quotes
  for each row execute function public.update_updated_at_column();
