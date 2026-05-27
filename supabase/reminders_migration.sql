-- ============================================================
-- CoachLink — Migration : système de rappels automatiques
-- ============================================================

-- 1. Jours de repos du client (convention JS : 0=Dim, 1=Lun, ..., 6=Sam)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS rest_days integer[] NOT NULL DEFAULT '{}';

-- 2. Logs de tous les rappels envoyés (email + in-app)
--    Utilisé pour le cooldown et le tracking
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('inactivity', 'streak_fail', 'daily')),
  channel    text        NOT NULL CHECK (channel IN ('email', 'in_app')),
  sent_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_client
  ON public.reminder_logs(client_id, type, sent_at DESC);

-- 3. Rappels in-app en attente (affichés dans le dashboard client)
CREATE TABLE IF NOT EXISTS public.client_reminders (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type         text        NOT NULL CHECK (type IN ('inactivity', 'streak_fail', 'daily')),
  title        text        NOT NULL,
  message      text        NOT NULL,
  dismissed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_reminders_pending
  ON public.client_reminders(client_id, dismissed_at)
  WHERE dismissed_at IS NULL;

-- 4. RLS : service_role (cron) + lecture publique (client sans auth)
ALTER TABLE public.reminder_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminder_logs open"    ON public.reminder_logs;
DROP POLICY IF EXISTS "client_reminders open" ON public.client_reminders;

CREATE POLICY "reminder_logs open"
  ON public.reminder_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "client_reminders open"
  ON public.client_reminders FOR ALL USING (true) WITH CHECK (true);
