-- ============================================================
-- Migration : Suggestions V2 — dislike, commentaires, statuts étendus
-- À exécuter dans le SQL Editor Supabase
-- ============================================================

-- 1. Étendre le statut des suggestions
ALTER TABLE public.suggestions DROP CONSTRAINT IF EXISTS suggestions_status_check;
ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'planned', 'in_progress', 'delivered'));

-- 2. Nouvelles colonnes sur suggestions
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- 3. vote_type sur la table votes
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS vote_type TEXT NOT NULL DEFAULT 'up'
  CHECK (vote_type IN ('up', 'down'));

-- 4. Table suggestion_comments
CREATE TABLE IF NOT EXISTS public.suggestion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestion_comments_suggestion
  ON public.suggestion_comments(suggestion_id, created_at);

-- 5. RLS suggestion_comments
ALTER TABLE public.suggestion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach commente suggestion" ON public.suggestion_comments;
CREATE POLICY "Coach commente suggestion" ON public.suggestion_comments
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Lecture commentaires" ON public.suggestion_comments;
CREATE POLICY "Lecture commentaires" ON public.suggestion_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Suppression propre commentaire" ON public.suggestion_comments;
CREATE POLICY "Suppression propre commentaire" ON public.suggestion_comments
  FOR DELETE USING (
    auth.uid() = coach_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Mettre à jour la RLS suggestions : toutes les suggestions non-pending/rejected visibles par les coachs
DROP POLICY IF EXISTS "Lecture suggestions visibles" ON public.suggestions;
CREATE POLICY "Lecture suggestions visibles" ON public.suggestions
  FOR SELECT USING (
    status NOT IN ('pending', 'rejected')
    OR coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Mettre à jour le trigger vote_count pour gérer vote_type
CREATE OR REPLACE FUNCTION public.update_vote_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.item_id IS NOT NULL THEN
      UPDATE public.roadmap_items SET vote_count = vote_count + 1 WHERE id = NEW.item_id;
    END IF;
    IF NEW.suggestion_id IS NOT NULL THEN
      IF COALESCE(NEW.vote_type, 'up') = 'down' THEN
        UPDATE public.suggestions SET dislike_count = dislike_count + 1 WHERE id = NEW.suggestion_id;
      ELSE
        UPDATE public.suggestions SET vote_count = vote_count + 1 WHERE id = NEW.suggestion_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.item_id IS NOT NULL THEN
      UPDATE public.roadmap_items SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.item_id;
    END IF;
    IF OLD.suggestion_id IS NOT NULL THEN
      IF COALESCE(OLD.vote_type, 'up') = 'down' THEN
        UPDATE public.suggestions SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = OLD.suggestion_id;
      ELSE
        UPDATE public.suggestions SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.suggestion_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger comment_count
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suggestions SET comment_count = comment_count + 1 WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.suggestions SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_suggestion_comment_change ON public.suggestion_comments;
CREATE TRIGGER on_suggestion_comment_change
  AFTER INSERT OR DELETE ON public.suggestion_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();
