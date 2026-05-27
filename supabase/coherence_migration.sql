-- ============================================================
-- Evolya — Migration cohérence & temps réel
-- À exécuter dans le SQL Editor Supabase
-- ============================================================

-- ============================================================
-- TABLE: stripe_events (source de vérité MRR)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 0, -- en centimes
  currency text NOT NULL DEFAULT 'eur',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin voit stripe_events" ON public.stripe_events;
CREATE POLICY "Admin voit stripe_events"
  ON public.stripe_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_coach_id ON public.stripe_events(coach_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON public.stripe_events(created_at);

-- ============================================================
-- TRIGGER 1 — vote_count automatique
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_vote_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.item_id IS NOT NULL THEN
      UPDATE public.roadmap_items
      SET vote_count = vote_count + 1
      WHERE id = NEW.item_id;
    END IF;
    IF NEW.suggestion_id IS NOT NULL THEN
      UPDATE public.suggestions
      SET vote_count = vote_count + 1
      WHERE id = NEW.suggestion_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.item_id IS NOT NULL THEN
      UPDATE public.roadmap_items
      SET vote_count = GREATEST(0, vote_count - 1)
      WHERE id = OLD.item_id;
    END IF;
    IF OLD.suggestion_id IS NOT NULL THEN
      UPDATE public.suggestions
      SET vote_count = GREATEST(0, vote_count - 1)
      WHERE id = OLD.suggestion_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_counts();

-- ============================================================
-- TRIGGER 2 — updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER 3 — audit_log automatique sur profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_audit_profile_changes()
RETURNS trigger AS $$
DECLARE
  v_action text;
BEGIN
  -- Ne loguer que les changements significatifs
  IF (OLD.plan IS NOT DISTINCT FROM NEW.plan
    AND OLD.suspended IS NOT DISTINCT FROM NEW.suspended
    AND OLD.plan_status IS NOT DISTINCT FROM NEW.plan_status) THEN
    RETURN NEW;
  END IF;

  v_action := CASE
    WHEN OLD.suspended = false AND NEW.suspended = true THEN 'coach_suspended'
    WHEN OLD.suspended = true AND NEW.suspended = false THEN 'coach_reactivated'
    WHEN OLD.plan IS DISTINCT FROM NEW.plan THEN 'plan_changed'
    ELSE 'subscription_status_changed'
  END;

  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, payload)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    v_action,
    'coach',
    NEW.id,
    jsonb_build_object(
      'old', jsonb_build_object('plan', OLD.plan, 'suspended', OLD.suspended, 'plan_status', OLD.plan_status),
      'new', jsonb_build_object('plan', NEW.plan, 'suspended', NEW.suspended, 'plan_status', NEW.plan_status)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_audit_profile ON public.profiles;
CREATE TRIGGER auto_audit_profile
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_profile_changes();

-- ============================================================
-- RLS — Admin voit et modifie tous les profils
-- ============================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Coach voit son propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Coach modifie son propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Admin voit tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Admin modifie tous les profils" ON public.profiles;

-- SELECT : coach voit le sien, admin voit tous
CREATE POLICY "Profiles SELECT"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- UPDATE : coach modifie le sien, admin modifie tous
CREATE POLICY "Profiles UPDATE"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- RLS — audit_logs : append-only, admin uniquement
-- ============================================================
DROP POLICY IF EXISTS "Admin voit audit_logs" ON public.audit_logs;
CREATE POLICY "Admin voit audit_logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Service peut insérer audit_logs" ON public.audit_logs;
CREATE POLICY "Service peut insérer audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- contrôlé par SECURITY DEFINER functions

-- Personne ne peut UPDATE ou DELETE
DROP POLICY IF EXISTS "Pas de DELETE audit_logs" ON public.audit_logs;
-- (pas de policy = interdit par défaut avec RLS activé)

-- ============================================================
-- RLS — notifications : ciblage par plan/id
-- ============================================================
DROP POLICY IF EXISTS "Coach voit ses notifications" ON public.notifications;
CREATE POLICY "Coach voit ses notifications"
  ON public.notifications FOR SELECT
  USING (
    target = 'all'
    OR target = ('plan:' || (SELECT plan FROM public.profiles WHERE id = auth.uid()))
    OR target = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- RLS — roadmap_items : published + admin
-- ============================================================
DROP POLICY IF EXISTS "Coaches voient items publiés" ON public.roadmap_items;
CREATE POLICY "Coaches voient items publiés"
  ON public.roadmap_items FOR SELECT
  USING (
    is_published = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin CRUD roadmap_items" ON public.roadmap_items;
CREATE POLICY "Admin CRUD roadmap_items"
  ON public.roadmap_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS — votes : une seule contrainte unique
-- ============================================================
DROP POLICY IF EXISTS "Coach vote" ON public.votes;
CREATE POLICY "Coaches peuvent voter"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coach voit votes" ON public.votes;
CREATE POLICY "Lecture votes"
  ON public.votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Coach retire son vote" ON public.votes;
CREATE POLICY "Coach retire son vote"
  ON public.votes FOR DELETE
  USING (auth.uid() = coach_id);

-- ============================================================
-- RLS — suggestions
-- ============================================================
DROP POLICY IF EXISTS "Coach voit suggestions approuvées + siennes" ON public.suggestions;
CREATE POLICY "Coach voit suggestions approuvées + siennes"
  ON public.suggestions FOR SELECT
  USING (
    status IN ('approved', 'planned')
    OR coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Coach insère suggestion" ON public.suggestions;
CREATE POLICY "Coach insère suggestion"
  ON public.suggestions FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Admin modifie suggestions" ON public.suggestions;
CREATE POLICY "Admin modifie suggestions"
  ON public.suggestions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS — support_tickets
-- ============================================================
DROP POLICY IF EXISTS "Coach voit ses tickets" ON public.support_tickets;
CREATE POLICY "Support tickets SELECT"
  ON public.support_tickets FOR SELECT
  USING (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Coach crée ticket" ON public.support_tickets;
CREATE POLICY "Coach crée ticket"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Admin modifie tickets" ON public.support_tickets;
CREATE POLICY "Admin modifie tickets"
  ON public.support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS — support_messages
-- ============================================================
DROP POLICY IF EXISTS "Support messages SELECT" ON public.support_messages;
CREATE POLICY "Support messages SELECT"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
      AND (t.coach_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "Support messages INSERT" ON public.support_messages;
CREATE POLICY "Support messages INSERT"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      sender_role = 'admin'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      sender_role = 'coach'
        AND EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND coach_id = auth.uid())
    )
  );

-- ============================================================
-- REALTIME — activer publication sur les tables clés
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_events;

-- ============================================================
-- VIEW: mrr_current (source unique pour MRR)
-- ============================================================
CREATE OR REPLACE VIEW public.mrr_current AS
SELECT
  COALESCE(
    (SELECT SUM(amount) / 100.0
     FROM public.stripe_events
     WHERE type = 'invoice.payment_succeeded'
     AND date_trunc('month', created_at) = date_trunc('month', now())),
    0
  ) AS mrr_from_stripe,
  COALESCE(
    (SELECT SUM(
       CASE plan
         WHEN 'starter' THEN 19
         WHEN 'standard' THEN 49
         ELSE 0
       END)
     FROM public.profiles
     WHERE role = 'coach'
     AND plan_status = 'active'
     AND suspended = false),
    0
  ) AS mrr_from_profiles;
