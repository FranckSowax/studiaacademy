-- ============================================================
-- SECURITY P0 — correctifs critiques (audit du 2026-10-31)
-- À exécuter APRÈS setup-complete.sql, fix-rls-recursion.sql,
-- migration-teacher.sql et migrations-formations-ia/001_schema.sql.
-- Idempotent : peut être rejoué sans effet de bord.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Helper : l'utilisateur courant est-il admin / super_admin ?
-- SECURITY DEFINER pour éviter la récursion RLS sur profiles.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ------------------------------------------------------------
-- 1. PROFILES : interdire l'auto-promotion (role, status, ...)
-- ------------------------------------------------------------
-- WHY: la policy UPDATE "auth.uid() = id" n'a aucune restriction de
-- colonnes ; n'importe quel compte pouvait écrire role = 'super_admin'.
-- Le trigger est SECURITY INVOKER : current_user vaut 'authenticated'
-- ou 'anon' pour les appels PostgREST utilisateurs, 'service_role'
-- pour le backend, 'postgres' pour les triggers SECURITY DEFINER
-- (handle_new_user) et l'éditeur SQL.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Un utilisateur ne crée que SON profil, toujours en simple 'user'.
    NEW.role := 'user';
    NEW.status := 'active';
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
     OR NEW.phone_verified IS DISTINCT FROM OLD.phone_verified
     -- account_type n'existe pas dans tous les environnements : comparaison via jsonb
     OR (to_jsonb(NEW) -> 'account_type') IS DISTINCT FROM (to_jsonb(OLD) -> 'account_type')
  THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Modification de colonnes protégées du profil interdite'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Policies historiques en doublon (permissives, combinées en OR) :
-- selon le script exécuté en dernier, l'une ou l'autre existe en base.
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- La policy UPDATE doit aussi vérifier la ligne résultante.
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- L'INSERT était ouvert à tous (WITH CHECK (true)).
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- 2. QCM : supprimer les policies publiques
-- ------------------------------------------------------------
-- WHY: le parcours élève (devoir/[token], api/qcm/sessions/*) passe
-- intégralement par le service_role côté serveur. Les policies
-- USING (true) exposaient noms, téléphones des parents, notes et
-- bonnes réponses à quiconque possède la clé anon publique.
DROP POLICY IF EXISTS "Public read active qcm via link" ON public.qcm_devoirs;
-- Nom présent en production (diffère du repo) : même faille.
DROP POLICY IF EXISTS "Public read active qcm" ON public.qcm_devoirs;
DROP POLICY IF EXISTS "Public create qcm session" ON public.qcm_sessions;
DROP POLICY IF EXISTS "Public read own qcm session" ON public.qcm_sessions;
DROP POLICY IF EXISTS "Public update own qcm session" ON public.qcm_sessions;
DROP POLICY IF EXISTS "Public manage qcm reponses" ON public.qcm_reponses;

ALTER TABLE public.qcm_devoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_reponses ENABLE ROW LEVEL SECURITY;

-- Le professeur lit les sessions et réponses de SES devoirs
-- (tableau de bord + realtime dans QcmManager).
DROP POLICY IF EXISTS "Teachers read own qcm sessions" ON public.qcm_sessions;
CREATE POLICY "Teachers read own qcm sessions" ON public.qcm_sessions
  FOR SELECT TO authenticated
  USING (
    devoir_id IN (
      SELECT d.id
      FROM public.qcm_devoirs d
      JOIN public.teacher_profiles tp ON tp.id = d.teacher_id
      WHERE tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers read own qcm reponses" ON public.qcm_reponses;
CREATE POLICY "Teachers read own qcm reponses" ON public.qcm_reponses
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT s.id
      FROM public.qcm_sessions s
      JOIN public.qcm_devoirs d ON d.id = s.devoir_id
      JOIN public.teacher_profiles tp ON tp.id = d.teacher_id
      WHERE tp.user_id = auth.uid()
    )
  );

REVOKE ALL ON public.qcm_sessions FROM anon;
REVOKE ALL ON public.qcm_reponses FROM anon;
REVOKE ALL ON public.qcm_devoirs FROM anon;

-- ------------------------------------------------------------
-- 3. Formations IA : inscriptions et leads réservés aux admins
-- ------------------------------------------------------------
-- WHY: "TO authenticated USING (true)" donnait à tout compte inscrit
-- la lecture/modification des noms, téléphones et e-mails des inscrits.
DROP POLICY IF EXISTS fia_inscriptions_team_select ON fia_inscriptions;
CREATE POLICY fia_inscriptions_team_select ON fia_inscriptions
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS fia_inscriptions_team_update ON fia_inscriptions;
CREATE POLICY fia_inscriptions_team_update ON fia_inscriptions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS fia_leads_team_select ON fia_leads_entreprises;
CREATE POLICY fia_leads_team_select ON fia_leads_entreprises
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 4. Kahoot solo : plus d'écriture ni de lecture publiques
-- ------------------------------------------------------------
-- WHY: l'enregistrement (saveKahootSoloResult) et le classement public
-- (kahoot/[id]) passent par le service_role. L'INSERT public permettait
-- d'injecter des scores arbitraires via l'API REST.
DROP POLICY IF EXISTS "Public insert kahoot solo result" ON public.kahoot_solo_results;
DROP POLICY IF EXISTS "Public read kahoot solo results" ON public.kahoot_solo_results;

-- Le professeur lit les résultats de SES kahoots (professeur/kahoot/[id]).
DROP POLICY IF EXISTS "Teachers read own kahoot solo results" ON public.kahoot_solo_results;
CREATE POLICY "Teachers read own kahoot solo results" ON public.kahoot_solo_results
  FOR SELECT TO authenticated
  USING (
    kahoot_id IN (
      SELECT k.id
      FROM public.teacher_kahoots k
      JOIN public.teacher_profiles tp ON tp.id = k.teacher_id
      WHERE tp.user_id = auth.uid()
    )
  );

-- NOTE: live_games / live_players / live_answers gardent leur lecture
-- publique : les joueurs anonymes en dépendent (realtime). La fuite des
-- bonnes réponses via live_games.questions est traitée en P1 (refonte).
