-- Supprime les IDs Stripe de test pour tous les profils coach
-- A executer UNE SEULE FOIS avant le lancement en live
UPDATE profiles
SET
  stripe_customer_id     = NULL,
  stripe_subscription_id = NULL
WHERE role = 'coach';
