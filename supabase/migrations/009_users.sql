create table users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  name text,
  email text,
  created_at timestamptz default now()
);
