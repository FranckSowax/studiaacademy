-- ============================================================
-- Sécurité — résultats Kahoot solo (reprise de security-p0.sql §4)
-- ============================================================
-- WHY: l'enregistrement (saveKahootSoloResult) et le classement public
-- (kahoot/[id]) passent par le service_role. L'INSERT public permettait
-- d'injecter des scores arbitraires via l'API REST, la lecture publique
-- exposait tous les résultats. Le professeur lit ceux de SES kahoots.
-- Base sans module Kahoot (pas de table) : rien à faire.

DO $$
BEGIN
  IF to_regclass('public.kahoot_solo_results') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Public insert kahoot solo result" ON public.kahoot_solo_results;
  DROP POLICY IF EXISTS "Public read kahoot solo results" ON public.kahoot_solo_results;
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
END
$$;
