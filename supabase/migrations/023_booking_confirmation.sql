-- Migration 023: Booking confirmation flow
-- Adds payment_method, client_phone, new statuses

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'card'
    CHECK (payment_method IN ('card', 'cash')),
  ADD COLUMN IF NOT EXISTS client_phone text;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'pending_review', 'rejected'));

CREATE INDEX IF NOT EXISTS bookings_pending_review_idx
  ON bookings(space_id, status) WHERE status = 'pending_review';

-- pg_cron: cancel pending bookings where client never paid within 48h
-- pending_review is intentionally excluded (no time limit — producer must act)
SELECT cron.unschedule('expire-pending-bookings');
SELECT cron.schedule('expire-pending-bookings', '*/5 * * * *', $$
  UPDATE bookings SET status = 'cancelled'
  WHERE status = 'pending'
    AND stripe_session_id IS NOT NULL
    AND created_at < now() - interval '48 hours'
$$);
