-- Complément fictif chargé uniquement par l’initialisation de démonstration.
INSERT INTO room (number, floor, capacity) VALUES
    ('301', 3, 3), ('302', 3, 3), ('303', 3, 3), ('304', 3, 3)
ON CONFLICT (number) DO NOTHING;

INSERT INTO resident (first_name, last_name, birth_date, admission_date, active, room_id, meal_location, identity_code)
SELECT v.first_name, v.last_name, v.birth_date::date, v.admission_date::date, v.active,
       room.id, v.meal_location, 'DEMO-ADMIN-' || v.code
FROM (VALUES
    ('01', 'Marie', 'Exemple', '1940-03-12', '2023-02-01', TRUE, '301', 'SALLE'),
    ('02', 'Jean', 'Modele', '1938-07-25', '2022-09-15', TRUE, '301', 'SALLE'),
    ('03', 'Odette', 'Fictive', '1942-11-02', '2024-01-10', TRUE, '301', 'CHAMBRE'),
    ('04', 'Paul', 'Demo', '1936-05-30', '2021-06-20', TRUE, '302', 'SALLE'),
    ('05', 'Lucien', 'Imaginaire', '1939-09-09', '2023-11-22', TRUE, '302', 'CHAMBRE'),
    ('06', 'Yvonne', 'Test', '1945-01-18', '2025-03-05', TRUE, '303', 'SALLE'),
    ('07', 'Gaston', 'Maquette', '1937-02-08', '2022-04-12', TRUE, '303', 'SALLE'),
    ('08', 'Albert', 'Scenario', '1938-10-15', '2023-05-09', TRUE, NULL, 'SALLE'),
    ('09', 'Georgette', 'Brouillon', '1944-11-19', '2025-09-02', TRUE, '304', 'SALLE'),
    ('10', 'Armand', 'Essai', '1936-07-07', '2021-02-14', TRUE, '304', 'CHAMBRE'),
    ('11', 'Henri', 'Ancien', '1934-12-01', '2020-05-11', FALSE, NULL, 'SALLE'),
    ('12', 'Roger', 'Parti', '1933-03-03', '2019-09-09', FALSE, NULL, 'SALLE')
) AS v(code, first_name, last_name, birth_date, admission_date, active, room_number, meal_location)
LEFT JOIN room ON room.number = v.room_number
WHERE NOT EXISTS (SELECT 1 FROM resident WHERE identity_code = 'DEMO-ADMIN-' || v.code);

-- ---------- Fiches médicales (une par résident actif) ----------
INSERT INTO medical_record (history, treatments, resident_id)
SELECT v.history, v.treatments, r.id
FROM (VALUES
    ('Hypertension artérielle ancienne, suivi régulier.',            'Traitement antihypertenseur le matin.',                'DEMO-ADMIN-01'),
    ('Diabète de type 2, surveillance de la glycémie.',              'Traitement antidiabétique oral, contrôle quotidien.',  'DEMO-ADMIN-02'),
    ('Intolérance au gluten, arthrose des mains.',                   'Antalgique léger si douleur.',                         'DEMO-ADMIN-03'),
    ('Fracture du col du fémur en 2022, rééducation terminée.',      'Aide à la marche, kinésithérapie une fois par semaine.','DEMO-ADMIN-04'),
    ('Troubles de la déglutition.',                                  'Repas mixés, épaississant pour les boissons.',         'DEMO-ADMIN-05'),
    ('Surpoids, hypercholestérolémie.',                              'Régime hypocalorique, traitement hypolipémiant.',      'DEMO-ADMIN-06'),
    ('Diabète de type 2.',                                           'Traitement antidiabétique, contrôle quotidien.',       'DEMO-ADMIN-07'),
    ('Insuffisance cardiaque légère.',                               'Diurétique le matin, pesée hebdomadaire.',             'DEMO-ADMIN-08'),
    ('Maladie d''Alzheimer, stade modéré.',                          'Stimulation cognitive, surveillance des repas.',       'DEMO-ADMIN-09'),
    ('Dentition fragile.',                                           'Alimentation hachée.',                                 'DEMO-ADMIN-10')
) AS v(history, treatments, demo_code)
JOIN resident r ON r.identity_code = v.demo_code
WHERE NOT EXISTS (SELECT 1 FROM medical_record WHERE resident_id = r.id);

-- ---------- Allergies ----------
INSERT INTO allergy (name, severity, resident_id)
SELECT v.name, v.severity, r.id
FROM (VALUES
    ('Pénicilline',   'Sévère',  'DEMO-ADMIN-01'),
    ('Latex',         'Légère',  'DEMO-ADMIN-01'),
    ('Arachides',     'Sévère',  'DEMO-ADMIN-03'),
    ('Fruits de mer', 'Modérée', 'DEMO-ADMIN-04'),
    ('Aspirine',      'Modérée', 'DEMO-ADMIN-06')
) AS v(name, severity, demo_code)
JOIN resident r ON r.identity_code = v.demo_code
WHERE NOT EXISTS (SELECT 1 FROM allergy WHERE resident_id = r.id);

-- ---------- Régimes alimentaires (au plus un par résident) ----------
INSERT INTO dietary_regime (type, texture, restrictions, intolerances, instructions, resident_id)
SELECT CASE WHEN v.type IN ('Haché', 'Mixé') THEN 'Normal' ELSE v.type END,
       CASE v.type WHEN 'Haché' THEN 'Hachée' WHEN 'Mixé' THEN 'Mixée' ELSE 'Normale' END,
       v.restrictions, v.intolerances, v.instructions, r.id
FROM (VALUES
    ('Sans sel',       'Pas de sel ajouté',                 NULL,            'Éviter charcuterie et plats préparés',                 'DEMO-ADMIN-01'),
    ('Diabétique',     'Sucres rapides interdits',          NULL,            'Féculents à chaque repas, dessert sans sucre',         'DEMO-ADMIN-02'),
    ('Sans gluten',    'Blé, orge, seigle interdits',       'Gluten',        'Pain et pâtes spéciaux',                               'DEMO-ADMIN-03'),
    ('Haché',          'Texture hachée',                    NULL,            'Viande hachée, légumes bien cuits',                    'DEMO-ADMIN-04'),
    ('Mixé',           'Texture lisse',                     NULL,            'Boissons épaissies, surveiller la déglutition',        'DEMO-ADMIN-05'),
    ('Hypocalorique',  'Limiter graisses et sucres',        NULL,            'Portions réduites, fruit en dessert',                  'DEMO-ADMIN-06'),
    ('Diabétique',     'Sucres rapides interdits',          NULL,            'Dessert sans sucre',                                   'DEMO-ADMIN-07'),
    ('Sans sel',       'Pas de sel ajouté',                 NULL,            'Peser le résident chaque semaine',                     'DEMO-ADMIN-08'),
    ('Haché',          'Texture hachée',                    NULL,            'Viande hachée, légumes bien cuits',                    'DEMO-ADMIN-10')
) AS v(type, restrictions, intolerances, instructions, demo_code)
JOIN resident r ON r.identity_code = v.demo_code
WHERE NOT EXISTS (SELECT 1 FROM dietary_regime WHERE resident_id = r.id);


-- Avec les mêmes créneaux et statuts que la tournée existante.
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT slot.kind, 'Menu de démonstration', CURRENT_DATE + slot.at, 'A_FAIRE', r.id
FROM resident r
CROSS JOIN (VALUES ('DEJEUNER', time '12:00'), ('DINER', time '19:00')) AS slot(kind, at)
WHERE r.active AND r.identity_code LIKE 'DEMO-ADMIN-%'
  AND NOT EXISTS (
    SELECT 1 FROM meal m WHERE m.resident_id = r.id AND m.type = slot.kind
      AND m.scheduled_at = CURRENT_DATE + slot.at
  );
