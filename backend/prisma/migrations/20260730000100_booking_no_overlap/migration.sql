-- Concurrency guard: prevent two *approved* bookings for the same space from
-- overlapping in time. A GiST exclusion constraint enforces this at the database
-- level, so even simultaneous approvals cannot both commit — one transaction
-- fails with SQLSTATE 23P01. Pending requests are intentionally allowed to
-- overlap (the admin approves one, which auto-rejects the rest).
--
-- Uses a half-open interval [startTime, endTime): back-to-back bookings
-- (endTime of one == startTime of the next) do NOT count as overlapping.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "spaceId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE (status = 'approved');
