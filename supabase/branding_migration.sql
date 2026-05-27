-- Branding coach : couleurs, police, icone
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_color_primary text,
  ADD COLUMN IF NOT EXISTS brand_color_accent  text,
  ADD COLUMN IF NOT EXISTS brand_font          text,
  ADD COLUMN IF NOT EXISTS brand_icon          text;
