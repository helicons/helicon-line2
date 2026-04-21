-- Migration 022: Ofertas para licencia Exclusive

create table beat_offers (
  id              uuid primary key default gen_random_uuid(),
  beat_id         uuid not null references beats(id) on delete cascade,
  buyer_user_id   uuid references auth.users(id) on delete set null,
  buyer_email     text not null,
  offer_amount    numeric(10,2) not null check (offer_amount > 0),
  message         text,
  status          text not null default 'pending' check (status in ('pending','accepted','rejected')),
  checkout_url    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table beat_offers enable row level security;

create policy "offers_insert" on beat_offers
  for insert with check (auth.uid() = buyer_user_id);

create policy "offers_select_buyer" on beat_offers
  for select using (auth.uid() = buyer_user_id);

create policy "offers_select_producer" on beat_offers
  for select using (
    exists (
      select 1 from beats b
      join producers p on p.id = b.producer_id
      where b.id = beat_id and p.user_id = auth.uid()
    )
  );

create policy "offers_update_producer" on beat_offers
  for update using (
    exists (
      select 1 from beats b
      join producers p on p.id = b.producer_id
      where b.id = beat_id and p.user_id = auth.uid()
    )
  );
