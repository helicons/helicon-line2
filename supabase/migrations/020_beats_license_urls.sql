alter table beats
  add column if not exists price_stems  numeric(10,2),
  add column if not exists url_basic    text,
  add column if not exists url_premium  text,
  add column if not exists url_exclusive text,
  add column if not exists url_stems    text;
