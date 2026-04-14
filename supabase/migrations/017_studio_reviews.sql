create table studio_reviews (
  id         uuid primary key default gen_random_uuid(),
  studio_id  uuid not null references studios(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz default now()
);

-- Una reseña por usuario por estudio
create unique index studio_reviews_unique_idx on studio_reviews(studio_id, user_id);

alter table studio_reviews enable row level security;

-- Cualquiera puede leer
create policy "reviews_select" on studio_reviews
  for select using (true);

-- Solo puede insertar quien tiene reserva confirmada y ya finalizada en ese estudio
create policy "reviews_insert" on studio_reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from bookings b
      join spaces s on s.id = b.space_id
      where b.client_email = auth.email()
        and s.studio_id    = studio_id
        and b.status       = 'confirmed'
        and b.end_datetime < now()
    )
  );

-- Solo el autor puede borrar su propia reseña
create policy "reviews_delete" on studio_reviews
  for delete using (auth.uid() = user_id);
