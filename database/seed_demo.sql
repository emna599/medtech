-- =====================================================
-- MedTech - données de démonstration FICTIVES (chambres + résidents)
-- 16 chambres sur 3 étages (27 lits) et 24 résidents inventés.
-- À exécuter après medtech_schema.sql et seed_users.sql (setup.sql le fait pour toi).
-- Aucune donnée réelle : ne jamais mettre de vraies personnes ici (dépôt public).
-- Numérotation des chambres : étage suivi de deux chiffres (étage 2 : 201 à 299).
-- =====================================================

INSERT INTO room (number, floor, capacity) VALUES
    ('101', 1, 1), ('102', 1, 2), ('103', 1, 2), ('104', 1, 1), ('105', 1, 2), ('106', 1, 2),
    ('201', 2, 1), ('202', 2, 2), ('203', 2, 2), ('204', 2, 1), ('205', 2, 2), ('206', 2, 2),
    ('301', 3, 1), ('302', 3, 2), ('303', 3, 2), ('304', 3, 2)
ON CONFLICT (number) DO NOTHING;

-- Les résidents ne sont ajoutés que si la table est vide (évite les doublons si on relance le script).
INSERT INTO resident (first_name, last_name, birth_date, admission_date, active, room_id)
SELECT v.first_name, v.last_name, v.birth_date::date, v.admission_date::date, v.active,
       (SELECT id FROM room WHERE number = v.room_number)
FROM (VALUES
    -- Étage 1
    ('Marie',     'Exemple',      '1940-03-12', '2023-02-01', TRUE,  '101'),
    ('Jean',      'Modele',       '1938-07-25', '2022-09-15', TRUE,  '102'),
    ('Odette',    'Fictive',      '1942-11-02', '2024-01-10', TRUE,  '102'),
    ('Paul',      'Demo',         '1936-05-30', '2021-06-20', TRUE,  '103'),
    ('Gaston',    'Maquette',     '1937-02-08', '2022-04-12', TRUE,  '103'),
    ('Rose',      'Prototype',    '1943-06-21', '2024-08-30', TRUE,  '104'),
    ('Albert',    'Scenario',     '1938-10-15', '2023-05-09', TRUE,  '105'),
    ('Lucette',   'Simulation',   '1944-03-03', '2025-01-20', TRUE,  '105'),
    ('Raymond',   'Echantillon',  '1935-12-24', '2021-11-02', TRUE,  '106'),
    -- Étage 2
    ('Yvonne',    'Test',         '1945-01-18', '2025-03-05', TRUE,  '201'),
    ('Lucien',    'Imaginaire',   '1939-09-09', '2023-11-22', TRUE,  '202'),
    ('Madeleine', 'Fantaisie',    '1946-08-17', '2025-06-14', TRUE,  '202'),
    ('Fernand',   'Hypothese',    '1940-01-29', '2023-09-18', TRUE,  '203'),
    ('Colette',   'Illustre',     '1941-05-05', '2022-12-07', TRUE,  '203'),
    ('Berthe',    'Canevas',      '1937-09-27', '2024-03-25', TRUE,  '204'),
    ('Marcel',    'Pilote',       '1939-04-04', '2023-07-11', TRUE,  '205'),
    -- Étage 3
    ('Georgette', 'Brouillon',    '1944-11-19', '2025-09-02', TRUE,  '301'),
    ('Armand',    'Essai',        '1936-07-07', '2021-02-14', TRUE,  '302'),
    ('Suzanne',   'Croquis',      '1942-02-26', '2024-10-08', TRUE,  '302'),
    ('Lucienne',  'Esquisse',     '1945-12-12', '2025-11-03', TRUE,  '303'),
    -- Actifs sans chambre (à placer) : s'affichent en rouge dans l'interface admin
    ('Simone',    'Inventee',     '1941-04-14', '2026-10-01', TRUE,  NULL),
    ('Jeanne',    'Attente',      '1943-01-30', '2026-11-20', TRUE,  NULL),
    -- Résidents inactifs (sortis)
    ('Henri',     'Ancien',       '1934-12-01', '2020-05-11', FALSE, NULL),
    ('Roger',     'Parti',        '1933-03-03', '2019-09-09', FALSE, NULL)
) AS v(first_name, last_name, birth_date, admission_date, active, room_number)
WHERE NOT EXISTS (SELECT 1 FROM resident);
