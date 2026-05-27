-- ── Bibliothèque Nutrition & Habitudes ──────────────────────────────────────
-- nutrition_items   : modèles nutritionnels (globaux + coach-spécifiques)
-- habit_templates   : modèles d'habitudes   (globaux + coach-spécifiques)
-- Même logique que la table exercises.

-- Modèles nutritionnels
CREATE TABLE IF NOT EXISTS nutrition_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id            UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'conseil'
                      CHECK (category IN ('proteines','glucides','lipides','hydratation','conseil','complements','repas')),
  description         TEXT NOT NULL DEFAULT '',
  calories_total      INTEGER DEFAULT NULL,
  calories_breakdown  JSONB DEFAULT NULL,
  objectif            TEXT DEFAULT NULL
                      CHECK (objectif IS NULL OR objectif IN ('prise de masse','perte de poids','maintien','performance','recomposition corporelle')),
  is_global           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_items_coach_id_idx  ON nutrition_items(coach_id);
CREATE INDEX IF NOT EXISTS nutrition_items_is_global_idx ON nutrition_items(is_global);

ALTER TABLE nutrition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see_nutrition_items"    ON nutrition_items FOR SELECT USING (is_global = true OR coach_id = auth.uid());
CREATE POLICY "insert_nutrition_items" ON nutrition_items FOR INSERT WITH CHECK (coach_id = auth.uid());
CREATE POLICY "delete_nutrition_items" ON nutrition_items FOR DELETE USING (coach_id = auth.uid());

-- Modèles d'habitudes
CREATE TABLE IF NOT EXISTS habit_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '✅',
  category    TEXT NOT NULL DEFAULT 'bien-etre'
              CHECK (category IN ('sport','nutrition','sommeil','bien-etre','mental')),
  description TEXT NOT NULL DEFAULT '',
  objectif    TEXT DEFAULT NULL,
  is_global   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS habit_templates_coach_id_idx  ON habit_templates(coach_id);
CREATE INDEX IF NOT EXISTS habit_templates_is_global_idx ON habit_templates(is_global);

ALTER TABLE habit_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see_habit_templates"    ON habit_templates FOR SELECT USING (is_global = true OR coach_id = auth.uid());
CREATE POLICY "insert_habit_templates" ON habit_templates FOR INSERT WITH CHECK (coach_id = auth.uid());
CREATE POLICY "delete_habit_templates" ON habit_templates FOR DELETE USING (coach_id = auth.uid());
