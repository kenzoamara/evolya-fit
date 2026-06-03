CREATE TABLE IF NOT EXISTS public.google_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id)
);
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_own_tokens" ON public.google_tokens;
CREATE POLICY "coach_own_tokens" ON public.google_tokens
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
