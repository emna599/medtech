DO $migration$
BEGIN
    PERFORM pg_advisory_xact_lock(184933014);
    ALTER TABLE handover_action ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES users(id);
    ALTER TABLE handover_action ADD COLUMN IF NOT EXISTS assignment_version BIGINT NOT NULL DEFAULT 0;
END;
$migration$;
