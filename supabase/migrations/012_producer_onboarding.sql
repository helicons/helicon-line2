-- 1. Hacer user_id nullable: el productor se pre-registra sin cuenta Google todavía.
--    Cuando haga su primer login, ProtectedRoute vincula el user_id automáticamente.
alter table producers alter column user_id drop not null;

-- 2. Añadir columna iban a producers (si no existe)
alter table producers add column if not exists iban text;

-- 3. Unique constraint en email para poder hacer upsert
alter table producers drop constraint if exists producers_email_unique;
alter table producers add constraint producers_email_unique unique (email);

-- 3. Tabla de tokens de onboarding
create table if not exists producer_onboarding_tokens (
  id         uuid primary key default gen_random_uuid(),
  token      uuid unique not null default gen_random_uuid(),
  used       boolean not null default false,
  expires_at timestamptz not null default (now() + interval '1 day'),
  created_at timestamptz default now()
);

-- Solo service_role accede a esta tabla directamente
alter table producer_onboarding_tokens enable row level security;
create policy "no_direct_access" on producer_onboarding_tokens for all using (false);

-- 4. Función RPC segura: valida el token y guarda los datos en producers
--    SECURITY DEFINER → corre con permisos de superusuario, el anon nunca toca las tablas
create or replace function submit_producer_onboarding(
  p_token uuid,
  p_name  text,
  p_email text,
  p_iban  text
)
returns json
language plpgsql
security definer
as $$
declare
  v_token_id uuid;
begin
  -- Validar token: existe, no usado, no caducado
  select id into v_token_id
  from producer_onboarding_tokens
  where token      = p_token
    and used       = false
    and expires_at > now();

  if v_token_id is null then
    return json_build_object('error', 'El enlace no es válido o ha caducado.');
  end if;

  -- Marcar como usado inmediatamente (evita doble envío)
  update producer_onboarding_tokens set used = true where id = v_token_id;

  -- Insertar o actualizar el productor por email
  insert into producers (name, email, iban)
  values (p_name, p_email, p_iban)
  on conflict (email) do update
    set name = excluded.name,
        iban = excluded.iban;

  return json_build_object('success', true);
end;
$$;

-- Permitir que el rol anon llame a esta función
grant execute on function submit_producer_onboarding(uuid, text, text, text) to anon;


-- =============================================================================
-- PARA GENERAR TOKENS DESDE EL DASHBOARD DE SUPABASE:
-- Pega este SQL en el SQL Editor y cambia el número (5) por los que necesites.
-- Te devuelve los links listos para copiar y mandar.
-- =============================================================================
--
with inserted as (
  insert into producer_onboarding_tokens (token, expires_at)
  select gen_random_uuid(), now() + interval '1 day'
  from generate_series(1, 5)   -- ← cambia 5 por los que necesites
  returning token, expires_at
)
select
  'https://heliconradar.com/onboarding?token=' || token as link,
  expires_at
from inserted;
--
-- =============================================================================
