ALTER TABLE staff_profile DROP CONSTRAINT IF EXISTS staff_profile_job_check;
ALTER TABLE staff_profile ADD CONSTRAINT staff_profile_job_check
    CHECK (job IN ('INFIRMIER', 'AIDE_SOIGNANT', 'SERVICE', 'CUISINE'));

CREATE TABLE IF NOT EXISTS kitchen_plate (
    meal_id bigint PRIMARY KEY REFERENCES meal(id) ON DELETE CASCADE,
    risk_version varchar(64) NOT NULL,
    corrected boolean NOT NULL DEFAULT false,
    checked_by bigint REFERENCES users(id) ON DELETE SET NULL,
    checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weekly_menu ADD COLUMN IF NOT EXISTS published_at timestamptz;
