-- ============================================================
-- Seed : 4 formations IA + 2 sessions fictives par formation
-- Ajuster prix et dates avant mise en production.
-- ============================================================

insert into fia_formations
  (slug, code, titre, promesse, public_cible, prix_fcfa, prix_groupe_fcfa,
   effectif_min, effectif_max, couleur_from, couleur_to, actif)
values
  ('ia-les-bases','F1','IA : Les Bases',
   'Maîtrisez l''IA en 1 journée, même sans être technicien',
   'Tous collaborateurs, managers, patrons de PME — aucun profil technique',
   95000, 80750, 8, 15, '#4338ca', '#6d28d9', true),

  ('ia-communication','F2','IA & Communication',
   '1 mois de contenu produit en 1 journée',
   'Chargés de communication, community managers, commerçants, entrepreneurs',
   145000, 123250, 8, 12, '#db2777', '#f97316', true),

  ('ia-administratif','F3','IA & Administratif',
   'Divisez par 2 le temps de vos tâches administratives',
   'Assistants de direction, RH, comptables, agents administratifs',
   145000, 123250, 8, 15, '#0d9488', '#059669', true),

  ('ia-direction','F4','IA & Direction',
   'Des dossiers de 50 pages aux décisions en 30 minutes',
   'DG, directeurs, secrétaires généraux, cadres dirigeants',
   null, null, 6, 10, '#141828', '#f5b301', true)
on conflict (slug) do nothing;

insert into fia_sessions (formation_id, date, lieu, places_total, statut)
select f.id, s.date::date, s.lieu, s.places, 'planifiee'
from fia_formations f
join (values
  ('ia-les-bases',     '2026-08-27', 'Libreville — Institut Français', 15),
  ('ia-les-bases',     '2026-09-24', 'Libreville — Institut Français', 15),
  ('ia-communication', '2026-09-03', 'Libreville — Institut Français', 12),
  ('ia-communication', '2026-10-01', 'Libreville — Institut Français', 12),
  ('ia-administratif', '2026-09-10', 'Libreville — Institut Français', 15),
  ('ia-administratif', '2026-10-08', 'Libreville — Institut Français', 15),
  ('ia-direction',     '2026-09-17', 'Libreville — lieu communiqué aux inscrits', 10),
  ('ia-direction',     '2026-10-15', 'Libreville — lieu communiqué aux inscrits', 10)
) as s(slug, date, lieu, places) on s.slug = f.slug
where not exists (
  select 1 from fia_sessions x
  where x.formation_id = f.id and x.date = s.date::date
);
