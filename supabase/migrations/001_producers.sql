-- Migration 001: Tabla de productores y columna producer_id en studios
-- Ejecutar en: Supabase Dashboard > SQL Editor

create table if not exists producers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Añadir columna producer_id a studios (si no existe)
alter table studios add column if not exists producer_id uuid references producers(id) on delete set null;

-- RLS
alter table producers enable row level security;

create policy "producers_own_row" on producers
  for all using (auth.uid() = user_id);

-- Productores solo pueden ver/modificar sus propios estudios
create policy "producers_own_studios" on studios
  for all using (
    producer_id in (select id from producers where user_id = auth.uid())
  );

-- Lectura pública de studios (para el flujo de reserva del cliente)
create policy "studios_public_read" on studios
  for select using (true);
