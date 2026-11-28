-- ============================================================
-- Studia Academy — événements en présentiel : types, séries et paiement
--
-- 1. presentiel_sessions :
--    - type         : formation en présentiel, masterclass, présentation, événement ;
--    - formation_id : formation en ligne dont l'événement est la version en salle ;
--    - serie_id     : relie les dates d'un même événement récurrent.
-- 2. presentiel_reservations : mode de paiement, montant, référence,
--    capture d'écran (bucket privé `payment-proofs`) et décision de l'admin.
--
-- Une réservation payante reste « reserved » (place retenue) jusqu'à la
-- validation du paiement par un admin (« confirmed »), ou son annulation
-- (« cancelled », la place est libérée).
--
-- Idempotent. Aucune donnée existante n'est modifiée ni supprimée : les
-- événements existants deviennent des « formation » sans série.
-- Prérequis : 20261201120000_enrollment_payments.sql (bucket payment-proofs).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Événements : type, formation d'origine, série
-- ------------------------------------------------------------
alter table public.presentiel_sessions
  add column if not exists type text not null default 'formation',
  add column if not exists formation_id uuid references public.formations (id) on delete set null,
  add column if not exists serie_id uuid;

alter table public.presentiel_sessions
  drop constraint if exists presentiel_sessions_type_check;
alter table public.presentiel_sessions
  add constraint presentiel_sessions_type_check
  check (type in ('formation', 'masterclass', 'presentation', 'evenement'));

create index if not exists presentiel_sessions_formation_idx
  on public.presentiel_sessions (formation_id)
  where formation_id is not null;

create index if not exists presentiel_sessions_serie_idx
  on public.presentiel_sessions (serie_id, date_debut)
  where serie_id is not null;

comment on column public.presentiel_sessions.type is
  'formation | masterclass | presentation | evenement';
comment on column public.presentiel_sessions.formation_id is
  'Formation en ligne dont cet événement est la version en présentiel (facultatif).';
comment on column public.presentiel_sessions.serie_id is
  'Identifiant commun aux dates d''un événement récurrent (facultatif).';

-- ------------------------------------------------------------
-- 2. Réservations : paiement et décision
-- ------------------------------------------------------------
alter table public.presentiel_reservations
  add column if not exists payment_method text,
  add column if not exists payment_amount_fcfa integer,
  add column if not exists payment_reference text,
  add column if not exists payment_proof_path text,
  add column if not exists admin_note text,
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by uuid;

alter table public.presentiel_reservations
  drop constraint if exists presentiel_reservations_payment_method_check;
alter table public.presentiel_reservations
  add constraint presentiel_reservations_payment_method_check
  check (payment_method is null or payment_method in ('cash', 'airtel_money'));

alter table public.presentiel_reservations
  drop constraint if exists presentiel_reservations_payment_amount_check;
alter table public.presentiel_reservations
  add constraint presentiel_reservations_payment_amount_check
  check (payment_amount_fcfa is null or payment_amount_fcfa >= 0);

-- File d'attente de l'admin : paiements à valider.
create index if not exists presentiel_reservations_a_valider_idx
  on public.presentiel_reservations (created_at desc)
  where status = 'reserved' and payment_method is not null;

-- Recherche d'une réservation existante pour un même numéro et un même événement.
create index if not exists presentiel_reservations_session_phone_idx
  on public.presentiel_reservations (session_id, phone);
