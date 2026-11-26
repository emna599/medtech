-- =====================================================
-- MedTech - données de DÉMONSTRATION (100 % fictives) pour l'espace PERSONNEL
-- À exécuter dans pgAdmin (Query Tool) sur la base "medtech",
-- APRÈS medtech_schema.sql, seed_users.sql et personnel_additions.sql.
-- Relançable : supprime d'abord les résidents de démo (identity_code 'DEMO-001' à 'DEMO-012')
-- et recrée les repas et prises pour AUJOURD'HUI.
-- =====================================================

-- ---------- Deuxième compte soignant (pour tester la confirmation d'un doute par un AUTRE soignant) ----------
-- Mot de passe : Demo1234!  (même hash que dans seed_users.sql)
INSERT INTO users (username, password_hash, full_name, role) VALUES
    ('personnel2', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Léa Infirmière', 'PERSONNEL')
ON CONFLICT (username) DO NOTHING;

-- Nettoyage des anciennes données de démo (les tables liées suivent par ON DELETE CASCADE)
DELETE FROM resident WHERE identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$';

-- ---------- Chambres ----------
INSERT INTO room (number, floor, capacity) VALUES
    ('103', 1, 1), ('107', 1, 1), ('108', 1, 1), ('109', 1, 1), ('110', 1, 1), ('111', 1, 1), ('112', 1, 1),
    ('214', 2, 1), ('215', 2, 1), ('216', 2, 1), ('217', 2, 1), ('221', 2, 1)
ON CONFLICT (number) DO NOTHING;

-- ---------- Résidents (noms inventés ; photo_url vide = avatar avec initiales) ----------
INSERT INTO resident (first_name, last_name, birth_date, admission_date, active, room_id,
                      meal_location, needs_help, distinguishing_features, identity_code)
SELECT v.first_name, v.last_name, v.birth_date::date, v.admission_date::date, TRUE, r.id,
       v.meal_location, v.needs_help, v.features, v.code
FROM (VALUES
    ('Jeanne',  'Martin',   '1938-04-12', '2022-03-01', '112', 'CHAMBRE', TRUE,  'Cheveux blancs courts, lunettes',       'DEMO-001'),
    ('Michel',  'Durand',   '1941-09-03', '2023-01-15', '107',  'SALLE',   FALSE, 'Moustache grise, déambulateur',        'DEMO-002'),
    ('Odette',  'Petit',    '1936-01-25', '2021-11-20', '103',  'CHAMBRE', TRUE,  'Châle bleu, appareil auditif',         'DEMO-003'),
    ('Paul',    'Bernard',  '1939-11-30', '2024-02-05', '215', 'CHAMBRE', FALSE, 'Grand, cheveux blancs, canne',         'DEMO-004'),
    ('Simone',  'Leroy',    '1940-06-18', '2022-09-12', '108',  'SALLE',   FALSE, 'Cheveux gris bouclés, collier perles', 'DEMO-005'),
    ('Henri',   'Moreau',   '1937-12-08', '2020-05-30', '214', 'SALLE',   FALSE, 'Chauve, lunettes rondes, fauteuil',    'DEMO-006'),
    ('Colette', 'Simon',    '1942-02-14', '2023-06-18', '221', 'SALLE',   TRUE,  'Cheveux roux clairs, fauteuil',        'DEMO-007'),
    ('Marcel',  'Laurent',  '1935-07-27', '2019-10-02', '109',  'SALLE',   FALSE, 'Béret, moustache blanche',             'DEMO-008'),
    ('Rosa',    'Garcia',   '1943-03-09', '2024-04-22', '110', 'SALLE',   FALSE, 'Cheveux noirs attachés, lunettes',     'DEMO-009'),
    ('Lucien',  'Roux',     '1938-10-21', '2022-12-07', '111', 'SALLE',   TRUE,  'Barbe blanche, cardigan vert',         'DEMO-010'),
    ('Yvette',  'Fournier', '1941-05-16', '2023-09-29', '216', 'SALLE',   FALSE, 'Cheveux blancs longs, canne',          'DEMO-011'),
    ('André',   'Girard',   '1940-08-04', '2021-07-13', '217', 'SALLE',   FALSE, 'Chauve, grosses lunettes',             'DEMO-012')
) AS v(first_name, last_name, birth_date, admission_date, room_number, meal_location, needs_help, features, code)
JOIN room r ON r.number = v.room_number;

-- ---------- Allergies ----------
INSERT INTO allergy (name, severity, resident_id)
SELECT a.name, a.severity, r.id
FROM (VALUES
    ('DEMO-001', 'Poisson',       'Grave'),
    ('DEMO-003', 'Pénicilline',   'Modérée'),
    ('DEMO-004', 'Fruits de mer', 'Grave'),
    ('DEMO-010', 'Arachides',     'Grave'),
    ('DEMO-007', 'Lactose',       'Légère')
) AS a(code, name, severity)
JOIN resident r ON r.identity_code = a.code;

-- ---------- Régimes et textures ----------
INSERT INTO dietary_regime (type, texture, restrictions, instructions, resident_id)
SELECT g.type, g.texture, g.restrictions, g.instructions, r.id
FROM (VALUES
    ('DEMO-001', 'Sans sel',            'Mixée',   'Sel, poisson',        'Aide au repas nécessaire'),
    ('DEMO-002', 'Diabétique',          'Normale', 'Sucres rapides',      'Dessert sans sucre'),
    ('DEMO-003', 'Sans sel',            'Hachée',  'Sel',                 'Aide au repas, petites bouchées'),
    ('DEMO-004', 'Normal',              'Normale', 'Fruits de mer',       NULL),
    ('DEMO-005', 'Sans sel',            'Normale', 'Sel',                 NULL),
    ('DEMO-006', 'Diabétique, sans sel','Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-007', 'Normal',              'Mixée',   'Lactose',             'Boisson épaissie'),
    ('DEMO-008', 'Normal',              'Normale', NULL,                  NULL),
    ('DEMO-009', 'Végétarien',          'Normale', 'Viande, poisson',     NULL),
    ('DEMO-010', 'Normal',              'Hachée',  'Arachides',           'Aide au repas nécessaire'),
    ('DEMO-011', 'Sans sel',            'Normale', 'Sel',                 NULL),
    ('DEMO-012', 'Diabétique',          'Normale', 'Sucres rapides',      'Dessert sans sucre')
) AS g(code, type, texture, restrictions, instructions)
JOIN resident r ON r.identity_code = g.code;

-- ---------- Repas du jour : déjeuner 12h et dîner 19h ----------
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT 'DEJEUNER',
       CASE d.texture
            WHEN 'Mixée'  THEN 'Volaille et purée de légumes mixées, compote'
            WHEN 'Hachée' THEN 'Poulet haché, haricots verts, yaourt'
            ELSE               'Poulet rôti, haricots verts, fruit de saison'
       END || CASE WHEN d.type ILIKE '%diab%' THEN ' (dessert sans sucre)' ELSE '' END,
       CURRENT_DATE + TIME '12:00', 'A_FAIRE', r.id
FROM resident r JOIN dietary_regime d ON d.resident_id = r.id
WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$';

INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT 'DINER',
       CASE d.texture
            WHEN 'Mixée'  THEN 'Soupe de légumes mixée, flan'
            WHEN 'Hachée' THEN 'Omelette hachée, purée, fromage blanc'
            ELSE               'Soupe, omelette, salade, fromage blanc'
       END || CASE WHEN d.type ILIKE '%diab%' THEN ' (sans sucre)' ELSE '' END,
       CURRENT_DATE + TIME '19:00', 'A_FAIRE', r.id
FROM resident r JOIN dietary_regime d ON d.resident_id = r.id
WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$';

-- ---------- Prises de médicaments du jour (médicaments courants, doses fictives) ----------
INSERT INTO medication_dose (medication, dose, scheduled_at, high_risk, status, resident_id)
SELECT m.medication, m.dose, CURRENT_DATE + m.at_time::time, m.high_risk, 'A_FAIRE', r.id
FROM (VALUES
    ('DEMO-001', 'Lévothyroxine',  '75 µg',    '08:00', FALSE),
    ('DEMO-002', 'Metformine',     '1000 mg',  '08:00', FALSE),
    ('DEMO-002', 'Gliclazide',     '30 mg',    '12:00', TRUE),
    ('DEMO-003', 'Paracétamol',    '1000 mg',  '08:00', FALSE),
    ('DEMO-003', 'Paracétamol',    '1000 mg',  '18:00', FALSE),
    ('DEMO-004', 'Simvastatine',   '40 mg',    '18:00', FALSE),
    ('DEMO-005', 'Tramadol',       '37,5 mg',  '08:00', TRUE),
    ('DEMO-006', 'Metformine',     '1000 mg',  '08:00', FALSE),
    ('DEMO-006', 'Gliclazide',     '30 mg',    '12:00', TRUE),
    ('DEMO-007', 'Lévothyroxine',  '75 µg',    '08:00', FALSE),
    ('DEMO-012', 'Metformine',     '1000 mg',  '12:00', FALSE),
    ('DEMO-012', 'Ézétimibe',      '10 mg',    '18:00', FALSE)
) AS m(code, medication, dose, at_time, high_risk)
JOIN resident r ON r.identity_code = m.code;

-- ---------- QR codes de démonstration (table qr_code de l'équipe) : jeton « QR-DEMO-001 »... ----------
INSERT INTO qr_code (token, active, resident_id, user_id)
SELECT 'QR-' || r.identity_code, TRUE, r.id, (SELECT id FROM users WHERE username = 'admin')
FROM resident r
WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$';

-- ---------- Historique des 6 jours précédents (tendance d'appétit) ----------
-- Martin (DEMO-001) et Petit (DEMO-003) mangent de moins en moins depuis 3 jours.
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT t.type, 'Repas (historique)', (CURRENT_DATE - d.n) + t.at_time, 'FAIT', r.id
FROM resident r
CROSS JOIN generate_series(1, 6) AS d(n)
CROSS JOIN (VALUES ('DEJEUNER', TIME '12:00'), ('DINER', TIME '19:00')) AS t(type, at_time)
WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$';

INSERT INTO meal_distribution (served_at, quantity_eaten, meal_id, user_id)
SELECT m.scheduled_at + INTERVAL '40 minutes',
       CASE
         WHEN r.identity_code IN ('DEMO-001', 'DEMO-003') AND m.scheduled_at >= CURRENT_DATE - 3
              THEN (ARRAY['RIEN', 'QUART', 'QUART', 'MOITIE'])[1 + (m.id % 4)::int]
         ELSE (ARRAY['TOUT', 'TROIS_QUARTS', 'TOUT', 'MOITIE', 'TOUT'])[1 + (m.id % 5)::int]
       END,
       m.id,
       (SELECT id FROM users WHERE username = 'personnel')
FROM meal m JOIN resident r ON r.id = m.resident_id
WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$' AND m.scheduled_at < CURRENT_DATE;

-- Vérification rapide
SELECT (SELECT COUNT(*) FROM resident WHERE identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$') AS residents,
       (SELECT COUNT(*) FROM meal) AS repas,
       (SELECT COUNT(*) FROM medication_dose) AS prises;
