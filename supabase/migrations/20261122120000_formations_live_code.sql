-- ============================================================
-- Studia Academy — formations suivies sur Studia Live
--
-- `live_code` relie une formation du catalogue Academy à son parcours
-- sur Studia Live (même valeur que live_progressions.formation_code).
-- Renseigné : l'élève est envoyé sur Studia Live par
-- /formations/<slug>/suivre. Nul (par défaut) : la formation garde le
-- lecteur Academy (/apprendre/<slug>), inchangé.
-- Aucune autre colonne n'est modifiée ; rien n'est supprimé.
-- ============================================================

alter table public.formations
  add column if not exists live_code text;

alter table public.formations
  drop constraint if exists formations_live_code_format;
alter table public.formations
  add constraint formations_live_code_format
  check (live_code is null or live_code ~ '^[a-z0-9-]{2,60}$');

comment on column public.formations.live_code is
  'Code de la formation sur Studia Live (ex. pc-express). Nul : lecteur Academy.';

-- PC Express, si la formation existe déjà dans le catalogue (sinon
-- aucune ligne touchée : le code se saisit dans l''écran d''administration).
update public.formations
   set live_code = 'pc-express'
 where live_code is null
   and (lower(btrim(titre)) = 'pc express' or slug ~ '^pc-express(-[a-z0-9]{4})?$');
