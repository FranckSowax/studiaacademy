-- ============================================================
-- Messagerie — paniers composés par l'équipe (inscriptions Formations IA)
-- ============================================================
-- Un panier = une ou plusieurs inscriptions fia_inscriptions créées au nom du
-- client par la fonction existante fia_inscrire (aucun calcul de prix ici :
-- les montants sont recalculés à l'envoi par src/lib/formations-ia-pricing.ts).

CREATE TABLE IF NOT EXISTS public.wa_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  client_first_name TEXT NOT NULL,
  client_last_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  inscription_type TEXT NOT NULL DEFAULT 'individuel'
    CHECK (inscription_type IN ('individuel', 'entreprise')),
  societe TEXT,
  -- [{ session_id, participants, inscription_id }]
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial')),
  created_by TEXT,
  created_by_name TEXT,
  updated_by_name TEXT,
  sent_at TIMESTAMPTZ,
  -- Résultat détaillé du dernier envoi (messages partis, erreurs, total)
  last_send_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_carts_conversation_idx ON public.wa_carts (conversation_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS wa_carts_updated_idx ON public.wa_carts (updated_at DESC);

DROP TRIGGER IF EXISTS wa_carts_touch ON public.wa_carts;
CREATE TRIGGER wa_carts_touch
  BEFORE UPDATE ON public.wa_carts
  FOR EACH ROW EXECUTE FUNCTION public.wa_touch_updated_at();

ALTER TABLE public.wa_carts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wa_carts FROM anon, authenticated;
