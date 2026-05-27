-- ════════════════════════════════════════════
-- AUDIT LOGS — Evolya
-- Colle ce SQL dans Supabase → SQL Editor
-- ════════════════════════════════════════════

-- 1. Table audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  coach_email  TEXT,
  table_name   TEXT        NOT NULL,
  operation    TEXT        NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  record_id    UUID,
  record_data  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_coach_id    ON public.audit_logs(coach_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_name  ON public.audit_logs(table_name);

-- RLS : désactivé (table admin uniquement, jamais exposée aux clients)
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Fonction trigger générique
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_id    UUID;
  v_coach_email TEXT;
  v_record_id   UUID;
  v_record_data JSONB;
BEGIN
  -- Récupérer le coach connecté (si auth disponible)
  BEGIN
    v_coach_id := auth.uid();
    SELECT email INTO v_coach_email
    FROM auth.users WHERE id = v_coach_id;
  EXCEPTION WHEN OTHERS THEN
    v_coach_id    := NULL;
    v_coach_email := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_record_id   := OLD.id;
    v_record_data := to_jsonb(OLD);
  ELSE
    v_record_id   := NEW.id;
    v_record_data := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (
    coach_id, coach_email, table_name, operation, record_id, record_data
  ) VALUES (
    v_coach_id, v_coach_email, TG_TABLE_NAME, TG_OP, v_record_id, v_record_data
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Triggers sur les tables clés
DROP TRIGGER IF EXISTS audit_clients    ON public.clients;
DROP TRIGGER IF EXISTS audit_objectives ON public.objectives;
DROP TRIGGER IF EXISTS audit_sessions   ON public.sessions;

CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_objectives
  AFTER INSERT OR UPDATE OR DELETE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
