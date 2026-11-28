-- ============================================================
-- Studia Academy — pilotage des sessions clôturées de Studia Live
--
-- L'admin d'Academy récupère (appels signés HMAC, serveur → serveur)
-- les sessions clôturées de Studia Live, les suit et journalise ses
-- envois (rapport au commanditaire, finales, relances).
--
-- `donnees` contient des e-mails et des réponses nominatives :
-- RLS activée SANS aucune politique → aucune lecture ni écriture pour
-- anon et authenticated. Tout passe par la clé service, derrière
-- requireAdmin() côté application.
-- ============================================================

do $$ begin
  create type public.live_suivi_statut as enum ('a_traiter', 'rapport_envoye', 'relance', 'clos');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.live_envoi_type as enum ('rapport_direction', 'finales', 'relance_finales');
exception when duplicate_object then null; end $$;

-- ---------- Suivi : une ligne par session clôturée ----------

create table if not exists public.live_sessions_suivi (
  id                  uuid primary key default gen_random_uuid(),
  live_session_id     uuid not null unique,
  code                text not null,
  titre               text not null,
  formation_label     text,
  date_formation      date,
  -- Dernière ligne reçue de la liste (indicateurs du tableau de l'admin).
  resume              jsonb not null default '{}'::jsonb,
  -- Dernier détail reçu, sans les liens à durée limitée.
  donnees             jsonb,
  synchronise_le      timestamptz,
  -- Renseigné quand la session a disparu de la liste de Studia Live :
  -- le suivi est conservé, la session est seulement marquée.
  supprimee_live_le   timestamptz,
  statut_suivi        public.live_suivi_statut not null default 'a_traiter',
  commanditaire_nom   text,
  commanditaire_email text,
  notes               text,
  responsable_id      uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists live_sessions_suivi_date_idx
  on public.live_sessions_suivi (date_formation desc nulls last);
create index if not exists live_sessions_suivi_statut_idx
  on public.live_sessions_suivi (statut_suivi);
create index if not exists live_sessions_suivi_responsable_idx
  on public.live_sessions_suivi (responsable_id);

alter table public.live_sessions_suivi enable row level security;
revoke all on public.live_sessions_suivi from anon, authenticated;

drop trigger if exists live_sessions_suivi_updated_at on public.live_sessions_suivi;
create trigger live_sessions_suivi_updated_at
  before update on public.live_sessions_suivi
  for each row execute function public.update_updated_at_column();

-- ---------- Journal des envois : insertion seule ----------

create table if not exists public.live_sessions_envois (
  id              uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions_suivi (live_session_id) on delete restrict,
  type            public.live_envoi_type not null,
  destinataires   text not null,
  resultat        jsonb not null default '{}'::jsonb,
  par             uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists live_sessions_envois_session_idx
  on public.live_sessions_envois (live_session_id, created_at desc);
create index if not exists live_sessions_envois_par_idx
  on public.live_sessions_envois (par);

alter table public.live_sessions_envois enable row level security;
revoke all on public.live_sessions_envois from anon, authenticated;

-- Le journal ne se réécrit pas, même avec la clé service. Seule
-- exception : `par` remis à null quand le compte de l'admin est supprimé.
create or replace function public.live_sessions_envois_immuable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.par is null
     and (to_jsonb(new) - 'par') = (to_jsonb(old) - 'par') then
    return new;
  end if;
  raise exception 'live_sessions_envois est un journal en insertion seule';
end;
$$;

revoke all on function public.live_sessions_envois_immuable() from public, anon, authenticated;

drop trigger if exists live_sessions_envois_immuable on public.live_sessions_envois;
create trigger live_sessions_envois_immuable
  before update or delete on public.live_sessions_envois
  for each row execute function public.live_sessions_envois_immuable();
