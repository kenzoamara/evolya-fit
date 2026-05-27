-- ============================================================
-- Migration : Nouveautés & Vote
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- Étendre le rôle profiles pour inclure 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('coach', 'client', 'admin'));

-- Ajouter last_visited_roadmap au profil (badge)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_visited_roadmap timestamptz;

-- ============================================================
-- TABLE: roadmap_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('coming_soon', 'in_progress', 'released')),
  title text NOT NULL,
  description text,
  category text,
  released_at date,
  is_published boolean NOT NULL DEFAULT true,
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: suggestions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'planned')),
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: votes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  suggestion_id uuid REFERENCES public.suggestions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT votes_unique_item UNIQUE (coach_id, item_id),
  CONSTRAINT votes_unique_suggestion UNIQUE (coach_id, suggestion_id),
  CONSTRAINT votes_one_target CHECK (
    (item_id IS NOT NULL AND suggestion_id IS NULL) OR
    (item_id IS NULL AND suggestion_id IS NOT NULL)
  )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_roadmap_items_type ON public.roadmap_items(type);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_published ON public.roadmap_items(is_published);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_votes_coach_id ON public.votes(coach_id);
CREATE INDEX IF NOT EXISTS idx_votes_item_id ON public.votes(item_id);
CREATE INDEX IF NOT EXISTS idx_votes_suggestion_id ON public.votes(suggestion_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- roadmap_items : lecture si publié OU admin
DROP POLICY IF EXISTS "Lecture roadmap publié" ON public.roadmap_items;
CREATE POLICY "Lecture roadmap publié" ON public.roadmap_items
  FOR SELECT USING (
    is_published = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin CRUD roadmap" ON public.roadmap_items;
CREATE POLICY "Admin CRUD roadmap" ON public.roadmap_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- suggestions : coach insert / lecture si approved ou planned ou proprio ou admin
DROP POLICY IF EXISTS "Coach insère suggestion" ON public.suggestions;
CREATE POLICY "Coach insère suggestion" ON public.suggestions
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Lecture suggestions visibles" ON public.suggestions;
CREATE POLICY "Lecture suggestions visibles" ON public.suggestions
  FOR SELECT USING (
    status IN ('approved', 'planned')
    OR coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin modère suggestions" ON public.suggestions;
CREATE POLICY "Admin modère suggestions" ON public.suggestions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- votes : coach insert / lecture publique
DROP POLICY IF EXISTS "Coach vote" ON public.votes;
CREATE POLICY "Coach vote" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Lecture votes" ON public.votes;
CREATE POLICY "Lecture votes" ON public.votes
  FOR SELECT USING (true);

-- ============================================================
-- Mettre un compte en admin (remplace l'email)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'ton@email.com';
-- ============================================================
