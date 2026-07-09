-- ============================================================
-- Module Formations IA (F1-F4) — schéma
-- Tables préfixées fia_ : la table `formations` existe déjà
-- (formations en ligne du site). Voir README-FORMATIONS-IA.md
-- ============================================================

-- ── Formations ──────────────────────────────────────────────
create table if not exists fia_formations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  code text unique not null check (code in ('F1','F2','F3','F4')),
  titre text not null,
  promesse text not null,
  public_cible text not null,
  prix_fcfa integer,            -- null = sur devis (F4)
  prix_groupe_fcfa integer,     -- tarif -15% à partir de 3 participants
  effectif_min integer not null default 8,
  effectif_max integer not null default 15,
  couleur_from text not null,
  couleur_to text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Sessions ────────────────────────────────────────────────
create table if not exists fia_sessions (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references fia_formations(id) on delete cascade,
  date date not null,
  lieu text not null default 'Libreville',
  places_total integer not null default 15,
  statut text not null default 'planifiee'
    check (statut in ('planifiee','confirmee','complete','terminee')),
  created_at timestamptz not null default now()
);
create index if not exists fia_sessions_formation_idx on fia_sessions(formation_id, date);

-- ── Inscriptions ────────────────────────────────────────────
create table if not exists fia_inscriptions (
  id uuid primary key default gen_random_uuid(),
  code_public text unique,
  session_id uuid not null references fia_sessions(id),
  type text not null check (type in ('individuel','entreprise')),
  societe text,
  nb_participants integer not null default 1 check (nb_participants between 1 and 50),
  nom text not null,
  prenom text not null,
  fonction text,
  telephone_whatsapp text not null,
  email text,
  source_declaree text,
  utm jsonb not null default '{}'::jsonb,
  statut text not null default 'en_attente_paiement'
    check (statut in ('en_attente_paiement','payee','annulee')),
  created_at timestamptz not null default now()
);
create index if not exists fia_inscriptions_session_idx on fia_inscriptions(session_id);

-- ── Leads entreprises (devis intra + entretiens F4) ─────────
create table if not exists fia_leads_entreprises (
  id uuid primary key default gen_random_uuid(),
  societe text not null,
  contact text not null,
  fonction text,
  telephone text not null,
  effectif text,
  formations text[] not null default '{}',
  message text,
  created_at timestamptz not null default now()
);

-- ── Compteur pour les codes publics STU-F1-0042 ─────────────
create table if not exists fia_inscription_counters (
  formation_code text primary key,
  n integer not null default 0
);
insert into fia_inscription_counters(formation_code)
values ('F1'),('F2'),('F3'),('F4')
on conflict do nothing;

-- Trigger : génère le code public à l'insertion
create or replace function fia_set_code_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_n integer;
begin
  select f.code into v_code
  from fia_sessions s join fia_formations f on f.id = s.formation_id
  where s.id = new.session_id;

  if v_code is null then
    raise exception 'Session inconnue';
  end if;

  update fia_inscription_counters
  set n = n + 1
  where formation_code = v_code
  returning n into v_n;

  new.code_public := 'STU-' || v_code || '-' || lpad(v_n::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists fia_inscriptions_code on fia_inscriptions;
create trigger fia_inscriptions_code
before insert on fia_inscriptions
for each row execute function fia_set_code_public();

-- ── Vue : places restantes (bypass RLS via owner) ───────────
create or replace view fia_sessions_publiques as
select
  s.id,
  s.formation_id,
  f.slug as formation_slug,
  f.code as formation_code,
  s.date,
  s.lieu,
  s.statut,
  s.places_total,
  greatest(
    s.places_total - coalesce((
      select sum(i.nb_participants) from fia_inscriptions i
      where i.session_id = s.id and i.statut <> 'annulee'
    ), 0),
    0
  )::integer as places_restantes
from fia_sessions s
join fia_formations f on f.id = s.formation_id
where f.actif and s.statut in ('planifiee','confirmee');

-- ── RPC d'inscription (validation serveur + retour du code) ─
create or replace function fia_inscrire(
  p_session_id uuid,
  p_type text,
  p_societe text,
  p_nb_participants integer,
  p_nom text,
  p_prenom text,
  p_fonction text,
  p_telephone text,
  p_email text,
  p_source text,
  p_utm jsonb
)
returns table(code_public text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tel text := regexp_replace(coalesce(p_telephone,''), '\s', '', 'g');
  v_row fia_inscriptions%rowtype;
begin
  -- Validation téléphone gabonais : +241 puis 8 ou 9 chiffres
  if v_tel !~ '^\+241[0-9]{8,9}$' then
    raise exception 'TELEPHONE_INVALIDE';
  end if;
  if p_type not in ('individuel','entreprise') then
    raise exception 'TYPE_INVALIDE';
  end if;
  if coalesce(trim(p_nom),'') = '' or coalesce(trim(p_prenom),'') = '' then
    raise exception 'NOM_REQUIS';
  end if;
  if p_type = 'entreprise' and coalesce(trim(p_societe),'') = '' then
    raise exception 'SOCIETE_REQUISE';
  end if;

  insert into fia_inscriptions(
    session_id, type, societe, nb_participants, nom, prenom,
    fonction, telephone_whatsapp, email, source_declaree, utm
  ) values (
    p_session_id, p_type, nullif(trim(p_societe),''),
    greatest(coalesce(p_nb_participants,1),1),
    trim(p_nom), trim(p_prenom), nullif(trim(p_fonction),''),
    v_tel, nullif(trim(p_email),''), nullif(p_source,''),
    coalesce(p_utm,'{}'::jsonb)
  ) returning * into v_row;

  return query select v_row.code_public;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────
alter table fia_formations enable row level security;
alter table fia_sessions enable row level security;
alter table fia_inscriptions enable row level security;
alter table fia_leads_entreprises enable row level security;
alter table fia_inscription_counters enable row level security;

-- Catalogue lisible par tous
drop policy if exists fia_formations_read on fia_formations;
create policy fia_formations_read on fia_formations
  for select using (actif = true);

drop policy if exists fia_sessions_read on fia_sessions;
create policy fia_sessions_read on fia_sessions
  for select using (true);

-- Inscriptions : insert public UNIQUEMENT (le select passe par le RPC)
drop policy if exists fia_inscriptions_insert on fia_inscriptions;
create policy fia_inscriptions_insert on fia_inscriptions
  for insert to anon, authenticated with check (true);

drop policy if exists fia_inscriptions_team_select on fia_inscriptions;
create policy fia_inscriptions_team_select on fia_inscriptions
  for select to authenticated using (true);

drop policy if exists fia_inscriptions_team_update on fia_inscriptions;
create policy fia_inscriptions_team_update on fia_inscriptions
  for update to authenticated using (true);

-- Leads entreprises : insert public, lecture équipe
drop policy if exists fia_leads_insert on fia_leads_entreprises;
create policy fia_leads_insert on fia_leads_entreprises
  for insert to anon, authenticated with check (true);

drop policy if exists fia_leads_team_select on fia_leads_entreprises;
create policy fia_leads_team_select on fia_leads_entreprises
  for select to authenticated using (true);

grant execute on function fia_inscrire to anon, authenticated;
