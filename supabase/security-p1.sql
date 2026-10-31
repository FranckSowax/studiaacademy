-- ============================================================
-- SECURITY P1 + WAHA — à exécuter APRÈS security-p0.sql
-- Idempotent. Le code applicatif déployé en même temps DÉPEND de ce
-- script (fonctions RPC et tables ci-dessous) : exécuter avant le déploiement.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Rate limiting générique (fenêtre fixe), appelé côté serveur
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Retourne TRUE si l'action est autorisée (compteur incrémenté), FALSE sinon.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limits AS r (key, window_start, count)
  VALUES (p_key, NOW(), 1)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN r.window_start < NOW() - make_interval(secs => p_window_seconds) THEN 1
      ELSE r.count + 1
    END,
    window_start = CASE
      WHEN r.window_start < NOW() - make_interval(secs => p_window_seconds) THEN NOW()
      ELSE r.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- Purge (à planifier via pg_cron si activé) :
-- SELECT cron.schedule('purge-rate-limits', '0 * * * *',
--   $$DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '2 days'$$);

-- ------------------------------------------------------------
-- 2. Crédits : débit / remboursement atomiques
-- ------------------------------------------------------------
-- WHY: l'ancien code lisait le solde puis l'écrivait (course : deux
-- requêtes parallèles dépensaient plus que le solde).
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS INTEGER -- nouveau solde, NULL si solde insuffisant ou wallet absent
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet UUID;
  v_balance INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Montant invalide';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount,
      total_spent = COALESCE(total_spent, 0) + p_amount
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING id, balance INTO v_wallet, v_balance;

  IF v_wallet IS NULL THEN
    RETURN NULL;
  END IF;

  -- INSERT direct en 'completed' : le trigger on_transaction_completed
  -- (AFTER UPDATE) ne se déclenche pas → pas de double débit.
  INSERT INTO public.transactions (user_id, wallet_id, type, status, amount, credits, description, completed_at)
  VALUES (p_user_id, v_wallet, 'service_payment', 'completed', p_amount, p_amount, p_description, NOW());

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet UUID;
  v_balance INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Montant invalide';
  END IF;

  UPDATE public.wallets
  SET balance = balance + p_amount,
      total_spent = GREATEST(0, COALESCE(total_spent, 0) - p_amount)
  WHERE user_id = p_user_id
  RETURNING id, balance INTO v_wallet, v_balance;

  IF v_wallet IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.transactions (user_id, wallet_id, type, status, amount, credits, description, completed_at)
  VALUES (p_user_id, v_wallet, 'refund', 'completed', p_amount, p_amount, p_description, NOW());

  RETURN v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(UUID, INTEGER, TEXT) TO service_role;

-- ------------------------------------------------------------
-- 3. Transactions et wallets : lecture seule pour l'utilisateur
-- ------------------------------------------------------------
-- WHY: un utilisateur pouvait insérer une transaction 'credit_purchase'
-- puis la passer en 'completed' → le trigger créditait son wallet.
-- Aucun code applicatif n'écrit ces tables avec la session utilisateur.
DROP POLICY IF EXISTS "Users own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM anon, authenticated;

-- Le wallet est créé par handle_new_user (SECURITY DEFINER).
DROP POLICY IF EXISTS "wallets_insert" ON public.wallets;
DROP POLICY IF EXISTS "Service role can insert wallets" ON public.wallets;
REVOKE INSERT, UPDATE, DELETE ON public.wallets FROM anon, authenticated;

-- ------------------------------------------------------------
-- 4. Storage : copies d'élèves et sources de cours privées par dossier
-- ------------------------------------------------------------
-- Tous les uploads utilisent le chemin "<auth.uid()>/...".
-- Les workers lisent via service_role (non concerné par ces policies).
DROP POLICY IF EXISTS "Auth upload teacher files" ON storage.objects;
DROP POLICY IF EXISTS "Auth read teacher files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers upload copies" ON storage.objects;
DROP POLICY IF EXISTS "Teachers read copies" ON storage.objects;

DROP POLICY IF EXISTS "Own folder upload teacher files" ON storage.objects;
CREATE POLICY "Own folder upload teacher files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('copies', 'cours-sources')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Own folder read teacher files" ON storage.objects;
CREATE POLICY "Own folder read teacher files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('copies', 'cours-sources')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Taille et types autorisés (contrôle serveur Supabase)
UPDATE storage.buckets
SET file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = ARRAY[
      'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg'
    ],
    public = false
WHERE id IN ('copies', 'cours-sources');

-- ------------------------------------------------------------
-- 5. Live : bonnes réponses hors de la table publique
-- ------------------------------------------------------------
-- WHY: live_games est lisible publiquement (realtime des joueurs anonymes) ;
-- les bonnes réponses partent donc dans une table réservée au service_role.
CREATE TABLE IF NOT EXISTS public.live_game_answers (
  game_id UUID PRIMARY KEY REFERENCES public.live_games(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.live_game_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_game_answers FROM anon, authenticated;

-- Bonne réponse de la question courante, publiée seulement à la révélation.
ALTER TABLE public.live_games ADD COLUMN IF NOT EXISTS revealed_answer INTEGER;

-- Une seule réponse par joueur et par question.
CREATE UNIQUE INDEX IF NOT EXISTS live_answers_player_question_uniq
  ON public.live_answers (player_id, question_index);

CREATE OR REPLACE FUNCTION public.increment_live_score(p_player_id UUID, p_points INTEGER)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.live_players SET score = COALESCE(score, 0) + p_points WHERE id = p_player_id;
$$;
REVOKE ALL ON FUNCTION public.increment_live_score(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_live_score(UUID, INTEGER) TO service_role;

-- Les parties créées AVANT ce script gardent leurs réponses dans
-- live_games.questions jusqu'à leur fin ; les nouvelles n'exposent plus rien.

-- ------------------------------------------------------------
-- 6. Réservation présentiel : place décrémentée atomiquement
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_presentiel_seat(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  UPDATE public.presentiel_sessions
  SET places_reservees = places_reservees + 1
  WHERE id = p_session_id AND places_reservees < places_total
  RETURNING id INTO v_id;
  RETURN v_id IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_presentiel_seat(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_presentiel_seat(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.release_presentiel_seat(p_session_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.presentiel_sessions
  SET places_reservees = GREATEST(0, places_reservees - 1)
  WHERE id = p_session_id;
$$;
REVOKE ALL ON FUNCTION public.release_presentiel_seat(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_presentiel_seat(UUID) TO service_role;

-- 7. (retiré) La table des messages WhatsApp entrants est remplacée par les
--    tables wa_* : supabase/migrations/20261031120000_wa_inbox.sql
