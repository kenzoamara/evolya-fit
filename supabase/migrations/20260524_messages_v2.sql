-- Messages v2 — nouvelles fonctionnalités
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to_id    UUID        REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactions      JSONB       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS edited_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pinned         BOOLEAN     NOT NULL DEFAULT FALSE;

-- Index full-text sur le contenu des messages (français)
CREATE INDEX IF NOT EXISTS messages_content_fts_idx
  ON messages USING gin(to_tsvector('french', content));

-- Statut en ligne — dernière connexion des athlètes (espace client)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
