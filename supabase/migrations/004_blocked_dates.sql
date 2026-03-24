-- Migration 004: Fechas bloqueadas (vacaciones, mantenimiento, etc.)
-- Ejecutar en: Supabase Dashboard > SQL Editor

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  date date not null,
  reason text,
  created_at timestamptz default now(),
  unique(space_id, date)
);

alter table blocked_dates enable row level security;

-- Productores gestionan sus fechas bloqueadas
create policy "blocked_dates_via_producer" on blocked_dates
  for all using (
    space_id in (
      select s.id from spaces s
      join studios st on st.id = s.studio_id
      join producers p on p.id = st.producer_id
      where p.user_id = auth.uid()
    )
  );

-- Lectura pública para excluirlas del cálculo de slots
create policy "blocked_dates_public_read" on blocked_dates
  for select using (true);
