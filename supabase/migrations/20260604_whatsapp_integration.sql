-- WhatsApp integration fields on profiles (per coach)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_session_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT NULL;

-- WhatsApp phone number on clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT NULL;

-- Track if a message was sent/received via WhatsApp
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS via_whatsapp BOOLEAN DEFAULT FALSE;
