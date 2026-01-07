-- ============================================
-- STUDIA ACADEMY PLATFORM - SCHEMA SQL COMPLET
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Dashboard > SQL Editor > New Query

-- ============================================
-- 1. EXTENSIONS NÉCESSAIRES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TYPES ENUM PERSONNALISÉS
-- ============================================

-- Rôles utilisateur
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Statut de compte
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Statut d'inscription aux cours
DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Statut de transaction
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Type de transaction
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('credit_purchase', 'service_payment', 'refund', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Méthode de paiement
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('airtel_money', 'moov_money', 'stripe', 'wallet', 'free');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Statut CV
DO $$ BEGIN
    CREATE TYPE cv_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Niveau de compétence
DO $$ BEGIN
    CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. TABLE PROFILES (Extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    country TEXT DEFAULT 'Burkina Faso',
    city TEXT,
    address TEXT,
    bio TEXT,
    role user_role DEFAULT 'user',
    status account_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============================================
-- 4. TABLE WALLET (Portefeuille crédit)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'XOF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- ============================================
-- 5. TABLE TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount INTEGER NOT NULL,
    credits INTEGER,
    payment_method payment_method,
    description TEXT,
    reference TEXT UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- ============================================
-- 6. TABLE SERVICES (Catalogue des services)
-- ============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    description TEXT,
    description_fr TEXT,
    icon TEXT,
    category TEXT NOT NULL,
    price_credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    faqs JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- ============================================
-- 7. TABLE SERVICE_USAGE (Utilisation des services)
-- ============================================
CREATE TABLE IF NOT EXISTS public.service_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id),
    credits_used INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result_data JSONB DEFAULT '{}',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT
);

CREATE INDEX IF NOT EXISTS idx_service_usage_user_id ON public.service_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_service_id ON public.service_usage(service_id);

-- ============================================
-- 8. TABLE COURSES (Micro-formations)
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_name TEXT,
    instructor_avatar TEXT,
    category TEXT NOT NULL,
    level skill_level DEFAULT 'beginner',
    duration_minutes INTEGER DEFAULT 0,
    price_credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    modules JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    objectives JSONB DEFAULT '[]',
    enrollment_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);

-- ============================================
-- 9. TABLE ENROLLMENTS (Inscriptions aux cours)
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0,
    current_module INTEGER DEFAULT 0,
    completed_modules JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    certificate_url TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- ============================================
-- 10. TABLE CVS (CVs des utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Mon CV',
    status cv_status DEFAULT 'draft',
    template TEXT DEFAULT 'modern',
    personal_info JSONB DEFAULT '{"fullName": "", "email": "", "phone": "", "address": "", "linkedin": "", "website": "", "summary": ""}',
    experiences JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    pdf_url TEXT,
    last_exported_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_status ON public.cvs(status);

-- ============================================
-- 11. TABLE CV_ANALYSES (Analyses de CV)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cv_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    scores JSONB DEFAULT '{"format": 0, "content": 0, "keywords": 0, "experience": 0, "education": 0, "skills": 0}',
    strengths JSONB DEFAULT '[]',
    improvements JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    keywords_found JSONB DEFAULT '[]',
    keywords_missing JSONB DEFAULT '[]',
    extracted_data JSONB DEFAULT '{}',
    job_title_target TEXT,
    industry_target TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_analyses_user_id ON public.cv_analyses(user_id);

-- ============================================
-- 12. TABLE COMPETENCY_TESTS (Tests de compétences)
-- ============================================
CREATE TABLE IF NOT EXISTS public.competency_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty skill_level DEFAULT 'intermediate',
    duration_minutes INTEGER DEFAULT 30,
    question_count INTEGER DEFAULT 20,
    passing_score INTEGER DEFAULT 70,
    is_active BOOLEAN DEFAULT TRUE,
    questions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competency_tests_category ON public.competency_tests(category);

-- ============================================
-- 13. TABLE TEST_RESULTS (Résultats des tests)
-- ============================================
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_id UUID REFERENCES public.competency_tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    time_taken_seconds INTEGER,
    category_scores JSONB DEFAULT '{}',
    answers JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);

-- ============================================
-- 14. TABLE INTERVIEW_SESSIONS (Simulations d'entretien)
-- ============================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company_type TEXT,
    interview_type TEXT DEFAULT 'behavioral',
    difficulty skill_level DEFAULT 'intermediate',
    language TEXT DEFAULT 'fr',
    status TEXT DEFAULT 'in_progress',
    messages JSONB DEFAULT '[]',
    questions_asked INTEGER DEFAULT 0,
    overall_score INTEGER,
    feedback JSONB DEFAULT '{"strengths": [], "improvements": [], "tips": []}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);

-- ============================================
-- 15. TABLE CHAT_SESSIONS (Sessions AI Career Assistant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Nouvelle conversation',
    messages JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- ============================================
-- 16. TABLE NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================
-- 17. TABLE USER_SETTINGS (Préférences utilisateur)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Africa/Ouagadougou',
    theme TEXT DEFAULT 'system',
    profile_public BOOLEAN DEFAULT FALSE,
    show_activity BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. TABLE REPORTS (Signalements/Modération)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ============================================
-- 19. TABLE CREDIT_PACKS (Packs de crédits disponibles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_xof INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    discount_percent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cvs_updated_at ON public.cvs;
CREATE TRIGGER update_cvs_updated_at
    BEFORE UPDATE ON public.cvs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement le profil et wallet lors de l'inscription
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nouveaux utilisateurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour le solde wallet
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.type = 'credit_purchase' OR NEW.type = 'bonus' THEN
            UPDATE public.wallets
            SET
                balance = balance + NEW.credits,
                total_earned = total_earned + NEW.credits
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'service_payment' THEN
            UPDATE public.wallets
            SET
                balance = balance - NEW.credits,
                total_spent = total_spent + NEW.credits
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'refund' THEN
            UPDATE public.wallets
            SET
                balance = balance + NEW.credits,
                total_spent = total_spent - NEW.credits
            WHERE id = NEW.wallet_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_completed ON public.transactions;
CREATE TRIGGER on_transaction_completed
    AFTER UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- ============================================
-- 21. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

-- === PROFILES ===
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- === WALLETS ===
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- === TRANSACTIONS ===
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Users can create transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === SERVICES ===
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
    ON public.services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- === SERVICE USAGE ===
DROP POLICY IF EXISTS "Users can view their own service usage" ON public.service_usage;
CREATE POLICY "Users can view their own service usage"
    ON public.service_usage FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create service usage" ON public.service_usage;
CREATE POLICY "Users can create service usage"
    ON public.service_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own service usage" ON public.service_usage;
CREATE POLICY "Users can update their own service usage"
    ON public.service_usage FOR UPDATE
    USING (auth.uid() = user_id);

-- === COURSES ===
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Anyone can view active courses"
    ON public.courses FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- === ENROLLMENTS ===
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
CREATE POLICY "Users can view their own enrollments"
    ON public.enrollments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create enrollments" ON public.enrollments;
CREATE POLICY "Users can create enrollments"
    ON public.enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
CREATE POLICY "Users can update their own enrollments"
    ON public.enrollments FOR UPDATE
    USING (auth.uid() = user_id);

-- === CVS ===
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.cvs;
CREATE POLICY "Users can view their own CVs"
    ON public.cvs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create CVs" ON public.cvs;
CREATE POLICY "Users can create CVs"
    ON public.cvs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own CVs" ON public.cvs;
CREATE POLICY "Users can update their own CVs"
    ON public.cvs FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.cvs;
CREATE POLICY "Users can delete their own CVs"
    ON public.cvs FOR DELETE
    USING (auth.uid() = user_id);

-- === CV ANALYSES ===
DROP POLICY IF EXISTS "Users can view their own CV analyses" ON public.cv_analyses;
CREATE POLICY "Users can view their own CV analyses"
    ON public.cv_analyses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create CV analyses" ON public.cv_analyses;
CREATE POLICY "Users can create CV analyses"
    ON public.cv_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === COMPETENCY TESTS ===
DROP POLICY IF EXISTS "Anyone can view active tests" ON public.competency_tests;
CREATE POLICY "Anyone can view active tests"
    ON public.competency_tests FOR SELECT
    USING (is_active = TRUE);

-- === TEST RESULTS ===
DROP POLICY IF EXISTS "Users can view their own test results" ON public.test_results;
CREATE POLICY "Users can view their own test results"
    ON public.test_results FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create test results" ON public.test_results;
CREATE POLICY "Users can create test results"
    ON public.test_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- === INTERVIEW SESSIONS ===
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can view their own interview sessions"
    ON public.interview_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can create interview sessions"
    ON public.interview_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can update their own interview sessions"
    ON public.interview_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- === CHAT SESSIONS ===
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view their own chat sessions"
    ON public.chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can create chat sessions"
    ON public.chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update their own chat sessions"
    ON public.chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can delete their own chat sessions"
    ON public.chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- === NOTIFICATIONS ===
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- === USER SETTINGS ===
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- === CREDIT PACKS ===
DROP POLICY IF EXISTS "Anyone can view active credit packs" ON public.credit_packs;
CREATE POLICY "Anyone can view active credit packs"
    ON public.credit_packs FOR SELECT
    USING (is_active = TRUE);

-- === REPORTS ===
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports"
    ON public.reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- 22. DONNÉES INITIALES
-- ============================================

-- Supprimer les données existantes pour éviter les doublons
DELETE FROM public.credit_packs;
DELETE FROM public.services;

-- Packs de crédits
INSERT INTO public.credit_packs (name, credits, price_xof, bonus_credits, is_popular, discount_percent) VALUES
('Starter', 100, 2000, 0, FALSE, 0),
('Basic', 250, 4500, 25, FALSE, 10),
('Popular', 500, 8000, 75, TRUE, 20),
('Pro', 1000, 14000, 200, FALSE, 30),
('Enterprise', 2500, 30000, 750, FALSE, 40);

-- Services de la plateforme
INSERT INTO public.services (slug, name, name_fr, description, description_fr, icon, category, price_credits, is_featured, features, benefits) VALUES
(
    'competency-test',
    'Competency Test',
    'Test de Compétences',
    'Evaluate your professional skills with our comprehensive assessment',
    'Évaluez vos compétences professionnelles avec notre évaluation complète',
    'ClipboardCheck',
    'assessment',
    50,
    TRUE,
    '["20+ questions par domaine", "Résultats détaillés", "Graphique radar des compétences", "Recommandations personnalisées"]',
    '["Identifiez vos forces", "Découvrez vos axes d''amélioration", "Obtenez un certificat"]'
),
(
    'cv-builder',
    'CV Builder',
    'Créateur de CV',
    'Create professional CVs with our intuitive builder',
    'Créez des CV professionnels avec notre outil intuitif',
    'FileText',
    'cv',
    0,
    TRUE,
    '["Templates modernes", "Export PDF", "Aperçu en temps réel", "Sauvegarde automatique"]',
    '["CV professionnel en minutes", "Formats ATS-friendly", "Personnalisation complète"]'
),
(
    'cv-analysis',
    'CV Analysis',
    'Analyse de CV',
    'Get AI-powered feedback on your CV',
    'Obtenez une analyse IA de votre CV',
    'Search',
    'cv',
    75,
    TRUE,
    '["Analyse par IA", "Score détaillé", "Suggestions d''amélioration", "Mots-clés manquants"]',
    '["Optimisez votre CV", "Passez les filtres ATS", "Augmentez vos chances"]'
),
(
    'interview-simulator',
    'Interview Simulator',
    'Simulateur d''Entretien',
    'Practice interviews with our AI interviewer',
    'Entraînez-vous aux entretiens avec notre IA',
    'Users',
    'interview',
    100,
    TRUE,
    '["Questions personnalisées", "Feedback en temps réel", "Différents types d''entretien", "Évaluation détaillée"]',
    '["Gagnez en confiance", "Améliorez vos réponses", "Préparez-vous efficacement"]'
),
(
    'career-assistant',
    'AI Career Assistant',
    'Assistant Carrière IA',
    'Get personalized career advice from our AI',
    'Obtenez des conseils carrière personnalisés de notre IA',
    'Bot',
    'coaching',
    25,
    TRUE,
    '["Conseils personnalisés", "Réponses instantanées", "Historique des conversations", "Ressources recommandées"]',
    '["Guidage professionnel 24/7", "Conseils adaptés à votre profil", "Planification de carrière"]'
),
(
    'micro-courses',
    'Micro-Courses',
    'Micro-Formations',
    'Learn new skills with bite-sized courses',
    'Apprenez de nouvelles compétences avec des formations courtes',
    'GraduationCap',
    'learning',
    0,
    FALSE,
    '["Vidéos courtes", "Quiz interactifs", "Certificats", "Accès illimité"]',
    '["Apprenez à votre rythme", "Compétences pratiques", "Certificats reconnus"]'
);

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
