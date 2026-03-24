-- Migration 006: Función atómica para crear reservas sin race conditions
-- + pg_cron para expirar reservas pendientes
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- REQUISITO: activar extensión pg_cron en Dashboard > Database > Extensions

-- Función atómica: bloquea el espacio con FOR UPDATE antes de insertar
create or replace function create_booking_atomic(
  p_space_id uuid,
  p_client_name text,
  p_client_email text,
  p_start_datetime timestamptz,
  p_end_datetime timestamptz
) returns uuid
language plpgsql
security definer
as $$
declare
  v_conflicts integer;
  v_booking_id uuid;
begin
  -- Bloquear la fila del espacio para evitar reservas simultáneas
  perform id from spaces where id = p_space_id for update;

  -- Verificar conflictos con bookings existentes (pending o confirmed)
  select count(*) into v_conflicts
  from bookings
  where space_id = p_space_id
    and status in ('pending', 'confirmed')
    and tstzrange(start_datetime, end_datetime, '[)') &&
        tstzrange(p_start_datetime, p_end_datetime, '[)');

  if v_conflicts > 0 then
    raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end if;

  -- Insertar la reserva en estado pending
  insert into bookings (
    space_id, client_name, client_email,
    start_datetime, end_datetime, status
  )
  values (
    p_space_id, p_client_name, p_client_email,
    p_start_datetime, p_end_datetime, 'pending'
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- pg_cron: cancelar reservas pending que llevan más de 15 minutos sin pago
-- (Asegúrate de que pg_cron está activado antes de ejecutar esto)
select cron.schedule(
  'expire-pending-bookings',
  '*/5 * * * *',
  $$
    update bookings
    set status = 'cancelled'
    where status = 'pending'
      and created_at < now() - interval '15 minutes'
  $$
);
