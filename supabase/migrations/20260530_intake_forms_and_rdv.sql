-- ════════════════════════════════════════════════════════════════
-- Formulaires d'accueil (intake) + Prise de RDV
-- ════════════════════════════════════════════════════════════════

-- 1. Formulaires créés par le coach
CREATE TABLE IF NOT EXISTS public.intake_forms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT 'Formulaire d''accueil',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Questions du formulaire
CREATE TABLE IF NOT EXISTS public.intake_questions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id   uuid NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  question  text NOT NULL,
  type      text NOT NULL DEFAULT 'text'
            CHECK (type IN ('text','textarea','yesno','scale','choice')),
  options   text[],        -- pour type 'choice'
  required  boolean NOT NULL DEFAULT false,
  position  integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intake_questions_form ON public.intake_questions(form_id);

-- 3. Réponses des clients
CREATE TABLE IF NOT EXISTS public.intake_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  form_id      uuid NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  answers      jsonb NOT NULL DEFAULT '{}',  -- { [question_id]: answer }
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, form_id)
);
CREATE INDEX IF NOT EXISTS idx_intake_responses_client ON public.intake_responses(client_id);

-- 4. Disponibilités récurrentes du coach
CREATE TABLE IF NOT EXISTS public.coach_availabilities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week           integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Lun, 6=Dim
  start_time            text NOT NULL,  -- 'HH:MM'
  end_time              text NOT NULL,  -- 'HH:MM'
  slot_duration_minutes integer NOT NULL DEFAULT 60,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_availabilities_coach ON public.coach_availabilities(coach_id);

-- 5. Demandes de séance par les clients
CREATE TABLE IF NOT EXISTS public.session_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_date   text NOT NULL,   -- 'YYYY-MM-DD'
  requested_time   text NOT NULL,   -- 'HH:MM'
  duration_minutes integer NOT NULL DEFAULT 60,
  note             text,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','declined')),
  session_id       uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_requests_coach  ON public.session_requests(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_client ON public.session_requests(client_id);

-- RLS
ALTER TABLE public.intake_forms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_requests   ENABLE ROW LEVEL SECURITY;

-- Formulaires : coach gère les siens
DROP POLICY IF EXISTS "coach_manage_intake_forms" ON public.intake_forms;
CREATE POLICY "coach_manage_intake_forms" ON public.intake_forms
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- Questions : coach gère les siennes (via form)
DROP POLICY IF EXISTS "coach_manage_intake_questions" ON public.intake_questions;
CREATE POLICY "coach_manage_intake_questions" ON public.intake_questions
  FOR ALL USING (
    form_id IN (SELECT id FROM public.intake_forms WHERE coach_id = auth.uid())
  );

-- Réponses : coach lit celles de ses clients
DROP POLICY IF EXISTS "coach_read_intake_responses" ON public.intake_responses;
CREATE POLICY "coach_read_intake_responses" ON public.intake_responses
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.intake_forms WHERE coach_id = auth.uid())
  );

-- Disponibilités : coach gère les siennes
DROP POLICY IF EXISTS "coach_manage_availabilities" ON public.coach_availabilities;
CREATE POLICY "coach_manage_availabilities" ON public.coach_availabilities
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- Demandes RDV : coach gère les siennes
DROP POLICY IF EXISTS "coach_manage_requests" ON public.session_requests;
CREATE POLICY "coach_manage_requests" ON public.session_requests
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
