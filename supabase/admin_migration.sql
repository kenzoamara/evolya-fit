-- ============================================================
-- Migration : Espace Admin Complet
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- Colonnes manquantes sur profiles (referral + last_seen)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- TABLE: notifications (in-app)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target text NOT NULL DEFAULT 'all', -- 'all' | plan name | coach_id
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, coach_id)
);

-- ============================================================
-- TABLE: email_scheduled
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_scheduled (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  recipients jsonb NOT NULL DEFAULT '{"type":"all"}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'scheduled')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: support_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_coach ON public.support_tickets(coach_id);

-- ============================================================
-- TABLE: support_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('coach', 'admin')),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_scheduled ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- audit_logs : admin only
DROP POLICY IF EXISTS "Admin lit les logs" ON public.audit_logs;
CREATE POLICY "Admin lit les logs" ON public.audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin insère logs" ON public.audit_logs;
CREATE POLICY "Admin insère logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- notifications : lecture coach si target le concerne
DROP POLICY IF EXISTS "Coach lit ses notifications" ON public.notifications;
CREATE POLICY "Coach lit ses notifications" ON public.notifications
  FOR SELECT USING (
    target = 'all'
    OR target = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND plan::text = target)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin CRUD notifications" ON public.notifications;
CREATE POLICY "Admin CRUD notifications" ON public.notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- notification_reads
DROP POLICY IF EXISTS "Coach marque lu" ON public.notification_reads;
CREATE POLICY "Coach marque lu" ON public.notification_reads
  FOR ALL USING (auth.uid() = coach_id);

-- email_scheduled : admin only
DROP POLICY IF EXISTS "Admin emails" ON public.email_scheduled;
CREATE POLICY "Admin emails" ON public.email_scheduled
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- support_tickets : coach voit les siens, admin voit tout
DROP POLICY IF EXISTS "Coach voit ses tickets" ON public.support_tickets;
CREATE POLICY "Coach voit ses tickets" ON public.support_tickets
  FOR SELECT USING (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Coach crée ticket" ON public.support_tickets;
CREATE POLICY "Coach crée ticket" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Admin modère tickets" ON public.support_tickets;
CREATE POLICY "Admin modère tickets" ON public.support_tickets
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- support_messages
DROP POLICY IF EXISTS "Lecture messages ticket" ON public.support_messages;
CREATE POLICY "Lecture messages ticket" ON public.support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')))
  );

DROP POLICY IF EXISTS "Insert message" ON public.support_messages;
CREATE POLICY "Insert message" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
