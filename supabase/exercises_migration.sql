-- ============================================================
-- EXERCISES MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = exercice global pré-rempli
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('force', 'cardio', 'mobilite', 'hiit', 'stretching')),
  muscle_group TEXT NOT NULL, -- muscle principal
  muscles      TEXT[] NOT NULL DEFAULT '{}', -- muscles secondaires
  equipment    TEXT NOT NULL DEFAULT 'aucun',
  difficulty   TEXT NOT NULL DEFAULT 'intermediaire' CHECK (difficulty IN ('debutant', 'intermediaire', 'avance')),
  instructions TEXT NOT NULL,
  youtube_url  TEXT, -- optionnel, rempli par le coach
  is_global    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercises_coach_id_idx    ON exercises(coach_id);
CREATE INDEX IF NOT EXISTS exercises_category_idx    ON exercises(category);
CREATE INDEX IF NOT EXISTS exercises_muscle_idx      ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS exercises_is_global_idx   ON exercises(is_global);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Le coach voit les exercices globaux ET les siens
CREATE POLICY "coaches_see_exercises" ON exercises
  FOR SELECT USING (is_global = true OR coach_id = auth.uid());

-- Le coach ne peut créer/modifier/supprimer que ses propres exercices
CREATE POLICY "coaches_manage_own_exercises" ON exercises
  FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "coaches_update_own_exercises" ON exercises
  FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "coaches_delete_own_exercises" ON exercises
  FOR DELETE USING (coach_id = auth.uid());
