-- Répare deux éléments manquants en production :
--  1) sessions.attendance (présence) — utilisé par /api/sessions/attendance
--     et par l'alerte d'inactivité basée sur les présences.
--  2) daily_completions — cochages quotidiens des habitudes (/api/daily-completion).

-- 1) Colonne attendance sur sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS attendance text
  CHECK (attendance IN ('attended', 'missed'));

-- 2) Table daily_completions
CREATE TABLE IF NOT EXISTS public.daily_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, objective_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_completions_client_date
  ON public.daily_completions(client_id, completed_date);

ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique daily_completions" ON public.daily_completions;
CREATE POLICY "Lecture publique daily_completions"
  ON public.daily_completions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert publique daily_completions" ON public.daily_completions;
CREATE POLICY "Insert publique daily_completions"
  ON public.daily_completions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Delete publique daily_completions" ON public.daily_completions;
CREATE POLICY "Delete publique daily_completions"
  ON public.daily_completions FOR DELETE USING (true);
