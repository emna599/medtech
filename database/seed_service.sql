-- Jeu de démonstration du service. Chargé à l’initialisation uniquement.
-- Fonctions : personnel = infirmier (jour), personnel2 = aide-soignante (jour)
INSERT INTO staff_profile (user_id, job, shift)
SELECT u.id, 'INFIRMIER', 'JOUR' FROM users u WHERE u.username = 'personnel'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO staff_profile (user_id, job, shift)
SELECT u.id, 'AIDE_SOIGNANT', 'JOUR' FROM users u WHERE u.username = 'personnel2'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO planning_task (job, shift, start_time, end_time, label, kind, focus)
SELECT plan.job, plan.shift, plan.start_time::time, plan.end_time::time, plan.label, plan.kind, plan.focus
FROM (VALUES
    ('INFIRMIER', 'JOUR', '06:30', '07:00', 'Transmissions avec l''équipe de nuit',            'TRANSMISSION', NULL),
    ('INFIRMIER', 'JOUR', '07:00', '09:30', '1re tournée : prises de sang, dextro, médicaments', 'TOURNEE',      'MEDICAMENT'),
    ('INFIRMIER', 'JOUR', '09:30', '11:30', 'Pansements, passage des médecins',                 'SOINS',        NULL),
    ('INFIRMIER', 'JOUR', '11:00', '11:30', 'Distribution des chevalets',                       'REPAS',        'REPAS'),
    ('INFIRMIER', 'JOUR', '11:30', '13:00', '2e tournée : dextro, médicaments',                 'TOURNEE',      'MEDICAMENT'),
    ('INFIRMIER', 'JOUR', '11:30', '13:00', 'Distribution des repas (avec les aides-soignants)', 'REPAS',        'REPAS'),
    ('INFIRMIER', 'JOUR', '13:00', '13:30', 'Pause',                                            'PAUSE',        NULL),
    ('INFIRMIER', 'JOUR', '13:30', '14:00', 'Transmissions',                                    'TRANSMISSION', NULL),
    ('INFIRMIER', 'JOUR', '17:00', '17:30', '3e tournée : médicaments',                         'TOURNEE',      'MEDICAMENT'),
    ('INFIRMIER', 'JOUR', '20:00', '20:30', 'Transmissions à l''équipe de nuit',                'TRANSMISSION', NULL),

    ('AIDE_SOIGNANT', 'JOUR', '06:30', '07:00', 'Transmissions avec l''équipe de nuit',         'TRANSMISSION', NULL),
    ('AIDE_SOIGNANT', 'JOUR', '07:00', '09:30', '1re tournée : petits-déjeuners, toilettes',    'TOURNEE',      'REPAS'),
    ('AIDE_SOIGNANT', 'JOUR', '09:30', '11:30', 'Soins de nursing, brancardage',                'SOINS',        NULL),
    ('AIDE_SOIGNANT', 'JOUR', '11:00', '11:30', 'Distribution des chevalets',                   'REPAS',        'REPAS'),
    ('AIDE_SOIGNANT', 'JOUR', '11:30', '13:00', 'Distribution des repas (salle et chambres)',   'REPAS',        'REPAS'),
    ('AIDE_SOIGNANT', 'JOUR', '13:00', '13:30', 'Pause',                                        'PAUSE',        NULL),
    ('AIDE_SOIGNANT', 'JOUR', '13:30', '14:00', 'Transmissions',                                'TRANSMISSION', NULL),
    ('AIDE_SOIGNANT', 'JOUR', '17:00', '18:30', '3e tournée et repas du soir',                  'REPAS',        'REPAS'),
    ('AIDE_SOIGNANT', 'JOUR', '20:00', '20:30', 'Transmissions à l''équipe de nuit',            'TRANSMISSION', NULL),

    ('AIDE_SOIGNANT', 'NUIT', '21:00', '21:30', 'Transmissions avec l''équipe de jour',         'TRANSMISSION', NULL),
    ('AIDE_SOIGNANT', 'NUIT', '21:30', '23:30', 'Tournée de coucher, changes',                  'TOURNEE',      NULL),
    ('AIDE_SOIGNANT', 'NUIT', '23:30', '23:59', 'Ronde de nuit',                                'SOINS',        NULL),
    ('AIDE_SOIGNANT', 'NUIT', '00:00', '03:00', 'Rondes de surveillance, résidents à risque',   'SOINS',        NULL),
    ('AIDE_SOIGNANT', 'NUIT', '03:00', '05:00', 'Rondes et changes',                            'SOINS',        NULL),
    ('AIDE_SOIGNANT', 'NUIT', '05:00', '06:30', 'Préparation du lever',                         'TOURNEE',      NULL),
    ('AIDE_SOIGNANT', 'NUIT', '06:30', '06:45', 'Transmissions à l''équipe de jour',            'TRANSMISSION', NULL)
) AS plan(job, shift, start_time, end_time, label, kind, focus)
WHERE NOT EXISTS (SELECT 1 FROM planning_task);

INSERT INTO dining_table (label, capacity)
SELECT 'Table ' || n, 8 FROM generate_series(1, 10) AS n
ON CONFLICT (label) DO NOTHING;

INSERT INTO table_reader (code, table_id)
SELECT 'TR' || n, t.id
FROM generate_series(1, 10) AS n JOIN dining_table t ON t.label = 'Table ' || n
ON CONFLICT DO NOTHING;

INSERT INTO resident_nfc_tag (token, resident_id)
SELECT 'NFC-' || identity_code, id FROM resident
WHERE identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$'
ON CONFLICT (token) DO NOTHING;

INSERT INTO weekly_menu (week_start, day_of_week, meal_type, starter, main_course, side, dessert)
SELECT w.start, m.day, m.meal, m.starter, m.main, m.side, m.dessert
FROM (VALUES (date_trunc('week', CURRENT_DATE)::date), ((date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')::date)) AS w(start)
CROSS JOIN (VALUES
    (1, 'DEJEUNER', 'Salade de carottes râpées', 'Poulet rôti', 'Haricots verts', 'Compote de pommes'),
    (1, 'DINER',    'Velouté de légumes', 'Omelette au fromage', 'Salade verte', 'Yaourt nature'),
    (2, 'DEJEUNER', 'Betteraves vinaigrette', 'Rôti de porc', 'Purée de pommes de terre', 'Fruit de saison'),
    (2, 'DINER',    'Soupe de tomates', 'Quiche lorraine', 'Salade verte', 'Fromage blanc'),
    (3, 'DEJEUNER', 'Concombre à la crème', 'Filet de poisson, sauce citron', 'Riz et carottes', 'Flan vanille'),
    (3, 'DINER',    'Potage de courgettes', 'Jambon blanc', 'Gratin de macaronis', 'Compote de poires'),
    (4, 'DEJEUNER', 'Salade de lentilles', 'Boeuf bourguignon', 'Pommes de terre vapeur', 'Crème caramel'),
    (4, 'DINER',    'Soupe de potiron', 'Croque-monsieur', 'Salade verte', 'Yaourt aux fruits'),
    (5, 'DEJEUNER', 'Céleri rémoulade', 'Poisson pané', 'Épinards à la crème', 'Mousse au chocolat'),
    (5, 'DINER',    'Velouté de champignons', 'Gratin de légumes', 'Semoule', 'Fromage blanc'),
    (6, 'DEJEUNER', 'Salade de tomates', 'Escalope de dinde', 'Ratatouille', 'Tarte aux pommes'),
    (6, 'DINER',    'Soupe de poireaux', 'Pizza au fromage', 'Salade verte', 'Compote de pommes'),
    (7, 'DEJEUNER', 'Terrine de légumes', 'Gigot d''agneau', 'Flageolets', 'Gâteau de semoule'),
    (7, 'DINER',    'Soupe vermicelle', 'Oeufs durs mayonnaise', 'Purée de carottes', 'Yaourt nature')
) AS m(day, meal, starter, main, side, dessert)
ON CONFLICT (week_start, day_of_week, meal_type) DO NOTHING;
