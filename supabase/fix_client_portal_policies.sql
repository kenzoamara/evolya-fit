-- ============================================================
-- Fix : politiques RLS lectures publiques (espace client)
-- À exécuter dans Supabase → SQL Editor si les objectifs/séances
-- n'apparaissent pas côté client alors qu'ils sont visibles côté coach.
-- ============================================================

-- Lecture publique des objectifs (client sans auth Supabase)
DROP POLICY IF EXISTS "Lecture publique objectives" ON public.objectives;
CREATE POLICY "Lecture publique objectives"
  ON public.objectives FOR SELECT
  USING (true);

-- Lecture publique des séances (client sans auth Supabase)
DROP POLICY IF EXISTS "Lecture publique sessions" ON public.sessions;
CREATE POLICY "Lecture publique sessions"
  ON public.sessions FOR SELECT
  USING (true);

-- Lecture publique des checkins (client sans auth Supabase)
DROP POLICY IF EXISTS "Insertion publique checkins" ON public.checkins;
CREATE POLICY "Insertion publique checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Coach lit les checkins de ses clients" ON public.checkins;
CREATE POLICY "Lecture publique checkins"
  ON public.checkins FOR SELECT
  USING (true);

-- Accès client via magic_token
DROP POLICY IF EXISTS "Client accède via magic_token" ON public.clients;
CREATE POLICY "Client accède via magic_token"
  ON public.clients FOR SELECT
  USING (true);

-- Lecture publique des daily_completions
ALTER TABLE IF EXISTS public.daily_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique daily_completions" ON public.daily_completions;
CREATE POLICY "Lecture publique daily_completions"
  ON public.daily_completions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert publique daily_completions" ON public.daily_completions;
CREATE POLICY "Insert publique daily_completions"
  ON public.daily_completions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Delete publique daily_completions" ON public.daily_completions;
CREATE POLICY "Delete publique daily_completions"
  ON public.daily_completions FOR DELETE
  USING (true);
