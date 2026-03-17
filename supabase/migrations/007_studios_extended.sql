-- Migration 007: Extender tabla studios con campos para el dashboard del productor
-- Ejecutar en: Supabase Dashboard > SQL Editor

alter table studios
  add column if not exists address        text,
  add column if not exists city           text,
  add column if not exists country        text default 'España',
  add column if not exists postal_code    text,
  add column if not exists lat            double precision,
  add column if not exists lng            double precision,
  add column if not exists description    text,
  add column if not exists photos         text[] default '{}',
  add column if not exists equipment_tags text[] default '{}',
  add column if not exists is_published   boolean not null default false,
  add column if not exists updated_at     timestamptz default now();

-- Trigger: actualiza updated_at en cada UPDATE
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists studios_updated_at on studios;
create trigger studios_updated_at
  before update on studios
  for each row execute function set_updated_at();

-- Los estudios con is_published=true son los que aparecen en Radar (BookStudio)
-- Los existentes se mantienen ocultos por defecto hasta que el productor los active
