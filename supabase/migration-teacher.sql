-- ============================================
-- STUDIA ACADEMY — ESPACE PROFESSEUR
-- Migration : Correction de copie + QCM digitaux
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. EXTENSION PROFILES (mode professeur hybride)
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_onboarding_done BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. TYPES ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'done', 'error');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE devoir_status AS ENUM ('draft', 'active', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE qcm_session_status AS ENUM ('in_progress', 'submitted', 'corrected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('qcm', 'texte_court', 'texte_long');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- 3. TEACHER_PROFILES
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

-- ============================================
-- 4. CORRECTION_PROFILES (profil IA adaptatif)
-- ============================================
CREATE TABLE IF NOT EXISTS public.correction_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID UNIQUE REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    wizard_config JSONB DEFAULT '{}',
    learned_patterns JSONB DEFAULT '{}',
    few_shot_examples JSONB DEFAULT '[]',
    version INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_correction_profiles_teacher_id ON public.correction_profiles(teacher_id);

-- ============================================
-- 5. CLASSES
-- ============================================
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

-- ============================================
-- 6. CORRECTION_SESSIONS
-- ============================================
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

-- ============================================
-- 7. CORRECTION_JOBS (une copie = un job)
-- ============================================
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
CREATE INDEX IF NOT EXISTS idx_correction_jobs_status ON public.correction_jobs(status);

-- ============================================
-- 8. QCM_DEVOIRS
-- ============================================
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

-- ============================================
-- 9. QCM_SESSIONS (un élève qui passe le devoir)
-- ============================================
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

-- ============================================
-- 10. QCM_REPONSES
-- ============================================
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
-- 11. TRIGGERS updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_correction_profiles_updated_at ON public.correction_profiles;
CREATE TRIGGER update_correction_profiles_updated_at
    BEFORE UPDATE ON public.correction_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_correction_jobs_updated_at ON public.correction_jobs;
CREATE TRIGGER update_correction_jobs_updated_at
    BEFORE UPDATE ON public.correction_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_devoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_reponses ENABLE ROW LEVEL SECURITY;

-- === TEACHER_PROFILES ===
DROP POLICY IF EXISTS "Teachers manage own profile" ON public.teacher_profiles;
CREATE POLICY "Teachers manage own profile" ON public.teacher_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === CORRECTION_PROFILES ===
DROP POLICY IF EXISTS "Teachers manage own correction profile" ON public.correction_profiles;
CREATE POLICY "Teachers manage own correction profile" ON public.correction_profiles
    FOR ALL USING (
        teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    );

-- === CLASSES ===
DROP POLICY IF EXISTS "Teachers manage own classes" ON public.classes;
CREATE POLICY "Teachers manage own classes" ON public.classes
    FOR ALL USING (
        teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    );

-- === CORRECTION_SESSIONS ===
DROP POLICY IF EXISTS "Teachers manage own correction sessions" ON public.correction_sessions;
CREATE POLICY "Teachers manage own correction sessions" ON public.correction_sessions
    FOR ALL USING (
        teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    );

-- === CORRECTION_JOBS ===
DROP POLICY IF EXISTS "Teachers manage own correction jobs" ON public.correction_jobs;
CREATE POLICY "Teachers manage own correction jobs" ON public.correction_jobs
    FOR ALL USING (
        session_id IN (
            SELECT cs.id FROM public.correction_sessions cs
            JOIN public.teacher_profiles tp ON cs.teacher_id = tp.id
            WHERE tp.user_id = auth.uid()
        )
    );

-- === QCM_DEVOIRS ===
DROP POLICY IF EXISTS "Teachers manage own qcm devoirs" ON public.qcm_devoirs;
CREATE POLICY "Teachers manage own qcm devoirs" ON public.qcm_devoirs
    FOR ALL USING (
        teacher_id IN (SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid())
    );

-- Lecture publique d'un devoir actif via link_token (élèves sans compte)
DROP POLICY IF EXISTS "Public read active qcm via link" ON public.qcm_devoirs;
CREATE POLICY "Public read active qcm via link" ON public.qcm_devoirs
    FOR SELECT USING (status = 'active');

-- === QCM_SESSIONS ===
-- Élèves créent leur session sans auth (insert public)
DROP POLICY IF EXISTS "Public create qcm session" ON public.qcm_sessions;
CREATE POLICY "Public create qcm session" ON public.qcm_sessions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read own qcm session" ON public.qcm_sessions;
CREATE POLICY "Public read own qcm session" ON public.qcm_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update own qcm session" ON public.qcm_sessions;
CREATE POLICY "Public update own qcm session" ON public.qcm_sessions
    FOR UPDATE USING (true);

-- === QCM_REPONSES ===
DROP POLICY IF EXISTS "Public manage qcm reponses" ON public.qcm_reponses;
CREATE POLICY "Public manage qcm reponses" ON public.qcm_reponses
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 13. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('copies', 'copies', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cours-sources', 'cours-sources', false)
ON CONFLICT (id) DO NOTHING;

-- Policies storage : profs uploadent leurs fichiers
DROP POLICY IF EXISTS "Teachers upload copies" ON storage.objects;
CREATE POLICY "Teachers upload copies" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('copies', 'cours-sources') AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers read copies" ON storage.objects;
CREATE POLICY "Teachers read copies" ON storage.objects
    FOR SELECT USING (bucket_id IN ('copies', 'cours-sources') AND auth.role() = 'authenticated');

-- ============================================
-- FIN MIGRATION ESPACE PROFESSEUR
-- ============================================
