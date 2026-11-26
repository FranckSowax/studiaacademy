-- ============================================================
-- Studia Academy — stockage des vidéos de présentation des formations
--
-- Bucket public `formation-videos` : fichiers .mp4 / .webm téléversés
-- depuis l'écran d'administration (« Modifier la formation ») et lus
-- par la fiche publique via formations.intro_video_url.
-- Lecture publique ; écriture réservée aux admins (public.is_admin()).
-- Rien d'existant n'est modifié ni supprimé.
--
-- La taille réellement acceptée est aussi plafonnée par la limite
-- globale du projet (Supabase → Storage → Settings) : si elle est
-- inférieure à 200 Mo, c'est elle qui s'applique.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'formation-videos',
  'formation-videos',
  true,
  200 * 1024 * 1024,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists formation_videos_admin_insert on storage.objects;
create policy formation_videos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'formation-videos' and public.is_admin());

drop policy if exists formation_videos_admin_update on storage.objects;
create policy formation_videos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'formation-videos' and public.is_admin())
  with check (bucket_id = 'formation-videos' and public.is_admin());

drop policy if exists formation_videos_admin_delete on storage.objects;
create policy formation_videos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'formation-videos' and public.is_admin());
