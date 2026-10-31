-- ============================================================
-- Messagerie — accès collaborateurs et jeton opaque des médias
-- ============================================================

-- ------------------------------------------------------------
-- 1. Accès à la messagerie pour un collaborateur non admin
-- ------------------------------------------------------------
-- Les admins / super_admins y ont toujours accès ; un autre compte seulement
-- si inbox_access = true (attribué par un super_admin).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS inbox_access BOOLEAN NOT NULL DEFAULT FALSE;

-- Helpers (identiques à security-p0.sql ; redéfinis ici pour que la
-- migration soit autonome sur une base locale).
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
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- WHY: sans protection, un utilisateur pourrait s'octroyer l'accès à la
-- messagerie (et donc aux conversations de tous les clients) via l'API REST.
-- Même logique que security-p0.sql, avec inbox_access en plus.
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
    NEW.role := 'user';
    NEW.status := 'active';
    NEW.inbox_access := FALSE;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
     OR NEW.phone_verified IS DISTINCT FROM OLD.phone_verified
     OR NEW.inbox_access IS DISTINCT FROM OLD.inbox_access
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

-- ------------------------------------------------------------
-- 2. Jeton opaque pour les URL de médias
-- ------------------------------------------------------------
-- WHY: l'identifiant WAHA d'un message contient le numéro ou le @lid du
-- contact ; il ne doit jamais apparaître dans une URL.
ALTER TABLE public.wa_messages
  ADD COLUMN IF NOT EXISTS public_ref TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '');
CREATE UNIQUE INDEX IF NOT EXISTS wa_messages_public_ref_idx ON public.wa_messages (public_ref);
