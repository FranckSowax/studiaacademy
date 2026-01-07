-- ============================================
-- FIX RLS POLICIES FOR USER REGISTRATION
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- ============================================
-- 1. PERMETTRE AU SERVICE ROLE D'INSÉRER (via trigger)
-- ============================================

-- Le trigger handle_new_user utilise SECURITY DEFINER,
-- donc il s'exécute avec les droits du créateur (superuser).
-- Mais on doit aussi permettre aux utilisateurs authentifiés
-- de lire leurs propres données après création.

-- === PROFILES - Ajouter politique INSERT pour le trigger ===
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- Permettre aux utilisateurs de voir leur profil (déjà existant, mais on s'assure)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- === WALLETS - Ajouter politique INSERT ===
DROP POLICY IF EXISTS "Service role can insert wallets" ON public.wallets;
CREATE POLICY "Service role can insert wallets"
    ON public.wallets FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- === USER_SETTINGS - Ajouter politique INSERT ===
DROP POLICY IF EXISTS "Service role can insert user_settings" ON public.user_settings;
CREATE POLICY "Service role can insert user_settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- === NOTIFICATIONS - Ajouter politique INSERT ===
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 2. VÉRIFIER QUE LE TRIGGER EXISTE
-- ============================================

-- Recréer la fonction avec les bons privilèges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer le profil
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );

    -- Créer le wallet avec 50 crédits de bienvenue
    INSERT INTO public.wallets (user_id, balance, total_earned)
    VALUES (NEW.id, 50, 50);

    -- Créer les paramètres par défaut
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    -- Créer une notification de bienvenue
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
        NEW.id,
        'success',
        'Bienvenue sur Studia Academy !',
        'Vous avez reçu 50 crédits gratuits pour découvrir nos services.'
    );

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log l'erreur mais ne pas bloquer l'inscription
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. ACCORDER LES PERMISSIONS AU SERVICE ROLE
-- ============================================

-- Donner les permissions au service role sur les tables
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.user_settings TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- Donner les permissions aux utilisateurs authentifiés
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- ============================================
-- 4. PERMETTRE L'ACCÈS ANONYME AUX SERVICES ET COURS
-- ============================================

-- Les utilisateurs non connectés doivent pouvoir voir les services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Anyone can view active courses"
    ON public.courses FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Anyone can view active credit packs" ON public.credit_packs;
CREATE POLICY "Anyone can view active credit packs"
    ON public.credit_packs FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Anyone can view active tests" ON public.competency_tests;
CREATE POLICY "Anyone can view active tests"
    ON public.competency_tests FOR SELECT
    USING (is_active = TRUE);

-- Accorder SELECT aux anonymes
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.credit_packs TO anon;
GRANT SELECT ON public.competency_tests TO anon;

-- ============================================
-- FIN DU SCRIPT DE CORRECTION
-- ============================================

-- Pour tester, essayez de créer un compte.
-- Si ça fonctionne, vous verrez dans la table profiles
-- un nouveau profil avec l'email que vous avez utilisé.
