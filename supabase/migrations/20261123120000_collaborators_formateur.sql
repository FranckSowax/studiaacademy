-- ============================================================
-- Studia Academy — rôle d'équipe « formateur » (accès Studia Live)
--
-- Un formateur ouvre Studia Live depuis Academy (bouton « Ouvrir Studia
-- Live », route /api/studia-live/formateur). Ce droit est donné par un
-- administrateur, sur la fiche collaborateur : le « mode professeur »
-- en libre-service (teacher_profiles) ne le donne pas.
--
-- Le rôle « formateur » n'ouvre NI l'espace admin NI la messagerie :
-- current_staff_role() renvoie NULL pour lui, comme pour un client.
-- Désactiver la fiche coupe l'accès à Studia Live.
-- ============================================================

ALTER TABLE public.collaborators
  DROP CONSTRAINT IF EXISTS collaborators_role_check;
ALTER TABLE public.collaborators
  ADD CONSTRAINT collaborators_role_check
  CHECK (role IN ('admin', 'agent', 'formateur'));

-- Même règle qu'avant (20261104120000_collaborators.sql), avec une seule
-- différence : une fiche « formateur » ne donne aucun rôle d'équipe.
-- WHY: les policies RLS de la messagerie et de l'admin s'appuient sur
-- cette fonction ; y laisser passer « formateur » leur ouvrirait ces
-- données.
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH c AS (
    SELECT role, is_active FROM public.collaborators WHERE user_id = auth.uid()
  ), p AS (
    SELECT role, inbox_access FROM public.profiles WHERE id = auth.uid()
  )
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN EXISTS (SELECT 1 FROM c WHERE NOT is_active) THEN NULL
    WHEN (SELECT role FROM p) = 'super_admin' THEN 'super_admin'
    WHEN EXISTS (SELECT 1 FROM c) THEN (SELECT NULLIF(role, 'formateur') FROM c)
    WHEN (SELECT role FROM p) = 'admin' THEN 'admin'
    WHEN COALESCE((SELECT inbox_access FROM p), FALSE) THEN 'agent'
    ELSE NULL
  END;
$$;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated, service_role;
