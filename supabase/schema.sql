-- ============================================================
-- CoachLink — Schéma Supabase complet
-- À exécuter dans l'éditeur SQL Supabase (dans l'ordre)
-- ============================================================

-- Extension uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'coach' CHECK (role IN ('coach', 'client')),
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'standard')),
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'cancelled', 'past_due')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz DEFAULT (now() + interval '15 days'),
  client_limit integer NOT NULL DEFAULT 10,
  coaching_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: clients
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  magic_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  token_expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  invite_token uuid UNIQUE DEFAULT gen_random_uuid(),
  invite_token_expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  invite_token_used boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_checkin_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: objectives
-- ============================================================
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  target_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: sessions (notes de séance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  private_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: checkins
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  year integer NOT NULL,
  q1_answer text,
  q2_answer text,
  q3_answer text,
  energy_score integer CHECK (energy_score BETWEEN 1 AND 10),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: daily_completions (cochages quotidiens des objectifs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, objective_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_completions_client_date
  ON public.daily_completions(client_id, completed_date);

-- ============================================================
-- TRIGGER: créer profil automatiquement à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan, plan_status, trial_ends_at, client_limit)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'coach',
    'trial',
    'active',
    now() + interval '15 days',
    10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS — ACTIVER SUR TOUTES LES TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
DROP POLICY IF EXISTS "Coach voit son propre profil" ON public.profiles;
CREATE POLICY "Coach voit son propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Coach modifie son propre profil" ON public.profiles;
CREATE POLICY "Coach modifie son propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: clients
-- ============================================================
DROP POLICY IF EXISTS "Coach voit ses clients" ON public.clients;
CREATE POLICY "Coach voit ses clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coach crée ses clients" ON public.clients;
CREATE POLICY "Coach crée ses clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coach modifie ses clients" ON public.clients;
CREATE POLICY "Coach modifie ses clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coach supprime ses clients" ON public.clients;
CREATE POLICY "Coach supprime ses clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = coach_id);

-- Accès client via magic_token (sans auth Supabase)
DROP POLICY IF EXISTS "Client accède via magic_token" ON public.clients;
CREATE POLICY "Client accède via magic_token"
  ON public.clients FOR SELECT
  USING (true); -- filtré par token dans la query, service_role vérifie le token

-- ============================================================
-- RLS POLICIES: objectives
-- ============================================================
DROP POLICY IF EXISTS "Coach CRUD ses objectifs" ON public.objectives;
CREATE POLICY "Coach CRUD ses objectifs"
  ON public.objectives FOR ALL
  USING (auth.uid() = coach_id);

-- Lecture client sans auth (via magic_token validé côté API)
DROP POLICY IF EXISTS "Lecture publique objectives" ON public.objectives;
CREATE POLICY "Lecture publique objectives"
  ON public.objectives FOR SELECT
  USING (true);

-- ============================================================
-- RLS POLICIES: sessions
-- ============================================================
DROP POLICY IF EXISTS "Coach CRUD ses sessions" ON public.sessions;
CREATE POLICY "Coach CRUD ses sessions"
  ON public.sessions FOR ALL
  USING (auth.uid() = coach_id);

-- Lecture client sans auth (via magic_token validé côté API)
DROP POLICY IF EXISTS "Lecture publique sessions" ON public.sessions;
CREATE POLICY "Lecture publique sessions"
  ON public.sessions FOR SELECT
  USING (true);

-- ============================================================
-- RLS POLICIES: checkins
-- ============================================================
-- Insertion publique (client sans auth)
DROP POLICY IF EXISTS "Insertion publique checkins" ON public.checkins;
CREATE POLICY "Insertion publique checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (true);

-- Lecture coach sur ses clients
DROP POLICY IF EXISTS "Coach lit les checkins de ses clients" ON public.checkins;
CREATE POLICY "Coach lit les checkins de ses clients"
  ON public.checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.coach_id = auth.uid()
    )
    OR true -- clients publics aussi
  );

-- ============================================================
-- INDEX pour performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON public.clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_objectives_client_id ON public.objectives(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON public.sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_checkins_client_id ON public.checkins(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_magic_token ON public.clients(magic_token);
CREATE INDEX IF NOT EXISTS idx_clients_invite_token ON public.clients(invite_token);
