-- =====================================================
-- MedTech - données de soin FICTIVES : fiches médicales, allergies, régimes,
-- repas (J-3 à J+3 autour de la date d'exécution), distributions et QR codes.
-- À exécuter après seed_demo.sql (setup.sql le fait pour toi).
-- Chaque bloc ne s'exécute que si sa table est vide : le script peut être relancé.
-- Aucune donnée réelle : toutes les informations sont inventées pour la démonstration.
-- =====================================================

-- ---------- Fiches médicales (une par résident actif) ----------
INSERT INTO medical_record (history, treatments, resident_id)
SELECT v.history, v.treatments, r.id
FROM (VALUES
    ('Hypertension artérielle ancienne, suivi régulier.',            'Traitement antihypertenseur le matin.',                'Exemple'),
    ('Diabète de type 2, surveillance de la glycémie.',              'Traitement antidiabétique oral, contrôle quotidien.',  'Modele'),
    ('Intolérance au gluten, arthrose des mains.',                   'Antalgique léger si douleur.',                         'Fictive'),
    ('Fracture du col du fémur en 2022, rééducation terminée.',      'Aide à la marche, kinésithérapie une fois par semaine.','Demo'),
    ('Troubles de la déglutition.',                                  'Repas mixés, épaississant pour les boissons.',         'Imaginaire'),
    ('Surpoids, hypercholestérolémie.',                              'Régime hypocalorique, traitement hypolipémiant.',      'Test'),
    ('Diabète de type 2.',                                           'Traitement antidiabétique, contrôle quotidien.',       'Maquette'),
    ('Insuffisance cardiaque légère.',                               'Diurétique le matin, pesée hebdomadaire.',             'Scenario'),
    ('Maladie d''Alzheimer, stade modéré.',                          'Stimulation cognitive, surveillance des repas.',       'Brouillon'),
    ('Dentition fragile.',                                           'Alimentation hachée.',                                 'Essai'),
    ('Intolérance au lactose.',                                      'Aucun traitement, régime sans lactose.',               'Hypothese'),
    ('Ostéoporose.',                                                 'Supplément en calcium et vitamine D.',                 'Prototype')
) AS v(history, treatments, last_name)
JOIN resident r ON r.last_name = v.last_name
WHERE NOT EXISTS (SELECT 1 FROM medical_record);

-- Fiche par défaut pour les autres résidents actifs
INSERT INTO medical_record (history, treatments, resident_id)
SELECT 'Aucun antécédent notable renseigné.', 'Aucun traitement particulier.', r.id
FROM resident r
WHERE r.active
  AND NOT EXISTS (SELECT 1 FROM medical_record m WHERE m.resident_id = r.id)
  AND NOT EXISTS (SELECT 1 FROM medical_record WHERE history = 'Aucun antécédent notable renseigné.');

-- ---------- Allergies ----------
INSERT INTO allergy (name, severity, resident_id)
SELECT v.name, v.severity, r.id
FROM (VALUES
    ('Pénicilline',   'Sévère',  'Exemple'),
    ('Latex',         'Légère',  'Exemple'),
    ('Arachides',     'Sévère',  'Fictive'),
    ('Fruits de mer', 'Modérée', 'Demo'),
    ('Pollen',        'Légère',  'Prototype'),
    ('Œufs',          'Modérée', 'Echantillon'),
    ('Aspirine',      'Modérée', 'Test'),
    ('Noix',          'Sévère',  'Canevas'),
    ('Iode',          'Modérée', 'Esquisse'),
    ('Fraises',       'Légère',  'Croquis')
) AS v(name, severity, last_name)
JOIN resident r ON r.last_name = v.last_name
WHERE NOT EXISTS (SELECT 1 FROM allergy);

-- ---------- Régimes alimentaires (au plus un par résident) ----------
INSERT INTO dietary_regime (type, restrictions, intolerances, instructions, resident_id)
SELECT v.type, v.restrictions, v.intolerances, v.instructions, r.id
FROM (VALUES
    ('Sans sel',       'Pas de sel ajouté',                 NULL,            'Éviter charcuterie et plats préparés',                 'Exemple'),
    ('Diabétique',     'Sucres rapides interdits',          NULL,            'Féculents à chaque repas, dessert sans sucre',         'Modele'),
    ('Sans gluten',    'Blé, orge, seigle interdits',       'Gluten',        'Pain et pâtes spéciaux',                               'Fictive'),
    ('Haché',          'Texture hachée',                    NULL,            'Viande hachée, légumes bien cuits',                    'Demo'),
    ('Mixé',           'Texture lisse',                     NULL,            'Boissons épaissies, surveiller la déglutition',        'Imaginaire'),
    ('Hypocalorique',  'Limiter graisses et sucres',        NULL,            'Portions réduites, fruit en dessert',                  'Test'),
    ('Diabétique',     'Sucres rapides interdits',          NULL,            'Dessert sans sucre',                                   'Maquette'),
    ('Sans sel',       'Pas de sel ajouté',                 NULL,            'Peser le résident chaque semaine',                     'Scenario'),
    ('Sans lactose',   'Lait et dérivés interdits',         'Lactose',       'Remplacer par boisson végétale',                       'Hypothese'),
    ('Végétarien',     'Ni viande ni poisson',              NULL,            'Protéines végétales et œufs',                          'Illustre'),
    ('Haché',          'Texture hachée',                    NULL,            'Viande hachée, légumes bien cuits',                    'Essai')
) AS v(type, restrictions, intolerances, instructions, last_name)
JOIN resident r ON r.last_name = v.last_name
WHERE NOT EXISTS (SELECT 1 FROM dietary_regime);

-- ---------- Repas : 3 par jour et par résident actif, de J-3 à J+3 ----------
INSERT INTO meal (type, description, scheduled_at, resident_id)
SELECT m.type,
       CASE m.type
           WHEN 'Petit-déjeuner' THEN 'Café ou thé, pain et confiture'
           WHEN 'Déjeuner' THEN (ARRAY['Poulet rôti et haricots verts', 'Poisson et riz', 'Blanquette de veau et carottes'])[1 + (EXTRACT(DOY FROM d.day)::int % 3)]
           ELSE (ARRAY['Soupe de légumes et compote', 'Omelette et salade', 'Purée et jambon'])[1 + (EXTRACT(DOY FROM d.day)::int % 3)]
       END || COALESCE(' - régime ' || lower(g.type), ''),
       d.day::date + m.at,
       r.id
FROM resident r
CROSS JOIN generate_series(current_date - 3, current_date + 3, interval '1 day') AS d(day)
CROSS JOIN (VALUES ('Petit-déjeuner', time '08:00'), ('Déjeuner', time '12:30'), ('Dîner', time '19:00')) AS m(type, at)
LEFT JOIN dietary_regime g ON g.resident_id = r.id
WHERE r.active
  AND NOT EXISTS (SELECT 1 FROM meal);

-- ---------- Distributions : les repas passés sont servis, sauf 1 sur 9 (pour la démo « à servir ») ----------
INSERT INTO meal_distribution (served_at, comment, meal_id, user_id)
SELECT m.scheduled_at + interval '10 minutes',
       CASE WHEN m.id % 17 = 0 THEN 'Repas pris en partie seulement' END,
       m.id,
       (SELECT id FROM users WHERE username = 'personnel')
FROM meal m
WHERE m.scheduled_at < now()
  AND m.id % 9 <> 0
  AND NOT EXISTS (SELECT 1 FROM meal_distribution);

-- ---------- QR codes : un actif par résident actif + un ancien désactivé (renouvellement) ----------
INSERT INTO qr_code (token, active, created_at, deactivated_at, resident_id, user_id)
SELECT replace(gen_random_uuid()::text, '-', ''), q.act, q.created, q.deact, q.rid,
       (SELECT id FROM users WHERE username = 'medecin')
FROM (
    SELECT r.id AS rid, TRUE AS act, now() - interval '30 days' AS created, NULL::timestamptz AS deact
    FROM resident r WHERE r.active
    UNION ALL
    SELECT r.id, FALSE, now() - interval '200 days', now() - interval '30 days'
    FROM resident r WHERE r.last_name = 'Exemple'
) q
WHERE NOT EXISTS (SELECT 1 FROM qr_code);
