-- Add configurable inactivity threshold to coach profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS inactivity_threshold_days integer DEFAULT 7 NOT NULL;
