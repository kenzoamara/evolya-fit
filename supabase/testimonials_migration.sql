-- Testimonials table
-- Coaches submit via the app; admin approves before display on landing

CREATE TABLE IF NOT EXISTS testimonials (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_name     TEXT        NOT NULL,
  coaching_type  TEXT,
  content        TEXT        NOT NULL CHECK (char_length(content) BETWEEN 20 AND 600),
  rating         INTEGER     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_approved    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_featured    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id)
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved testimonials (landing page)
CREATE POLICY "public_read_approved" ON testimonials
  FOR SELECT USING (is_approved = TRUE);

-- A coach can insert their own testimonial (one per coach via UNIQUE)
CREATE POLICY "coach_insert_own" ON testimonials
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- A coach can read their own (to show "en attente" state in settings)
CREATE POLICY "coach_read_own" ON testimonials
  FOR SELECT USING (auth.uid() = coach_id);
