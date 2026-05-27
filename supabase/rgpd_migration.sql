-- ═══════════════════════════════════════════════════════════════════════════
-- RGPD — Migration de conformité
-- À exécuter manuellement dans l'éditeur SQL Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Consentement marketing (Art. 7 RGPD)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_consent_at  TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.marketing_consent    IS 'Consentement explicite aux communications marketing (Art. 7 RGPD)';
COMMENT ON COLUMN public.profiles.marketing_consent_at IS 'Date du consentement marketing (horodatage pour preuve)';

-- 2. Politique de rétention — stripe_events
-- Règle légale : 6 ans (obligations comptables, Art. L123-22 Code de Commerce)
-- Purge automatique des événements de plus de 6 ans
CREATE OR REPLACE FUNCTION public.purge_stripe_events_older_than_6_years()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.stripe_events
  WHERE created_at < NOW() - INTERVAL '6 years';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 3. Politique de rétention — audit_logs
-- Conformément à notre politique de confidentialité : 13 mois
CREATE OR REPLACE FUNCTION public.purge_audit_logs_older_than_13_months()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '13 months';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 4. Vue pour les stats de rétention (admin)
CREATE OR REPLACE VIEW public.data_retention_stats AS
SELECT
  'stripe_events'  AS table_name,
  COUNT(*)         AS total_rows,
  MIN(created_at)  AS oldest_record,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '6 years')   AS rows_due_for_purge
FROM public.stripe_events
UNION ALL
SELECT
  'audit_logs',
  COUNT(*),
  MIN(created_at),
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '13 months')
FROM public.audit_logs;

-- Note : pour automatiser la purge via pg_cron (si activé sur votre Supabase) :
-- SELECT cron.schedule('purge-retention', '0 3 1 * *', $$SELECT public.purge_stripe_events_older_than_6_years(); SELECT public.purge_audit_logs_older_than_13_months();$$);
