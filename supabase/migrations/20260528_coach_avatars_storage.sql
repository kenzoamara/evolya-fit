-- Bucket Supabase Storage pour les photos de profil des coaches
-- À exécuter dans Supabase SQL Editor

-- 1. Créer le bucket (public = les URLs sont accessibles sans auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-avatars',
  'coach-avatars',
  true,
  3145728,  -- 3 Mo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. Politique : un coach peut uploader uniquement dans son propre dossier (son profile id)
create policy "Coach upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coach-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Politique : un coach peut remplacer sa propre photo
create policy "Coach update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'coach-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Politique : lecture publique (le bucket est public donc les URLs fonctionnent sans auth)
create policy "Public read avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'coach-avatars');

-- 5. Politique : suppression par le propriétaire
create policy "Coach delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'coach-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
