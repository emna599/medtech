-- =====================================================
-- MedTech - données de démonstration FICTIVES
-- Chambres + résidents inventés, pour tester l'interface administrateur.
-- À exécuter dans la base "medtech" (Query Tool de pgAdmin), après medtech_schema.sql.
-- Aucune donnée réelle : ne jamais mettre de vraies personnes ici (dépôt public).
-- =====================================================

INSERT INTO room (number, floor, capacity) VALUES
    ('101', 1, 1),
    ('102', 1, 2),
    ('103', 1, 2),
    ('201', 2, 1),
    ('202', 2, 2),
    ('203', 2, 2)
ON CONFLICT (number) DO NOTHING;

-- Les résidents ne sont ajoutés que si la table est vide (évite les doublons si on relance le script).
INSERT INTO resident (first_name, last_name, birth_date, admission_date, active, room_id)
SELECT v.first_name, v.last_name, v.birth_date::date, v.admission_date::date, v.active,
       (SELECT id FROM room WHERE number = v.room_number)
FROM (VALUES
    ('Marie',   'Exemple',  '1940-03-12', '2023-02-01', TRUE,  '101'),
    ('Jean',    'Modele',   '1938-07-25', '2022-09-15', TRUE,  '102'),
    ('Odette',  'Fictive',  '1942-11-02', '2024-01-10', TRUE,  '102'),
    ('Paul',    'Demo',     '1936-05-30', '2021-06-20', TRUE,  '103'),
    ('Yvonne',  'Test',     '1945-01-18', '2025-03-05', TRUE,  '201'),
    ('Lucien',  'Imaginaire','1939-09-09', '2023-11-22', TRUE,  '202'),
    ('Simone',  'Inventee', '1941-04-14', '2026-10-01', TRUE,  NULL),
    ('Henri',   'Ancien',   '1934-12-01', '2020-05-11', FALSE, NULL)
) AS v(first_name, last_name, birth_date, admission_date, active, room_number)
WHERE NOT EXISTS (SELECT 1 FROM resident);
