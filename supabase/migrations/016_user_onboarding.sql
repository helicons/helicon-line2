alter table users
  add column if not exists artist_name text,
  add column if not exists instagram   text,
  add column if not exists spotify     text,
  add column if not exists youtube     text;
