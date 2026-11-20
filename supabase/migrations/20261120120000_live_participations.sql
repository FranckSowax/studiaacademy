-- ============================================================
-- Studia Academy — participations Studia Live
--
-- Chaque participant d'une session Studia Live (autre projet) reçoit
-- un compte Academy (créé ou relié par e-mail, cf. route
-- /api/integrations/studia-live/link, signée HMAC). Ses sessions
-- présentielles sont enregistrées ici et affichées sur le tableau de
-- bord. Écriture : clé service uniquement. Lecture : l'utilisateur.
-- ============================================================

create table if not exists public.live_participations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  live_participant_id uuid not null unique,
  session_titre       text not null,
  session_code        text not null,
  formation_label     text,
  date_formation      date,
  score               integer not null default 0,
  rang                integer,
  nb_participants     integer,
  lien_finale         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists live_participations_user_idx
  on public.live_participations (user_id, date_formation desc);

alter table public.live_participations enable row level security;

drop policy if exists "live_participations_select_own" on public.live_participations;
create policy "live_participations_select_own"
  on public.live_participations for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.live_participations from anon, authenticated;

drop trigger if exists live_participations_updated_at on public.live_participations;
create trigger live_participations_updated_at
  before update on public.live_participations
  for each row execute function public.update_updated_at_column();
