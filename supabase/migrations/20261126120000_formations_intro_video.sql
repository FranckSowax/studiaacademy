-- ============================================================
-- Studia Academy — vidéo de présentation d'une formation
--
-- `intro_video_url` : adresse de la vidéo affichée sur la fiche publique
-- de la formation, au-dessus de « À propos de cette formation »
-- (lien YouTube, Vimeo, ou fichier .mp4 / .webm). Nul (par défaut) :
-- aucune vidéo, la fiche reste inchangée.
-- Aucune autre colonne n'est modifiée ; rien n'est supprimé.
-- ============================================================

alter table public.formations
  add column if not exists intro_video_url text;

alter table public.formations
  drop constraint if exists formations_intro_video_url_format;
alter table public.formations
  add constraint formations_intro_video_url_format
  check (intro_video_url is null or (intro_video_url ~ '^https://\S+$' and length(intro_video_url) <= 1000));

comment on column public.formations.intro_video_url is
  'Vidéo de présentation de la fiche publique (YouTube, Vimeo ou fichier .mp4/.webm en https). Nul : pas de vidéo.';
