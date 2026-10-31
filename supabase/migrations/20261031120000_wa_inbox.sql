-- ============================================================
-- Messagerie WhatsApp (WAHA) — tables de suivi
-- Ces tables SUIVENT le fil WhatsApp, elles ne le remplacent pas : si elles
-- sont vidées, les conversations existent toujours dans WhatsApp/WAHA.
-- Accès : service_role uniquement (le navigateur ne lit jamais la base ;
-- tout passe par des routes serveur). RLS activée, aucune policy.
-- ============================================================

CREATE OR REPLACE FUNCTION public.wa_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- wa_conversations — une ligne par contact privé
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wa_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identité
  -- chat_id : identifiant WAHA de la discussion (xxx@lid ou xxx@c.us)
  chat_id TEXT NOT NULL UNIQUE,
  -- phone : numéro international sans « + », résolu depuis le @lid quand possible
  phone TEXT,
  name TEXT,
  -- Suivi
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  unread_count INTEGER NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  -- 'admin', id de collaborateur : texte libre exprès (pas de clé étrangère)
  assigned_to TEXT,
  -- Dénormalisé exprès : la liste s'affiche sans jointure, le nom reste si la personne part
  assigned_name TEXT,
  assigned_at TIMESTAMPTZ,
  note TEXT,
  -- Derniers échanges
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_inbound_at TIMESTAMPTZ,
  last_outbound_at TIMESTAMPTZ,
  last_outbound_status TEXT
    CHECK (last_outbound_status IS NULL OR last_outbound_status IN ('pending', 'sent', 'delivered', 'read', 'played', 'failed')),
  -- Origine : dernière publicité « Envoyer un message », ou {"type":"direct"}
  source JSONB,
  -- Qualification (copie de la dernière analyse, pour filtrer/trier sans jointure)
  purchase_stage TEXT,
  purchase_intent_score INTEGER CHECK (purchase_intent_score IS NULL OR purchase_intent_score BETWEEN 0 AND 100),
  abandon_risk TEXT,
  next_best_action TEXT,
  analyzed_at TIMESTAMPTZ,
  analyzed_message_id TEXT,
  -- Reprise d'historique WAHA (dernière synchronisation complète)
  history_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_conversations_status_last_idx
  ON public.wa_conversations (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS wa_conversations_assigned_idx
  ON public.wa_conversations (assigned_to, last_message_at DESC);
CREATE INDEX IF NOT EXISTS wa_conversations_phone_idx
  ON public.wa_conversations (phone);
CREATE INDEX IF NOT EXISTS wa_conversations_intent_idx
  ON public.wa_conversations (purchase_intent_score DESC NULLS LAST);

DROP TRIGGER IF EXISTS wa_conversations_touch ON public.wa_conversations;
CREATE TRIGGER wa_conversations_touch
  BEFORE UPDATE ON public.wa_conversations
  FOR EACH ROW EXECUTE FUNCTION public.wa_touch_updated_at();

-- ------------------------------------------------------------
-- wa_messages — une ligne par message, dans les deux sens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wa_messages (
  -- Identifiant du fournisseur = clé d'idempotence (webhook rejoué, écho,
  -- reprise d'historique : un upsert suffit, rien ne se double)
  id TEXT PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  from_me BOOLEAN NOT NULL,
  type TEXT NOT NULL,
  -- Contenu
  text TEXT,
  media_url TEXT,
  media_kind TEXT CHECK (media_kind IS NULL OR media_kind IN ('image', 'video', 'audio', 'document', 'sticker')),
  media_mimetype TEXT,
  filename TEXT,
  -- Auteur : sent_by = id collaborateur, 'admin', ou NULL (envoyé depuis le téléphone / client)
  sender_name TEXT,
  sent_by TEXT,
  -- Temps : horodatage du fournisseur, pas l'heure d'insertion
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Accusés (ne reculent jamais, voir src/lib/inbox/acks.ts)
  status TEXT CHECK (status IS NULL OR status IN ('pending', 'sent', 'delivered', 'read', 'played', 'failed')),
  status_at TIMESTAMPTZ,
  -- Contexte : publicité d'origine, message cité
  context JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS wa_messages_conversation_sent_idx
  ON public.wa_messages (conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS wa_messages_chat_idx
  ON public.wa_messages (chat_id);

-- ------------------------------------------------------------
-- wa_settings — réglages clé/valeur (épingles, phrases rapides)
-- ------------------------------------------------------------
-- inbox_pins:<rôle>:<id>  → liste d'uuid de conversations (personnelle)
-- inbox_quick_replies     → liste de phrases rapides (équipe)
-- Le contenu est validé à la lecture côté serveur (src/lib/inbox/settings.ts).
CREATE TABLE IF NOT EXISTS public.wa_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS wa_settings_touch ON public.wa_settings;
CREATE TRIGGER wa_settings_touch
  BEFORE UPDATE ON public.wa_settings
  FOR EACH ROW EXECUTE FUNCTION public.wa_touch_updated_at();

-- ------------------------------------------------------------
-- Qualification (phase 5) — historique des analyses et bilan du jour
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wa_conversation_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  analyzed_message_id TEXT,
  model TEXT NOT NULL,
  -- Réponse du modèle APRÈS validation stricte
  result JSONB NOT NULL,
  -- Stade : avis du modèle, stade déduit des faits, stade retenu
  model_stage TEXT,
  fact_stage TEXT,
  final_stage TEXT,
  intent_score INTEGER CHECK (intent_score IS NULL OR intent_score BETWEEN 0 AND 100),
  input_tokens INTEGER,
  output_tokens INTEGER,
  -- Coût de l'appel (NULL si inconnu, jamais 0 par défaut)
  cost_amount NUMERIC(12, 6),
  cost_currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_conversation_analyses_conv_idx
  ON public.wa_conversation_analyses (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wa_conversation_analyses_day_idx
  ON public.wa_conversation_analyses (created_at);

CREATE TABLE IF NOT EXISTS public.wa_daily_reports (
  day DATE PRIMARY KEY,
  report JSONB NOT NULL,
  cost_amount NUMERIC(12, 6),
  cost_currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RLS : activée partout, aucune policy → service_role uniquement
-- ------------------------------------------------------------
ALTER TABLE public.wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_daily_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.wa_conversations FROM anon, authenticated;
REVOKE ALL ON public.wa_messages FROM anon, authenticated;
REVOKE ALL ON public.wa_settings FROM anon, authenticated;
REVOKE ALL ON public.wa_conversation_analyses FROM anon, authenticated;
REVOKE ALL ON public.wa_daily_reports FROM anon, authenticated;
