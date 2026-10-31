-- ============================================================
-- Messagerie — recherches clients (demandes hors catalogue)
-- ============================================================
-- Une demande numérotée (W-XXXXXXXX) par besoin exprimé, suivie par l'équipe.
-- Les ajouts s'EMPILENT dans notes (signés, horodatés) : jamais écrasés.

CREATE TABLE IF NOT EXISTS public.wa_customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL UNIQUE,
  conversation_id UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'searching', 'proposed', 'done', 'cancelled')),
  -- [{ at, author_id, author_name, text }]
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{ kind: 'upload', path } | { kind: 'message', ref }] — 10 au plus
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_by_name TEXT,
  status_changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_customer_requests_conversation_idx
  ON public.wa_customer_requests (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wa_customer_requests_status_idx
  ON public.wa_customer_requests (status, updated_at DESC);

DROP TRIGGER IF EXISTS wa_customer_requests_touch ON public.wa_customer_requests;
CREATE TRIGGER wa_customer_requests_touch
  BEFORE UPDATE ON public.wa_customer_requests
  FOR EACH ROW EXECUTE FUNCTION public.wa_touch_updated_at();

ALTER TABLE public.wa_customer_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wa_customer_requests FROM anon, authenticated;
