-- ============================================================
-- PROGRAMME BUILDER MIGRATION
-- Run this in Supabase SQL Editor after programmes_v2_migration.sql
-- ============================================================

-- 1. Days template for a programme (day 1, day 2, ...)
CREATE TABLE IF NOT EXISTS programme_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id    UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  day_number      INTEGER NOT NULL,
  title           TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS programme_days_programme_id_idx ON programme_days(programme_id);

-- 2. Exercises within a day
CREATE TABLE IF NOT EXISTS programme_day_exercises (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_day_id    UUID NOT NULL REFERENCES programme_days(id) ON DELETE CASCADE,
  exercise_id         UUID REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name       TEXT NOT NULL,
  sets                INTEGER,
  reps                INTEGER,
  weight_kg           NUMERIC,
  duration_seconds    INTEGER,
  rest_seconds        INTEGER,
  notes               TEXT,
  position            INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS programme_day_exercises_day_id_idx ON programme_day_exercises(programme_day_id);

-- 3. Per-client assignment with a start date
CREATE TABLE IF NOT EXISTS programme_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id    UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id        UUID NOT NULL,
  start_date      DATE NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS programme_assignments_client_id_idx ON programme_assignments(client_id);
CREATE INDEX IF NOT EXISTS programme_assignments_coach_id_idx  ON programme_assignments(coach_id);

-- 4. Client workout log per day completed
CREATE TABLE IF NOT EXISTS workout_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID NOT NULL REFERENCES programme_assignments(id) ON DELETE CASCADE,
  programme_day_id    UUID REFERENCES programme_days(id) ON DELETE SET NULL,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL,
  completed           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, log_date)
);
CREATE INDEX IF NOT EXISTS workout_logs_client_id_idx ON workout_logs(client_id);
CREATE INDEX IF NOT EXISTS workout_logs_assignment_id_idx ON workout_logs(assignment_id);

-- 5. Per-exercise logs within a workout
CREATE TABLE IF NOT EXISTS exercise_logs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id              UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  programme_day_exercise_id   UUID REFERENCES programme_day_exercises(id) ON DELETE SET NULL,
  set_number                  INTEGER,
  reps_done                   INTEGER,
  weight_kg                   NUMERIC,
  duration_seconds            INTEGER,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exercise_logs_workout_log_id_idx ON exercise_logs(workout_log_id);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE programme_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_manage_days" ON programme_days;
CREATE POLICY "coach_manage_days" ON programme_days FOR ALL
  USING  (EXISTS (SELECT 1 FROM programmes WHERE id = programme_id AND coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM programmes WHERE id = programme_id AND coach_id = auth.uid()));

ALTER TABLE programme_day_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_manage_day_exercises" ON programme_day_exercises;
CREATE POLICY "coach_manage_day_exercises" ON programme_day_exercises FOR ALL
  USING  (EXISTS (SELECT 1 FROM programme_days pd JOIN programmes p ON p.id = pd.programme_id WHERE pd.id = programme_day_id AND p.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM programme_days pd JOIN programmes p ON p.id = pd.programme_id WHERE pd.id = programme_day_id AND p.coach_id = auth.uid()));

ALTER TABLE programme_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_manage_assignments" ON programme_assignments;
CREATE POLICY "coach_manage_assignments" ON programme_assignments FOR ALL
  USING  (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Clients can read their own assignments
DROP POLICY IF EXISTS "client_read_assignments" ON programme_assignments;
CREATE POLICY "client_read_assignments" ON programme_assignments FOR SELECT
  USING (true);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_manage_workout_logs" ON workout_logs;
CREATE POLICY "client_manage_workout_logs" ON workout_logs FOR ALL
  USING  (true)
  WITH CHECK (true);

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_manage_exercise_logs" ON exercise_logs;
CREATE POLICY "client_manage_exercise_logs" ON exercise_logs FOR ALL
  USING  (true)
  WITH CHECK (true);
