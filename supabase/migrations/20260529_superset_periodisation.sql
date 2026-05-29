-- Supersets : chaîner des exercices dans une même séance
ALTER TABLE programme_day_exercises
  ADD COLUMN IF NOT EXISTS superset_group TEXT DEFAULT NULL;

-- Périodisation : organiser les jours par phase/bloc
ALTER TABLE programme_days
  ADD COLUMN IF NOT EXISTS phase INT NOT NULL DEFAULT 1;

-- Indices pour requêtes filtrées par phase ou superset
CREATE INDEX IF NOT EXISTS programme_days_phase_idx
  ON programme_days (programme_id, phase);
