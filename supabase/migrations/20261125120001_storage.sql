-- Public-read photo bucket. A public bucket allows GET without a session.
-- It does not allow anonymous uploads. There is no insert, update, or delete
-- policy, so anon and authenticated cannot write. The app uploads with the
-- service role, which bypasses storage RLS.
-- Replaced photos are left in the bucket so a history restore can show them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-photos',
  'recipe-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists recipe_photos_public_read on storage.objects;

create policy recipe_photos_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'recipe-photos');
