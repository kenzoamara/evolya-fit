-- ============================================================
-- pg_cron : jobs automatiques Evolya
-- À exécuter dans l'éditeur SQL Supabase
-- Remplacer YOUR_PROJECT_REF et YOUR_SERVICE_ROLE_KEY
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── 1. Check-ins hebdomadaires (chaque lundi 08:00 Paris = 07:00 UTC) ──────────
SELECT cron.schedule(
  'send-weekly-checkins',
  '0 7 * * 1',
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-checkins',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- ── 2. Rappels inactivité (toutes les 6 heures) ────────────────────────────────
SELECT cron.schedule(
  'send-inactivity-reminders',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-inactivity-reminders',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- ── 3. Rappels séries d'échecs (chaque jour à 21:00 UTC = 22h/23h Paris) ───────
SELECT cron.schedule(
  'send-streak-reminders',
  '0 21 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-streak-reminders',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- ── 4. Rappels quotidiens objectifs (chaque jour à 17:00 UTC = 18h/19h Paris) ──
SELECT cron.schedule(
  'send-daily-reminders',
  '0 17 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reminders',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
