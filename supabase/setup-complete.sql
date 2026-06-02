-- ============================================================
-- STUDIA ACADEMY — SETUP COMPLET (base vierge)
-- ============================================================
-- À exécuter UNE SEULE FOIS sur une nouvelle base Supabase vide.
-- Inclut : schéma plateforme + espace professeur.
-- Corrections Gabon appliquées (country/timezone).
-- ============================================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TYPES ENUM
-- ============================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending', 'deleted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('credit_purchase', 'service_payment', 'refund', 'bonus'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('airtel_money', 'moov_money', 'stripe', 'wallet', 'free'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cv_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('pending', 'processing', 'done', 'error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE devoir_status AS ENUM ('draft', 'active', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE qcm_session_status AS ENUM ('in_progress', 'submitted', 'corrected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE question_type AS ENUM ('qcm', 'texte_court', 'texte_long'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- 3. FONCTION updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. PROFILES (+ champs professeur)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    country TEXT DEFAULT 'Gabon',
    city TEXT DEFAULT 'Libreville',
    address TEXT,
    bio TEXT,
    role user_role DEFAULT 'user',
    status account_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_teacher BOOLEAN DEFAULT FALSE,
    teacher_onboarding_done BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- 5. WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'XAF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- ============================================
-- 6. TRANSACTIONS
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

-- ============================================
-- 7. SERVICES
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

-- ============================================
-- 8. COURSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_name TEXT,
    category TEXT NOT NULL,
    level skill_level DEFAULT 'beginner',
    duration_minutes INTEGER DEFAULT 0,
    price_credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    modules JSONB DEFAULT '[]',
    enrollment_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. ENROLLMENTS / CVS / ANALYSES / TESTS / INTERVIEWS / CHAT / NOTIFS / SETTINGS / CREDIT_PACKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Mon CV',
    status cv_status DEFAULT 'draft',
    template TEXT DEFAULT 'modern',
    personal_info JSONB DEFAULT '{}',
    experiences JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Africa/Libreville',
    theme TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_xof INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ESPACE PROFESSEUR
-- ============================================
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    matiere TEXT,
    niveau_enseignement TEXT,
    etablissement TEXT,
    ville TEXT DEFAULT 'Libreville',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON public.teacher_profiles(user_id);

CREATE TABLE IF NOT EXISTS public.correction_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID UNIQUE REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    wizard_config JSONB DEFAULT '{}',
    learned_patterns JSONB DEFAULT '{}',
    few_shot_examples JSONB DEFAULT '[]',
    version INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    niveau TEXT,
    annee_scolaire TEXT DEFAULT '2025-2026',
    nb_eleves INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);

CREATE TABLE IF NOT EXISTS public.correction_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    titre TEXT NOT NULL,
    matiere TEXT,
    niveau TEXT,
    bareme JSONB DEFAULT '{"questions": []}',
    nb_copies INTEGER DEFAULT 0,
    is_bootstrap BOOLEAN DEFAULT FALSE,
    status devoir_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_correction_sessions_teacher_id ON public.correction_sessions(teacher_id);

CREATE TABLE IF NOT EXISTS public.correction_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.correction_sessions(id) ON DELETE CASCADE,
    eleve_nom TEXT,
    eleve_prenom TEXT,
    eleve_phone TEXT,
    parent_phone TEXT,
    input_files TEXT[] DEFAULT '{}',
    ocr_text TEXT,
    status job_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    result_json JSONB DEFAULT '{}',
    note_finale DECIMAL(5,2),
    validated BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    report_token UUID DEFAULT uuid_generate_v4(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_correction_jobs_session_id ON public.correction_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_correction_jobs_report_token ON public.correction_jobs(report_token);

CREATE TABLE IF NOT EXISTS public.qcm_devoirs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    titre TEXT NOT NULL,
    matiere TEXT,
    niveau TEXT,
    source_content TEXT,
    nb_questions_qcm INTEGER DEFAULT 0,
    nb_questions_ouvertes INTEGER DEFAULT 0,
    duree_minutes INTEGER DEFAULT 30,
    difficulte TEXT DEFAULT 'moyen',
    questions JSONB DEFAULT '[]',
    bareme_json JSONB DEFAULT '{}',
    note_totale DECIMAL(5,2) DEFAULT 20,
    access_code VARCHAR(12) UNIQUE,
    link_token UUID UNIQUE DEFAULT uuid_generate_v4(),
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    unlocked_at TIMESTAMPTZ,
    generation_status job_status DEFAULT 'pending',
    status devoir_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qcm_devoirs_teacher_id ON public.qcm_devoirs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_qcm_devoirs_link_token ON public.qcm_devoirs(link_token);
CREATE INDEX IF NOT EXISTS idx_qcm_devoirs_access_code ON public.qcm_devoirs(access_code);

CREATE TABLE IF NOT EXISTS public.qcm_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devoir_id UUID REFERENCES public.qcm_devoirs(id) ON DELETE CASCADE,
    eleve_nom TEXT NOT NULL,
    eleve_prenom TEXT NOT NULL,
    eleve_email TEXT,
    parent_phone TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    duree_reelle_secondes INTEGER,
    score DECIMAL(5,2),
    score_sur DECIMAL(5,2),
    mention VARCHAR(50),
    status qcm_session_status DEFAULT 'in_progress',
    report_token UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qcm_sessions_devoir_id ON public.qcm_sessions(devoir_id);
CREATE INDEX IF NOT EXISTS idx_qcm_sessions_report_token ON public.qcm_sessions(report_token);

CREATE TABLE IF NOT EXISTS public.qcm_reponses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.qcm_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL,
    type_question question_type NOT NULL,
    reponse_donnee TEXT,
    est_correcte BOOLEAN,
    points_obtenus DECIMAL(5,2) DEFAULT 0,
    points_max DECIMAL(5,2) DEFAULT 0,
    commentaire_ia TEXT,
    analysed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qcm_reponses_session_id ON public.qcm_reponses(session_id);

-- ============================================
-- 11. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_cvs_updated_at ON public.cvs;
CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON public.cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_correction_profiles_updated_at ON public.correction_profiles;
CREATE TRIGGER update_correction_profiles_updated_at BEFORE UPDATE ON public.correction_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_correction_jobs_updated_at ON public.correction_jobs;
CREATE TRIGGER update_correction_jobs_updated_at BEFORE UPDATE ON public.correction_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger nouvel utilisateur : profil + wallet + settings + notif bienvenue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''));
    INSERT INTO public.wallets (user_id, balance, total_earned) VALUES (NEW.id, 50, 50);
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.id, 'success', 'Bienvenue sur Studia Academy !', 'Vous avez reçu 50 crédits gratuits.');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 12. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_devoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_reponses ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets / transactions / cvs / enrollments / notifications / settings
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own transactions" ON public.transactions;
CREATE POLICY "Users own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own cvs" ON public.cvs;
CREATE POLICY "Users own cvs" ON public.cvs FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own enrollments" ON public.enrollments;
CREATE POLICY "Users own enrollments" ON public.enrollments FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own notifications" ON public.notifications;
CREATE POLICY "Users own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own settings" ON public.user_settings;
CREATE POLICY "Users own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Catalogue public
DROP POLICY IF EXISTS "Anyone view active services" ON public.services;
CREATE POLICY "Anyone view active services" ON public.services FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Anyone view active courses" ON public.courses;
CREATE POLICY "Anyone view active courses" ON public.courses FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Anyone view active packs" ON public.credit_packs;
CREATE POLICY "Anyone view active packs" ON public.credit_packs FOR SELECT USING (is_active = TRUE);

-- Espace professeur
DROP POLICY IF EXISTS "Teachers own profile" ON public.teacher_profiles;
CREATE POLICY "Teachers own profile" ON public.teacher_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Teachers own correction profile" ON public.correction_profiles;
CREATE POLICY "Teachers own correction profile" ON public.correction_profiles FOR ALL USING (teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Teachers own classes" ON public.classes;
CREATE POLICY "Teachers own classes" ON public.classes FOR ALL USING (teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Teachers own correction sessions" ON public.correction_sessions;
CREATE POLICY "Teachers own correction sessions" ON public.correction_sessions FOR ALL USING (teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Teachers own correction jobs" ON public.correction_jobs;
CREATE POLICY "Teachers own correction jobs" ON public.correction_jobs FOR ALL USING (
    session_id IN (SELECT cs.id FROM public.correction_sessions cs JOIN public.teacher_profiles tp ON cs.teacher_id = tp.id WHERE tp.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Teachers own qcm devoirs" ON public.qcm_devoirs;
CREATE POLICY "Teachers own qcm devoirs" ON public.qcm_devoirs FOR ALL USING (teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read active qcm" ON public.qcm_devoirs;
CREATE POLICY "Public read active qcm" ON public.qcm_devoirs FOR SELECT USING (status = 'active');

-- Sessions/réponses QCM accessibles aux élèves sans compte
DROP POLICY IF EXISTS "Public create qcm session" ON public.qcm_sessions;
CREATE POLICY "Public create qcm session" ON public.qcm_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read qcm session" ON public.qcm_sessions;
CREATE POLICY "Public read qcm session" ON public.qcm_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public update qcm session" ON public.qcm_sessions;
CREATE POLICY "Public update qcm session" ON public.qcm_sessions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public manage qcm reponses" ON public.qcm_reponses;
CREATE POLICY "Public manage qcm reponses" ON public.qcm_reponses FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 13. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('copies', 'copies', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cours-sources', 'cours-sources', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Auth upload teacher files" ON storage.objects;
CREATE POLICY "Auth upload teacher files" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('copies', 'cours-sources') AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth read teacher files" ON storage.objects;
CREATE POLICY "Auth read teacher files" ON storage.objects FOR SELECT USING (bucket_id IN ('copies', 'cours-sources') AND auth.role() = 'authenticated');

-- ============================================
-- 14. DONNÉES INITIALES (packs de crédits)
-- ============================================
INSERT INTO public.credit_packs (name, credits, price_xof, bonus_credits, is_popular) VALUES
('Starter', 100, 2000, 0, FALSE),
('Basic', 250, 4500, 25, FALSE),
('Popular', 500, 8000, 75, TRUE),
('Pro', 1000, 14000, 200, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- FIN — Base prête
-- ============================================
