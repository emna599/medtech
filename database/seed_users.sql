-- =====================================================
-- MedTech - comptes de DÉMONSTRATION (fictifs)
-- À exécuter dans pgAdmin (Query Tool) sur la base "medtech",
-- APRÈS medtech_schema.sql.
-- Mot de passe des 3 comptes : Demo1234!
-- À supprimer ou changer avant toute utilisation réelle.
-- =====================================================
INSERT INTO users (username, password_hash, full_name, role) VALUES
    ('admin',     '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Alex Admin',         'ADMIN'),
    ('personnel', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Sam Soignant',       'PERSONNEL'),
    ('medecin',   '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Dr Camille Médecin', 'MEDECIN')
ON CONFLICT (username) DO NOTHING;
