-- Migration 024: Update create_booking_atomic to support new flow
-- New status: pending_review (awaiting producer acceptance)
-- New params: p_payment_method, p_client_phone
-- Conflict check includes pending_review

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_space_id       uuid,
  p_client_name    text,
  p_client_email   text,
  p_start_datetime timestamptz,
  p_end_datetime   timestamptz,
  p_payment_method text DEFAULT 'card',
  p_client_phone   text DEFAULT null
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflicts integer;
  v_booking_id uuid;
BEGIN
  PERFORM id FROM spaces WHERE id = p_space_id FOR UPDATE;

  SELECT count(*) INTO v_conflicts
  FROM bookings
  WHERE space_id = p_space_id
    AND status IN ('pending', 'confirmed', 'pending_review')
    AND tstzrange(start_datetime, end_datetime, '[)') &&
        tstzrange(p_start_datetime, p_end_datetime, '[)');

  IF v_conflicts > 0 THEN
    RAISE EXCEPTION 'SLOT_TAKEN' USING errcode = 'P0001';
  END IF;

  INSERT INTO bookings (
    space_id, client_name, client_email,
    start_datetime, end_datetime, status,
    payment_method, client_phone
  )
  VALUES (
    p_space_id, p_client_name, p_client_email,
    p_start_datetime, p_end_datetime, 'pending_review',
    p_payment_method, p_client_phone
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;
