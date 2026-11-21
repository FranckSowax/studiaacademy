-- ============================================================
-- Studia Academy — progression des formations en ligne Studia Live
--
-- Studia Live (autre projet) envoie la progression de chaque apprenant
-- sur ses formations en ligne (d'abord « PC Express ») via la route
-- /api/integrations/studia-live/progression, signée HMAC. Une ligne par
-- (compte, formation), mise à jour à chaque envoi et affichée sur le
-- tableau de bord. Écriture : clé service uniquement. Lecture :
-- l'utilisateur, ses propres lignes.
-- ============================================================

create table if not exists public.live_progressions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  formation_code     text not null check (formation_code ~ '^[a-z0-9-]{2,60}$'),
  formation_label    text not null,
  points             integer not null default 0 check (points >= 0),
  niveau             text not null,
  exercices_reussis  integer not null default 0 check (exercices_reussis >= 0),
  exercices_total    integer not null default 0 check (exercices_total >= 0),
  serie_jours        integer not null default 0 check (serie_jours >= 0),
  source_mis_a_jour  timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint live_progressions_user_formation_key unique (user_id, formation_code)
);

-- L'index unique (user_id, formation_code) sert aussi la lecture du
-- tableau de bord (filtre sur user_id) : pas d'index supplémentaire.

alter table public.live_progressions enable row level security;

drop policy if exists "live_progressions_select_own" on public.live_progressions;
create policy "live_progressions_select_own"
  on public.live_progressions for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.live_progressions from anon, authenticated;

drop trigger if exists live_progressions_updated_at on public.live_progressions;
create trigger live_progressions_updated_at
  before update on public.live_progressions
  for each row execute function public.update_updated_at_column();

-- WHY: « ignorer un envoi plus ancien que la valeur stockée » doit être
-- atomique. Un SELECT puis un UPSERT côté serveur laisserait deux envois
-- concurrents s'écraser dans le désordre ; ici la condition est évaluée
-- par Postgres dans le même INSERT … ON CONFLICT. Un envoi de même
-- horodatage (nouvel essai de Studia Live) réécrit la ligne à
-- l'identique. Renvoie true si la ligne a été écrite, false si ignorée.
create or replace function public.upsert_live_progression(
  p_user_id           uuid,
  p_formation_code    text,
  p_formation_label   text,
  p_points            integer,
  p_niveau            text,
  p_exercices_reussis integer,
  p_exercices_total   integer,
  p_serie_jours       integer,
  p_source_mis_a_jour timestamptz
)
returns boolean
language sql
security invoker
set search_path = public
as $$
  with ecrit as (
    insert into public.live_progressions as lp (
      user_id, formation_code, formation_label, points, niveau,
      exercices_reussis, exercices_total, serie_jours, source_mis_a_jour
    )
    values (
      p_user_id, p_formation_code, p_formation_label, p_points, p_niveau,
      p_exercices_reussis, p_exercices_total, p_serie_jours, p_source_mis_a_jour
    )
    on conflict (user_id, formation_code) do update set
      formation_label   = excluded.formation_label,
      points            = excluded.points,
      niveau            = excluded.niveau,
      exercices_reussis = excluded.exercices_reussis,
      exercices_total   = excluded.exercices_total,
      serie_jours       = excluded.serie_jours,
      source_mis_a_jour = excluded.source_mis_a_jour
    where lp.source_mis_a_jour <= excluded.source_mis_a_jour
    returning 1
  )
  select exists (select 1 from ecrit);
$$;

-- Réservée au serveur (cf. 20261031170000_revoke_definer_rpc_from_clients) :
-- Supabase accorde EXECUTE à anon/authenticated sur toute nouvelle fonction.
revoke execute on function public.upsert_live_progression(
  uuid, text, text, integer, text, integer, integer, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.upsert_live_progression(
  uuid, text, text, integer, text, integer, integer, integer, timestamptz
) to service_role;
