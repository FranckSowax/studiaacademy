-- ============================================================
-- Page d'accueil — slides du hero (gérés depuis /admin/accueil)
-- ============================================================
-- Jusqu'à 5 slides : image de fond, titre, sous-titre, texte, bouton.
-- Lecture publique des slides actifs ; écriture réservée aux admins.

CREATE TABLE IF NOT EXISTS public.home_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordre INTEGER NOT NULL DEFAULT 0,
  titre TEXT NOT NULL CHECK (length(btrim(titre)) BETWEEN 1 AND 120),
  sous_titre TEXT CHECK (sous_titre IS NULL OR length(sous_titre) <= 160),
  texte TEXT CHECK (texte IS NULL OR length(texte) <= 400),
  cta_label TEXT CHECK (cta_label IS NULL OR length(cta_label) <= 40),
  -- Lien interne (/formations) ou externe en https uniquement
  cta_href TEXT CHECK (cta_href IS NULL OR cta_href ~ '^(/[^/]|/$|https://)'),
  image_url TEXT CHECK (image_url IS NULL OR image_url ~ '^(/[^/]|https://)'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS home_slides_ordre_idx ON public.home_slides (is_active, ordre);

DROP TRIGGER IF EXISTS home_slides_touch ON public.home_slides;
CREATE TRIGGER home_slides_touch
  BEFORE UPDATE ON public.home_slides
  FOR EACH ROW EXECUTE FUNCTION public.wa_touch_updated_at();

-- Plafond : 5 slides au total
CREATE OR REPLACE FUNCTION public.home_slides_enforce_max()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.home_slides) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 slides sur la page d''accueil';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS home_slides_max ON public.home_slides;
CREATE TRIGGER home_slides_max
  BEFORE INSERT ON public.home_slides
  FOR EACH ROW EXECUTE FUNCTION public.home_slides_enforce_max();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.home_slides FROM anon, authenticated;
GRANT SELECT ON public.home_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_slides TO authenticated;

-- is_admin() n'est pas exécutable par anon : policies séparées par rôle.
DROP POLICY IF EXISTS home_slides_public_read ON public.home_slides;
CREATE POLICY home_slides_public_read ON public.home_slides
  FOR SELECT TO anon
  USING (is_active);

DROP POLICY IF EXISTS home_slides_auth_read ON public.home_slides;
CREATE POLICY home_slides_auth_read ON public.home_slides
  FOR SELECT TO authenticated
  USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS home_slides_admin_insert ON public.home_slides;
CREATE POLICY home_slides_admin_insert ON public.home_slides
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS home_slides_admin_update ON public.home_slides;
CREATE POLICY home_slides_admin_update ON public.home_slides
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS home_slides_admin_delete ON public.home_slides;
CREATE POLICY home_slides_admin_delete ON public.home_slides
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- Stockage : images de fond (bucket public, écriture admin)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'home-slides',
  'home-slides',
  TRUE,
  5 * 1024 * 1024,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = TRUE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS home_slides_storage_insert ON storage.objects;
CREATE POLICY home_slides_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'home-slides' AND public.is_admin());

DROP POLICY IF EXISTS home_slides_storage_update ON storage.objects;
CREATE POLICY home_slides_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'home-slides' AND public.is_admin())
  WITH CHECK (bucket_id = 'home-slides' AND public.is_admin());

DROP POLICY IF EXISTS home_slides_storage_delete ON storage.objects;
CREATE POLICY home_slides_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'home-slides' AND public.is_admin());
