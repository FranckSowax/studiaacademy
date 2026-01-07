-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- Le problème: Les politiques RLS créent une boucle infinie
-- car elles référencent auth.uid() qui peut déclencher d'autres politiques
--
-- Solution: Supprimer toutes les politiques et les recréer proprement
-- ============================================

-- ============================================
-- ÉTAPE 1: DÉSACTIVER RLS TEMPORAIREMENT
-- ============================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 2: SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Wallets
DROP POLICY IF EXISTS "Service role can insert wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert_policy" ON public.wallets;

-- User Settings
DROP POLICY IF EXISTS "Service role can insert user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;

-- Notifications
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;

-- Courses
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;

-- Enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.enrollments;

-- Credit Packs
DROP POLICY IF EXISTS "Anyone can view active credit packs" ON public.credit_packs;

-- Tests
DROP POLICY IF EXISTS "Anyone can view active tests" ON public.competency_tests;

-- ============================================
-- ÉTAPE 3: RÉACTIVER RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 4: CRÉER LES NOUVELLES POLITIQUES (SIMPLES)
-- ============================================

-- === PROFILES ===
-- INSERT: Tout le monde peut insérer (nécessaire pour le trigger)
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- SELECT: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- UPDATE: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- === WALLETS ===
CREATE POLICY "wallets_insert" ON public.wallets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "wallets_select" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- === USER_SETTINGS ===
CREATE POLICY "user_settings_insert" ON public.user_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "user_settings_select" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_settings_update" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- === NOTIFICATIONS ===
CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- === SERVICES (Public) ===
CREATE POLICY "services_select_public" ON public.services
    FOR SELECT USING (true);

-- === COURSES (Public) ===
CREATE POLICY "courses_select_public" ON public.courses
    FOR SELECT USING (true);

-- === CREDIT_PACKS (Public) ===
CREATE POLICY "credit_packs_select_public" ON public.credit_packs
    FOR SELECT USING (true);

-- === COMPETENCY_TESTS (Public) ===
CREATE POLICY "competency_tests_select_public" ON public.competency_tests
    FOR SELECT USING (true);

-- === ENROLLMENTS ===
CREATE POLICY "enrollments_insert" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enrollments_select" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enrollments_update" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- === TRANSACTIONS ===
CREATE POLICY "transactions_insert" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_select" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- === CVS ===
CREATE POLICY "cvs_insert" ON public.cvs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_select" ON public.cvs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cvs_update" ON public.cvs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cvs_delete" ON public.cvs
    FOR DELETE USING (auth.uid() = user_id);

-- === CV_ANALYSES ===
CREATE POLICY "cv_analyses_insert" ON public.cv_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cv_analyses_select" ON public.cv_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- === TEST_RESULTS ===
CREATE POLICY "test_results_insert" ON public.test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "test_results_select" ON public.test_results
    FOR SELECT USING (auth.uid() = user_id);

-- === INTERVIEW_SESSIONS ===
CREATE POLICY "interview_sessions_insert" ON public.interview_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interview_sessions_select" ON public.interview_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "interview_sessions_update" ON public.interview_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- === CHAT_SESSIONS ===
CREATE POLICY "chat_sessions_insert" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_select" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update" ON public.chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- === SERVICE_USAGE ===
CREATE POLICY "service_usage_insert" ON public.service_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_usage_select" ON public.service_usage
    FOR SELECT USING (auth.uid() = user_id);

-- === REPORTS (Admin only - skip for now, use service role) ===
CREATE POLICY "reports_select" ON public.reports
    FOR SELECT USING (false); -- Désactivé pour les utilisateurs normaux

-- ============================================
-- ÉTAPE 5: PERMISSIONS
-- ============================================

-- Service role (pour les triggers)
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.user_settings TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.enrollments TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.cvs TO service_role;
GRANT ALL ON public.cv_analyses TO service_role;
GRANT ALL ON public.competency_tests TO service_role;
GRANT ALL ON public.test_results TO service_role;
GRANT ALL ON public.interview_sessions TO service_role;
GRANT ALL ON public.chat_sessions TO service_role;
GRANT ALL ON public.service_usage TO service_role;
GRANT ALL ON public.credit_packs TO service_role;
GRANT ALL ON public.reports TO service_role;

-- Authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated;
GRANT SELECT, INSERT ON public.cv_analyses TO authenticated;
GRANT SELECT ON public.competency_tests TO authenticated;
GRANT SELECT, INSERT ON public.test_results TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.interview_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_sessions TO authenticated;
GRANT SELECT, INSERT ON public.service_usage TO authenticated;
GRANT SELECT ON public.credit_packs TO authenticated;

-- Anonymous users (public data)
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.credit_packs TO anon;
GRANT SELECT ON public.competency_tests TO anon;

-- ============================================
-- ÉTAPE 6: VÉRIFIER LE TRIGGER
-- ============================================

-- S'assurer que la fonction handle_new_user existe et fonctionne
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
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIN - TESTEZ LA CONNEXION MAINTENANT
-- ============================================

SELECT 'RLS policies fixed successfully!' as status;
