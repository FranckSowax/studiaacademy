-- ============================================================
-- Studia Academy — formations en ligne à places limitées
--
-- 1. formations.places_max : nombre maximal d'inscriptions à la formation.
--    Vide (NULL) = inscriptions illimitées, comme aujourd'hui.
-- 2. formations_places() : pour chaque formation publiée à places limitées,
--    le nombre de places prises. Lecture publique (des nombres seulement,
--    aucune donnée personnelle) : elle sert au bandeau « Places limitées ».
-- 3. Garde-fou : une inscription au-delà de la limite est refusée par la
--    base, même si deux personnes s'inscrivent au même instant.
--
-- Une place est prise par une inscription en attente de validation, ouverte
-- ou terminée. Une inscription refusée libère sa place.
--
-- Idempotent. Aucune donnée existante n'est modifiée ni supprimée.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Limite d'inscriptions
-- ------------------------------------------------------------
alter table public.formations
  add column if not exists places_max integer;

alter table public.formations
  drop constraint if exists formations_places_max_check;
alter table public.formations
  add constraint formations_places_max_check
  check (places_max is null or (places_max between 1 and 100000));

comment on column public.formations.places_max is
  'Nombre maximal d''inscriptions (en attente, ouvertes ou terminées). NULL = illimité.';

-- ------------------------------------------------------------
-- 2. Places prises, pour l'affichage public
-- ------------------------------------------------------------
create or replace function public.formations_places()
returns table (formation_id uuid, places_max integer, places_prises integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    f.places_max,
    (
      select count(*)::integer
      from public.formation_enrollments e
      where e.formation_id = f.id
        and e.status in ('pending', 'active', 'completed')
    )
  from public.formations f
  where f.places_max is not null
    and f.is_published;
$$;

revoke all on function public.formations_places() from public;
grant execute on function public.formations_places() to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 3. Garde-fou : pas d'inscription au-delà de la limite
--    Un admin peut dépasser la limite (rouvrir une demande refusée, par
--    exemple). Le serveur (service_role) et les élèves y sont soumis.
-- ------------------------------------------------------------
create or replace function public.enforce_formation_places()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_prises integer;
begin
  -- Seules les inscriptions qui PRENNENT une place sont contrôlées.
  if new.status not in ('pending', 'active', 'completed') then
    return new;
  end if;
  -- Une inscription qui tenait déjà sa place ne la reprend pas.
  if tg_op = 'UPDATE' and old.status in ('pending', 'active', 'completed') then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  -- WHY: verrou sur la formation — deux inscriptions simultanées passent
  -- l'une après l'autre, la seconde voit la place prise par la première.
  select places_max into v_max
  from public.formations
  where id = new.formation_id
  for update;
  if v_max is null then
    return new;
  end if;

  -- WHY: on ne compte pas la propre inscription de l'élève (un enregistrement
  -- « insérer ou mettre à jour » passe ici même quand la ligne existe déjà).
  select count(*) into v_prises
  from public.formation_enrollments
  where formation_id = new.formation_id
    and status in ('pending', 'active', 'completed')
    and user_id is distinct from new.user_id;

  if v_prises >= v_max then
    raise exception 'FORMATION_COMPLETE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_formation_places() from public;

drop trigger if exists formation_enrollments_places on public.formation_enrollments;
create trigger formation_enrollments_places
  before insert or update of status on public.formation_enrollments
  for each row execute function public.enforce_formation_places();
