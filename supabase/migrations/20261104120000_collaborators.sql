-- ============================================================
-- Collaborateurs de l'équipe + connexion par code (OTP)
-- ============================================================
-- Chaque collaborateur a son propre compte. Connexion sans mot de passe :
-- un code à 6 chiffres envoyé par WhatsApp (WAHA), ou par email à défaut.
-- Écritures : service_role uniquement (routes serveur gardées).
-- Les réponses de la messagerie gardent leur auteur dans
-- wa_messages.sent_by (= user_id du collaborateur).

-- ------------------------------------------------------------
-- 1. collaborators — la fiche d'équipe
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Compte de connexion, créé au premier code validé (ou lié à un compte existant)
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 120),
  -- Email en minuscules ; téléphone au format international sans « + »
  email TEXT CHECK (email IS NULL OR (email = lower(email) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  whatsapp_phone TEXT CHECK (whatsapp_phone IS NULL OR whatsapp_phone ~ '^[1-9][0-9]{7,14}$'),
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Il faut au moins un moyen de recevoir le code
  CONSTRAINT collaborators_contact_required CHECK (email IS NOT NULL OR whatsapp_phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS collaborators_email_idx ON public.collaborators (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS collaborators_phone_idx ON public.collaborators (whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS collaborators_active_idx ON public.collaborators (is_active, full_name);

DROP TRIGGER IF EXISTS collaborators_touch ON public.collaborators;
CREATE TRIGGER collaborators_touch
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW EXECUTE FUNCTION public.wa_touch_updated_at();

-- ------------------------------------------------------------
-- 2. collaborator_otps — codes de connexion (jamais en clair)
-- ------------------------------------------------------------
-- id = identifiant du défi renvoyé au navigateur ; code_hash = HMAC-SHA256
-- (secret serveur) du code. Durée courte, tentatives limitées, usage unique.
CREATE TABLE IF NOT EXISTS public.collaborator_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'console')),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collaborator_otps_collab_idx
  ON public.collaborator_otps (collaborator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS collaborator_otps_expires_idx
  ON public.collaborator_otps (expires_at);

-- Historique par collaborateur dans la messagerie
CREATE INDEX IF NOT EXISTS wa_messages_sent_by_idx
  ON public.wa_messages (sent_by, sent_at DESC) WHERE sent_by IS NOT NULL;

-- ------------------------------------------------------------
-- 3. Rôle effectif de la personne connectée
-- ------------------------------------------------------------
-- WHY: une seule règle pour le middleware, les gardes serveur et les RLS.
-- Une fiche collaborateur désactivée coupe TOUS les accès, même si le
-- profil porte encore role = 'admin'. Sans fiche : règle historique
-- (profiles.role admin / super_admin, ou inbox_access ⇒ agent).
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
    WHEN EXISTS (SELECT 1 FROM c) THEN (SELECT role FROM c)
    WHEN (SELECT role FROM p) = 'admin' THEN 'admin'
    WHEN COALESCE((SELECT inbox_access FROM p), FALSE) THEN 'agent'
    ELSE NULL
  END;
$$;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated, service_role;

-- is_admin() / is_super_admin() (security-p0.sql) suivent désormais cette
-- règle : les policies existantes respectent la désactivation.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_staff_role() IN ('admin', 'super_admin'), FALSE);
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_staff_role() = 'super_admin', FALSE);
$$;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_otps ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.collaborators FROM anon, authenticated;
REVOKE ALL ON public.collaborator_otps FROM anon, authenticated;
-- Lecture seule pour les comptes connectés ; la policy restreint les lignes.
GRANT SELECT ON public.collaborators TO authenticated;

DROP POLICY IF EXISTS "collaborators_select_self_or_admin" ON public.collaborators;
CREATE POLICY "collaborators_select_self_or_admin" ON public.collaborators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- collaborator_otps : aucune policy ⇒ service_role uniquement.

-- ------------------------------------------------------------
-- 5. Reprise des accès existants
-- ------------------------------------------------------------
-- Les admins et collaborateurs messagerie actuels reçoivent une fiche,
-- pour se connecter par code et apparaître dans la gestion d'équipe.
-- (super_admin reste porté par le profil.)
INSERT INTO public.collaborators (user_id, full_name, email, role)
SELECT
  p.id,
  COALESCE(NULLIF(btrim(p.full_name), ''), split_part(p.email, '@', 1)),
  lower(p.email),
  CASE WHEN p.role IN ('admin', 'super_admin') THEN 'admin' ELSE 'agent' END
FROM public.profiles p
WHERE (p.role IN ('admin', 'super_admin') OR p.inbox_access)
  AND p.email IS NOT NULL
  AND p.email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND NOT EXISTS (SELECT 1 FROM public.collaborators c WHERE c.user_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM public.collaborators c WHERE c.email = lower(p.email));
