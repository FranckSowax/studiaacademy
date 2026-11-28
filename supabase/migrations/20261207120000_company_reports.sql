-- ============================================================
-- Studia Academy — bilans envoyés à la direction d'une entreprise
--
-- Chaque envoi crée un bilan figé (`contenu`) consultable sans compte
-- par un lien secret valable 30 jours. Le jeton du lien n'est jamais
-- conservé : seule son empreinte SHA-256 l'est (`jeton_hash`).
--
-- `contenu` ne contient que des données agrégées (sessions, moyennes,
-- thèmes, formations retenues) : aucun participant, aucune réponse.
--
-- RLS activée SANS politique → aucune lecture ni écriture pour anon et
-- authenticated. La page publique lit le bilan côté serveur, avec la clé
-- service, uniquement à partir de l'empreinte du jeton présenté.
-- Additif et rejouable. Prérequis : 20261205120000_entreprises_admin.sql.
-- ============================================================

create table if not exists public.company_reports (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.company_profiles (id) on delete cascade,
  jeton_hash   text not null unique check (jeton_hash ~ '^[0-9a-f]{64}$'),
  contenu      jsonb not null,
  destinataire text not null,
  -- false si le fournisseur d'e-mail a refusé l'envoi : le lien n'est alors pas servi.
  envoye       boolean not null default false,
  expire_le    timestamptz not null,
  revoque_le   timestamptz,
  envoye_par   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists company_reports_company_idx
  on public.company_reports (company_id, created_at desc);
create index if not exists company_reports_envoye_par_idx
  on public.company_reports (envoye_par);

alter table public.company_reports enable row level security;
revoke all on public.company_reports from anon, authenticated;
