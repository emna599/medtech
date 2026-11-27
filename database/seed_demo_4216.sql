-- Données fictives de la démo 4216. Ne pas importer dans une base d’établissement.
BEGIN;
\ir seed_staff_assignments.sql

INSERT INTO staff_rfid_badge (user_id, token_hash)
SELECT u.id, encode(sha256(convert_to(b.code, 'UTF8')), 'hex')
FROM (VALUES
    ('personnel2', 'AIDE_SOIGNANT', 'BADGE-DEMO-AIDE'),
    ('personnel3', 'INFIRMIER', 'BADGE-DEMO-INFIRMIER'),
    ('service1', 'SERVICE', 'BADGE-DEMO-SERVICE')
) AS b(username, job, code)
JOIN users u ON u.username = b.username AND u.role = 'PERSONNEL' AND u.enabled
JOIN staff_profile p ON p.user_id = u.id AND p.job = b.job
ON CONFLICT DO NOTHING;
COMMIT;
