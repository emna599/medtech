CREATE TABLE IF NOT EXISTS staff_rfid_badge (
    user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token_hash varchar(64) NOT NULL UNIQUE,
    assigned_at timestamptz NOT NULL DEFAULT now()
);
