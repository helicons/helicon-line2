-- Perfil público del productor
alter table producers add column if not exists avatar_url text;
alter table producers add column if not exists bio text;

-- Lectura pública de producers (para la página de perfil)
create policy "producers_public_read" on producers
  for select using (true);
