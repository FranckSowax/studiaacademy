-- ============================================================
-- Sécurité — fonctions SECURITY DEFINER réservées au serveur
-- ============================================================
-- WHY: Supabase accorde EXECUTE directement à anon et authenticated sur
-- toute nouvelle fonction du schéma public ; « REVOKE … FROM PUBLIC » ne
-- retire PAS ces droits. Sans ce correctif, la clé publique du site permet
-- d'appeler /rest/v1/rpc/refund_credits (créer des crédits), consume_credits,
-- increment_live_score, reserve/release_presentiel_seat et check_rate_limit.
-- Toutes sont appelées uniquement par le serveur (service_role).
-- Une fonction absente (base où security-p1.sql n'a pas tourné) est ignorée.

DO $$
DECLARE
  fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.check_rate_limit(text, integer, integer)',
    'public.consume_credits(uuid, integer, text)',
    'public.refund_credits(uuid, integer, text)',
    'public.increment_live_score(uuid, integer)',
    'public.reserve_presentiel_seat(uuid)',
    'public.release_presentiel_seat(uuid)'
  ]
  LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END IF;
  END LOOP;
END
$$;
