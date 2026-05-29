-- ════════════════════════════════════════════════════════════════
-- Lien d'invitation partageable + demandes reçues
-- Un client arrive en statut 'pending' via le lien public du coach
-- (/rejoindre/[coachId]). Le coach valide ou refuse depuis "Mes membres".
-- L'insertion se fait côté serveur via le service_role (API /api/join/request).
-- ════════════════════════════════════════════════════════════════

-- Autoriser le statut 'pending' sur les clients
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('active', 'inactive', 'pending'));
