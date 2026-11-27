-- ============================================================
-- Studia Academy — événements : affichage en page d'accueil
--
-- 1. presentiel_sessions.afficher_accueil : l'événement apparaît-il dans
--    l'agenda de la page d'accueil ? Vrai par défaut : rien ne change
--    pour les événements existants.
-- 2. home_settings : réglages de la section « Événements » de l'accueil
--    (une seule ligne), gérés depuis /admin/accueil.
-- 3. Bucket public `event-covers` : images des événements.
-- Lecture publique ; écriture réservée aux admins (public.is_admin()).
-- Aucune donnée existante n'est modifiée ni supprimée.
-- ============================================================

alter table public.presentiel_sessions
  add column if not exists afficher_accueil boolean not null default true;

comment on column public.presentiel_sessions.afficher_accueil is
  'Vrai : l''événement, s''il est publié et à venir, apparaît dans l''agenda de la page d''accueil.';

-- ------------------------------------------------------------
-- Réglages de l'accueil (ligne unique : id est toujours vrai)
-- ------------------------------------------------------------
create table if not exists public.home_settings (
  id                    boolean primary key default true check (id),
  evenements_max        smallint not null default 5 check (evenements_max between 1 and 10),
  afficher_journees_ia  boolean not null default true,
  updated_at            timestamptz not null default now()
);

insert into public.home_settings (id) values (true) on conflict (id) do nothing;

alter table public.home_settings enable row level security;

revoke all on public.home_settings from anon, authenticated;
grant select on public.home_settings to anon, authenticated;
grant insert, update on public.home_settings to authenticated;

drop policy if exists home_settings_read on public.home_settings;
create policy home_settings_read on public.home_settings
  for select to anon, authenticated
  using (true);

drop policy if exists home_settings_admin_insert on public.home_settings;
create policy home_settings_admin_insert on public.home_settings
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists home_settings_admin_update on public.home_settings;
create policy home_settings_admin_update on public.home_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Stockage : images des événements
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists event_covers_admin_insert on storage.objects;
create policy event_covers_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-covers' and public.is_admin());

drop policy if exists event_covers_admin_update on storage.objects;
create policy event_covers_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'event-covers' and public.is_admin())
  with check (bucket_id = 'event-covers' and public.is_admin());

drop policy if exists event_covers_admin_delete on storage.objects;
create policy event_covers_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-covers' and public.is_admin());
