-- Condiciones personalizadas por licencia, por beat.
-- Estructura: { basic: { tag, features[] }, premium: { tag, features[] }, exclusive: { tag, features[] } }
-- Si es null, el frontend usa las condiciones por defecto.
alter table beats add column if not exists license_conditions jsonb default null;
