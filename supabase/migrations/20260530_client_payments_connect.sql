-- ════════════════════════════════════════════════════════════════
-- Encaissement client en ligne — Stripe Connect (Express, charges directes)
-- V1 : packs de séances (paiement unique)
-- L'argent va sur le compte connecté du coach ; il est le marchand officiel.
-- Insertions paiement faites côté serveur (service_role) via webhook/checkout.
-- ════════════════════════════════════════════════════════════════

-- 1. Champs Connect sur le profil coach
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connect_account_id      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connect_charges_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connect_status          text    NOT NULL DEFAULT 'none';
  -- none | pending | active | restricted

-- 2. Offres du coach (packs)
CREATE TABLE IF NOT EXISTS public.payment_offers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           text NOT NULL DEFAULT 'pack' CHECK (type IN ('pack', 'subscription')),
  name           text NOT NULL,
  price_cents    integer NOT NULL CHECK (price_cents > 0),
  currency       text NOT NULL DEFAULT 'eur',
  sessions_count integer,            -- packs
  interval       text,               -- abos (V2) : 'month'
  stripe_price_id text,              -- abos (V2)
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. Crédits / droits achetés par le client
CREATE TABLE IF NOT EXISTS public.client_entitlements (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_id           uuid REFERENCES public.payment_offers(id) ON DELETE SET NULL,
  type               text NOT NULL DEFAULT 'pack',
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'refunded', 'canceled')),
  sessions_remaining integer,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entitlements_client ON public.client_entitlements(client_id);

-- 4. Registre des transactions (vue Business)
CREATE TABLE IF NOT EXISTS public.transactions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id                 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id                uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  offer_id                 uuid REFERENCES public.payment_offers(id) ON DELETE SET NULL,
  amount_cents             integer NOT NULL,
  fee_cents                integer NOT NULL DEFAULT 0,
  currency                 text NOT NULL DEFAULT 'eur',
  type                     text NOT NULL DEFAULT 'pack' CHECK (type IN ('pack', 'subscription', 'manual')),
  status                   text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'failed')),
  stripe_session_id        text UNIQUE,
  stripe_payment_intent_id text,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_coach ON public.transactions(coach_id);

-- 5. RLS — le coach gère/voit ses propres données.
--    Les écritures liées au paiement passent par le service_role (bypass RLS).
ALTER TABLE public.payment_offers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_manage_offers" ON public.payment_offers;
CREATE POLICY "coach_manage_offers" ON public.payment_offers
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "coach_read_entitlements" ON public.client_entitlements;
CREATE POLICY "coach_read_entitlements" ON public.client_entitlements
  FOR SELECT USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "coach_read_transactions" ON public.transactions;
CREATE POLICY "coach_read_transactions" ON public.transactions
  FOR SELECT USING (coach_id = auth.uid());
