-- Migration : ajout colonne author_role sur client_notes
-- À exécuter dans Supabase → SQL Editor

ALTER TABLE public.client_notes
ADD COLUMN IF NOT EXISTS author_role TEXT NOT NULL DEFAULT 'client'
CHECK (author_role IN ('client', 'coach'));

-- Index pour filtrer rapidement par auteur
CREATE INDEX IF NOT EXISTS idx_client_notes_author_role ON public.client_notes(author_role);
