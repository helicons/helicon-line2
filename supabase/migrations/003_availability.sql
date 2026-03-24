-- Migration 003: Tabla de disponibilidad semanal por espacio
-- day_of_week: 0=domingo, 1=lunes, ..., 6=sábado (Date.getDay() en JS)
-- Ejecutar en: Supabase Dashboard > SQL Editor

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  unique(space_id, day_of_week)
);

alter table availability enable row level security;

-- Productores gestionan la disponibilidad de sus espacios
create policy "availability_via_producer" on availability
  for all using (
    space_id in (
      select s.id from spaces s
      join studios st on st.id = s.studio_id
      join producers p on p.id = st.producer_id
      where p.user_id = auth.uid()
    )
  );

-- Lectura pública para calcular slots disponibles
create policy "availability_public_read" on availability
  for select using (true);
