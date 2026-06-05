-- ============================================================
-- Migration : historique des résultats d'outils IA (« Mes documents »)
-- Chaque génération réussie d'un micro-service est sauvegardée ici.
-- ============================================================

create table if not exists public.outil_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  title text not null,
  inputs jsonb not null default '{}'::jsonb,
  output text not null,
  output_type text not null default 'markdown' check (output_type in ('markdown','html')),
  credits_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.outil_generations enable row level security;

create index if not exists outil_generations_user_created_idx
  on public.outil_generations (user_id, created_at desc);

-- RLS : chaque utilisateur ne voit / supprime que ses propres documents.
-- (l'insertion réelle se fait côté serveur via le client service-role)
drop policy if exists "outil_gen_own_select" on public.outil_generations;
create policy "outil_gen_own_select" on public.outil_generations
  for select using (auth.uid() = user_id);

drop policy if exists "outil_gen_own_insert" on public.outil_generations;
create policy "outil_gen_own_insert" on public.outil_generations
  for insert with check (auth.uid() = user_id);

drop policy if exists "outil_gen_own_delete" on public.outil_generations;
create policy "outil_gen_own_delete" on public.outil_generations
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.outil_generations to authenticated;
