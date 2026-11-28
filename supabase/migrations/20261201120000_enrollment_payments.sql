-- ============================================================
-- Studia Academy — paiement des inscriptions aux formations en ligne
--
-- Deux modes : espèces sur place (« cash ») et Airtel Money avec
-- capture d'écran du paiement. Dans les deux cas l'inscription reste
-- « pending » jusqu'à la validation d'un admin, qui seule ouvre l'accès.
--
-- 1. Colonnes de paiement sur formation_enrollments.
-- 2. Bucket privé `payment-proofs` pour les captures d'écran.
-- 3. Garde-fou : un élève ne peut pas s'accorder lui-même l'accès à une
--    formation payante, ni modifier les informations de paiement.
--
-- Idempotent. Rien d'existant n'est supprimé : les inscriptions et
-- leurs règles d'accès actuelles sont conservées.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Colonnes de paiement
-- ------------------------------------------------------------
alter table public.formation_enrollments
  add column if not exists payment_method text,
  add column if not exists payment_amount_fcfa integer,
  add column if not exists payment_reference text,
  add column if not exists payment_proof_path text,
  add column if not exists admin_note text;

alter table public.formation_enrollments
  drop constraint if exists formation_enrollments_payment_method_check;
alter table public.formation_enrollments
  add constraint formation_enrollments_payment_method_check
  check (payment_method is null or payment_method in ('cash', 'airtel_money'));

alter table public.formation_enrollments
  drop constraint if exists formation_enrollments_payment_amount_check;
alter table public.formation_enrollments
  add constraint formation_enrollments_payment_amount_check
  check (payment_amount_fcfa is null or payment_amount_fcfa >= 0);

-- File d'attente de l'admin : demandes en attente, les plus récentes d'abord.
create index if not exists formation_enrollments_pending_idx
  on public.formation_enrollments (requested_at desc)
  where status = 'pending';

-- ------------------------------------------------------------
-- 2. Bucket privé des preuves de paiement
--    Écriture : uniquement par le serveur (service_role), après contrôle
--    du fichier. Lecture : l'élève pour ses propres fichiers, les admins
--    pour tous (l'écran admin passe par des liens signés d'une heure).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists payment_proofs_select on storage.objects;
create policy payment_proofs_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists payment_proofs_admin_delete on storage.objects;
create policy payment_proofs_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- ------------------------------------------------------------
-- 3. Garde-fou sur le statut et le paiement
--    S'applique aux appels faits avec la clé publique (élève connecté ou
--    visiteur). Le serveur (service_role) et les admins ne sont pas limités.
-- ------------------------------------------------------------
create or replace function public.guard_formation_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(auth.role(), '');
  v_prix integer;
begin
  -- Serveur (service_role), SQL direct (rôle vide) et admins : libres.
  if v_role not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  select coalesce(prix_fcfa, 0) into v_prix
  from public.formations
  where id = new.formation_id;

  if tg_op = 'INSERT' then
    -- Seul le serveur enregistre un paiement ou une décision.
    new.payment_method := null;
    new.payment_amount_fcfa := null;
    new.payment_reference := null;
    new.payment_proof_path := null;
    new.admin_note := null;
    new.granted_at := null;
    new.granted_by := null;
    if coalesce(v_prix, 0) > 0 and new.status is distinct from 'pending' then
      raise exception 'Inscription à une formation payante : validation par un admin requise'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE : paiement, décision et rattachement figés pour l'élève.
  new.formation_id := old.formation_id;
  new.user_id := old.user_id;
  new.payment_method := old.payment_method;
  new.payment_amount_fcfa := old.payment_amount_fcfa;
  new.payment_reference := old.payment_reference;
  new.payment_proof_path := old.payment_proof_path;
  new.admin_note := old.admin_note;
  new.granted_at := old.granted_at;
  new.granted_by := old.granted_by;

  if new.status is distinct from old.status then
    -- Seul passage libre : terminer une formation déjà ouverte.
    if old.status = 'active' and new.status = 'completed' then
      return new;
    end if;
    -- Formation gratuite : l'élève peut s'ouvrir l'accès lui-même.
    if coalesce(v_prix, 0) = 0 and new.status in ('active', 'pending') then
      return new;
    end if;
    raise exception 'Changement de statut réservé à un admin'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_formation_enrollment() from public;

drop trigger if exists formation_enrollments_guard on public.formation_enrollments;
create trigger formation_enrollments_guard
  before insert or update on public.formation_enrollments
  for each row execute function public.guard_formation_enrollment();
