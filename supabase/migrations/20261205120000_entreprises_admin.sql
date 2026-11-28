-- ============================================================
-- Studia Academy — dossiers entreprise pilotés depuis l'admin
--
-- 1. company_profiles : une entreprise peut être créée par un admin, sans
--    compte client (user_id facultatif). Ajout du contact de direction,
--    de notes internes et d'un responsable Studia.
-- 2. company_sessions : sessions rattachées à une entreprise — une
--    session clôturée de Studia Live (passée) ou un événement en
--    présentiel (à venir ou passé). Une session n'appartient qu'à une
--    seule entreprise.
-- 3. company_members : l'étiquette « entreprise » des comptes Academy
--    des participants à ces sessions.
--
-- Additif et rejouable : aucune donnée existante n'est modifiée ni
-- supprimée. Les politiques RLS existantes de company_profiles ne sont
-- pas touchées ; les deux nouvelles tables ont la RLS activée SANS
-- politique → tout passe par la clé service, derrière requireAdmin().
-- Prérequis : 20261204120000_live_sessions_suivi.sql.
-- ============================================================

-- ---------- 1. Entreprises créées par l'admin ----------

alter table public.company_profiles
  alter column user_id drop not null;

alter table public.company_profiles
  add column if not exists direction_nom   text,
  add column if not exists direction_email text,
  add column if not exists notes           text,
  add column if not exists responsable_id  uuid references public.profiles (id) on delete set null,
  add column if not exists cree_par_admin  uuid references public.profiles (id) on delete set null;

create index if not exists company_profiles_responsable_idx
  on public.company_profiles (responsable_id);
create index if not exists company_profiles_cree_par_admin_idx
  on public.company_profiles (cree_par_admin);

-- ---------- 2. Sessions rattachées ----------

create table if not exists public.company_sessions (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.company_profiles (id) on delete cascade,
  live_session_id       uuid unique references public.live_sessions_suivi (live_session_id) on delete cascade,
  presentiel_session_id uuid unique references public.presentiel_sessions (id) on delete cascade,
  rattachee_par         uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  constraint company_sessions_une_source
    check ((live_session_id is null) <> (presentiel_session_id is null))
);

create index if not exists company_sessions_company_idx
  on public.company_sessions (company_id);
create index if not exists company_sessions_rattachee_par_idx
  on public.company_sessions (rattachee_par);

alter table public.company_sessions enable row level security;
revoke all on public.company_sessions from anon, authenticated;

-- ---------- 3. Étiquette entreprise des participants ----------

create table if not exists public.company_members (
  company_id uuid not null references public.company_profiles (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists company_members_user_idx
  on public.company_members (user_id);

alter table public.company_members enable row level security;
revoke all on public.company_members from anon, authenticated;
