-- Migration 005: Tabla de reservas
-- Ejecutar en: Supabase Dashboard > SQL Editor

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete restrict not null,
  client_email text not null,
  client_name text not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  stripe_session_id text,
  amount_paid numeric(10,2),
  created_at timestamptz default now()
);

create index if not exists bookings_space_status_idx on bookings(space_id, status);
create index if not exists bookings_start_idx on bookings(start_datetime);
create index if not exists bookings_stripe_session_idx on bookings(stripe_session_id);

alter table bookings enable row level security;

-- Productores ven todas las reservas de sus espacios
create policy "bookings_producer_read" on bookings
  for select using (
    space_id in (
      select s.id from spaces s
      join studios st on st.id = s.studio_id
      join producers p on p.id = st.producer_id
      where p.user_id = auth.uid()
    )
  );

-- Las inserciones/actualizaciones las hacen las Edge Functions con service_role (bypass RLS)
