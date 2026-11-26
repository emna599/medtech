-- Évolution idempotente, réutilisable sur une base existante.
DO $migration$
BEGIN
    PERFORM pg_advisory_xact_lock(184933011);
    CREATE TABLE IF NOT EXISTS auth_session (
        id UUID PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_session_user ON auth_session(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_session_expiry ON auth_session(expires_at);

    CREATE TABLE IF NOT EXISTS login_throttle (
        scope VARCHAR(8) NOT NULL,
        bucket_key VARCHAR(128) NOT NULL,
        window_end TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL,
        PRIMARY KEY (scope, bucket_key)
    );
    CREATE INDEX IF NOT EXISTS idx_login_throttle_expiry ON login_throttle(window_end);

    ALTER TABLE allergy ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE dietary_regime ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS meal_instruction_change (
        resident_id BIGINT PRIMARY KEY REFERENCES resident(id) ON DELETE CASCADE,
        changed_at TIMESTAMPTZ NOT NULL
    );
END;
$migration$;
