-- La tabla sales ya existe; añadir columna faltante y configurar RLS

-- Columna que usa el webhook de Stripe al insertar
alter table sales
  add column if not exists stripe_session_id text;

-- RLS (puede que ya esté habilitado; el IF EXISTS evita error)
alter table sales enable row level security;

-- El productor dueño del beat puede ver sus ventas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'sales'
      and policyname = 'sales_producer_select'
  ) then
    execute $policy$
      create policy "sales_producer_select" on sales
        for select using (
          exists (
            select 1 from beats b
            join producers p on p.id = b.producer_id
            where b.id      = sales.beat_id
              and p.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end
$$;
