-- Ajout des colonnes de suivi d'usage mensuel IA
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_exercises_used  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_programmes_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_reset_month  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_reset_year   integer NOT NULL DEFAULT 0;
