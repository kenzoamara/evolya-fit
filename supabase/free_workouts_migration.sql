-- Allow free-form workouts (client can log without a coach programme)
-- Allow personal client-created habits

-- 1. Make assignment_id nullable in workout_logs (currently NOT NULL)
ALTER TABLE workout_logs ALTER COLUMN assignment_id DROP NOT NULL;

-- 2. Add exercise_name directly on exercise_logs for free-form sessions
--    (programme-based sessions resolve the name from the FK join)
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- 3. Add notes to workout_logs (used as free-form session label)
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Allow client-created personal habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'coach'
  CHECK (source IN ('coach', 'client'));
