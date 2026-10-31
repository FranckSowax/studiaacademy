-- ============================================================
-- Messagerie — médiathèque (photos, vidéos, documents envoyables)
-- ============================================================
-- Fichiers dans un bucket PRIVÉ ; lus et envoyés uniquement côté serveur
-- (service_role), transmis à WAHA en base64. Aucune URL publique.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inbox-media',
  'inbox-media',
  FALSE,
  16 * 1024 * 1024,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.wa_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  -- Taille connue à l'envoi ; NULL si inconnue (jamais 0 par défaut)
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes > 0),
  filename TEXT,
  caption TEXT,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_media_library_created_idx ON public.wa_media_library (created_at DESC);

ALTER TABLE public.wa_media_library ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wa_media_library FROM anon, authenticated;
