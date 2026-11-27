CREATE TABLE IF NOT EXISTS staff_assignment (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    floor integer NOT NULL,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    created_by bigint REFERENCES users(id) ON DELETE SET NULL,
    revoked_at timestamptz,
    revoked_by bigint REFERENCES users(id) ON DELETE SET NULL,
    CHECK (starts_at < ends_at)
);

CREATE INDEX IF NOT EXISTS staff_assignment_active_idx
    ON staff_assignment (user_id, starts_at, ends_at) WHERE revoked_at IS NULL;

-- Les affectations historiques étaient immédiatement actives.
ALTER TABLE staff_assignment ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT now();
ALTER TABLE staff_assignment ADD COLUMN IF NOT EXISTS published_by bigint REFERENCES users(id) ON DELETE SET NULL;
