-- Migration 021: Stripe Connect para pagos automáticos a productores

alter table producers
  add column if not exists stripe_account_id     text,
  add column if not exists stripe_connect_status text not null default 'not_connected';
  -- valores: 'not_connected' | 'pending' | 'active'

alter table bookings
  add column if not exists payout_transferred_at timestamptz,
  add column if not exists payout_transfer_id    text;

alter table sales
  add column if not exists payout_transferred_at timestamptz,
  add column if not exists payout_transfer_id    text;
