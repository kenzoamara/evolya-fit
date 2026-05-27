-- Migration : colonnes de consentement RGPD
-- À exécuter dans Supabase SQL Editor

-- 1. Consentement coach (table profiles)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cgu_accepted_at       TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at   TIMESTAMPTZ DEFAULT NULL;

-- 2. Consentement athlete (table clients)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS privacy_accepted_at   TIMESTAMPTZ DEFAULT NULL;

-- Commentaires
COMMENT ON COLUMN profiles.cgu_accepted_at     IS 'Date et heure d''acceptation des CGU lors de l''inscription';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Date et heure d''acceptation de la politique de confidentialité lors de l''inscription';
COMMENT ON COLUMN clients.privacy_accepted_at  IS 'Date et heure d''acceptation de la politique de confidentialité par l''athlete lors de l''onboarding';
