-- Notes rapides client
-- À lancer dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS client_notes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_private  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_created_at ON client_notes(created_at DESC);

-- RLS désactivé : accès via service_role uniquement (magic token vérifié côté API)
ALTER TABLE client_notes DISABLE ROW LEVEL SECURITY;
