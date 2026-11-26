-- Reçu d’une validation par utilisateur. La signature évite de conserver le texte du motif.
CREATE TABLE IF NOT EXISTS care_completion_receipt (
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id uuid NOT NULL,
    fingerprint char(64) NOT NULL,
    PRIMARY KEY (user_id, request_id)
);
