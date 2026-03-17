-- Migration 002: Tabla de espacios (salas) dentro de cada estudio
-- Ejecutar en: Supabase Dashboard > SQL Editor

create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid references studios(id) on delete cascade not null,
  name text not null,
  price_per_hour numeric(10,2) not null default 0,
  min_duration_hours integer not null default 1,
  max_duration_hours integer not null default 8,
  description text,
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table spaces enable row level security;

-- Productores gestionan los espacios de sus estudios
create policy "spaces_via_producer" on spaces
  for all using (
    studio_id in (
      select id from studios
      where producer_id in (
        select id from producers where user_id = auth.uid()
      )
    )
  );

-- Lectura pública para el flujo de reserva del cliente
create policy "spaces_public_read" on spaces
  for select using (active = true);
