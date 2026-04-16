alter table producers
  add column if not exists allows_tagging boolean not null default false;
