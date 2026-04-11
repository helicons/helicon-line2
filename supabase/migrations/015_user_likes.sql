create table if not exists user_likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  beat_id    uuid not null references beats(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, beat_id)
);

alter table user_likes enable row level security;

create policy "user_likes_select" on user_likes
  for select using (auth.uid() = user_id);

create policy "user_likes_insert" on user_likes
  for insert with check (auth.uid() = user_id);

create policy "user_likes_delete" on user_likes
  for delete using (auth.uid() = user_id);
