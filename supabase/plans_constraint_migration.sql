-- Migration : étendre les contraintes CHECK pour tous les plans

-- 1. Plan : ajouter growth, pro, scale, elite, unlimited, free
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('trial', 'free', 'starter', 'growth', 'pro', 'scale', 'elite', 'unlimited', 'standard'));

-- 2. Plan status : ajouter 'trial'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_status_check
  CHECK (plan_status IN ('active', 'trial', 'cancelled', 'past_due'));
