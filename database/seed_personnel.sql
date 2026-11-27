-- =====================================================
-- MedTech - données de DÉMONSTRATION (100 % fictives) pour l'espace PERSONNEL
-- À exécuter dans pgAdmin (Query Tool) sur la base "medtech",
-- APRÈS medtech_schema.sql, seed_users.sql et personnel_additions.sql.
-- Relançable : supprime d'abord les résidents de démo (identity_code 'DEMO-%')
-- et recrée les repas et prises pour AUJOURD'HUI.
-- =====================================================

-- ---------- Deuxième compte soignant (pour tester la confirmation d'un doute par un AUTRE soignant) ----------
-- Mot de passe : Demo1234!  (même hash que dans seed_users.sql)
INSERT INTO users (username, password_hash, full_name, role) VALUES
    ('personnel2', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Léa Aide-soignante', 'PERSONNEL')
ON CONFLICT (username) DO NOTHING;
UPDATE users SET full_name = 'Léa Aide-soignante' WHERE username = 'personnel2';
INSERT INTO users (username, password_hash, full_name, role) VALUES
    ('personnel3', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Hugo Infirmier', 'PERSONNEL')
ON CONFLICT (username) DO NOTHING;

-- Nettoyage des anciennes données de démo (les tables liées suivent par ON DELETE CASCADE)
DELETE FROM resident WHERE identity_code LIKE 'DEMO-%';

-- ---------- Chambres ----------
INSERT INTO room (number, floor, capacity) VALUES
    ('3', 1, 1), ('7', 1, 1), ('8', 1, 1), ('9', 1, 1), ('10', 1, 1), ('11', 1, 1), ('12', 1, 1),
    ('14', 2, 1), ('15', 2, 1), ('16', 2, 1), ('17', 2, 1), ('21', 2, 1)
ON CONFLICT (number) DO NOTHING;
-- 80 chambres au total : les numéros 1 à 80 non encore créés, répartis sur 4 étages de 20
INSERT INTO room (number, floor, capacity)
SELECT n::text, 1 + (n - 1) / 20, 1 FROM generate_series(1, 80) AS n
ON CONFLICT (number) DO NOTHING;

-- ---------- 80 résidents (noms inventés ; DEMO-001 à DEMO-080) ----------
INSERT INTO resident (first_name, last_name, birth_date, admission_date, active, room_id,
                      meal_location, needs_help, distinguishing_features, identity_code)
SELECT v.first_name, v.last_name, v.birth_date::date, v.admission_date::date, TRUE, r.id,
       v.meal_location, v.needs_help, v.features, v.code
FROM (VALUES
    ('Jeanne',  'Martin',   '1938-04-12', '2022-03-01', '12', 'CHAMBRE', TRUE,  'Cheveux blancs courts, lunettes',       'DEMO-001'),
    ('Michel',  'Durand',   '1941-09-03', '2023-01-15', '7',  'SALLE',   FALSE, 'Moustache grise, déambulateur',        'DEMO-002'),
    ('Odette',  'Petit',    '1936-01-25', '2021-11-20', '3',  'CHAMBRE', TRUE,  'Châle bleu, appareil auditif',         'DEMO-003'),
    ('Paul',    'Bernard',  '1939-11-30', '2024-02-05', '15', 'CHAMBRE', FALSE, 'Grand, cheveux blancs, canne',         'DEMO-004'),
    ('Simone',  'Leroy',    '1940-06-18', '2022-09-12', '8',  'SALLE',   FALSE, 'Cheveux gris bouclés, collier perles', 'DEMO-005'),
    ('Henri',   'Moreau',   '1937-12-08', '2020-05-30', '14', 'SALLE',   FALSE, 'Chauve, lunettes rondes, fauteuil',    'DEMO-006'),
    ('Colette', 'Simon',    '1942-02-14', '2023-06-18', '21', 'SALLE',   TRUE,  'Cheveux roux clairs, fauteuil',        'DEMO-007'),
    ('Marcel',  'Laurent',  '1935-07-27', '2019-10-02', '9',  'SALLE',   FALSE, 'Béret, moustache blanche',             'DEMO-008'),
    ('Rosa',    'Garcia',   '1943-03-09', '2024-04-22', '10', 'SALLE',   FALSE, 'Cheveux noirs attachés, lunettes',     'DEMO-009'),
    ('Lucien',  'Roux',     '1938-10-21', '2022-12-07', '11', 'SALLE',   TRUE,  'Barbe blanche, cardigan vert',         'DEMO-010'),
    ('Yvette',  'Fournier', '1941-05-16', '2023-09-29', '16', 'SALLE',   FALSE, 'Cheveux blancs longs, canne',          'DEMO-011'),
    ('André',   'Girard',   '1940-08-04', '2021-07-13', '17', 'SALLE',   FALSE, 'Chauve, grosses lunettes',             'DEMO-012'),
    ('Marie', 'Lambert', '1937-06-12', '2020-04-14', '1', 'SALLE', FALSE, 'Cheveux gris, fauteuil roulant', 'DEMO-013'),
    ('Jean', 'Fontaine', '1944-11-23', '2021-07-27', '2', 'SALLE', FALSE, 'Cheveux blancs longs, cardigan bleu', 'DEMO-014'),
    ('Madeleine', 'Rousseau', '1934-04-06', '2022-10-12', '4', 'SALLE', FALSE, 'Cheveux blancs, collier', 'DEMO-015'),
    ('Pierre', 'Vincent', '1941-09-17', '2023-01-25', '5', 'CHAMBRE', FALSE, 'Cheveux gris bouclés, canne', 'DEMO-016'),
    ('Germaine', 'Muller', '1931-02-28', '2024-04-10', '6', 'SALLE', TRUE, 'Cheveux blancs, châle', 'DEMO-017'),
    ('Louis', 'Lefèvre', '1938-07-11', '2019-07-23', '13', 'SALLE', FALSE, 'Cheveux blancs courts, écharpe', 'DEMO-018'),
    ('Denise', 'Faure', '1945-12-22', '2020-10-08', '18', 'SALLE', FALSE, 'Cheveux gris, appareil auditif', 'DEMO-019'),
    ('Roger', 'André', '1935-05-05', '2021-01-21', '19', 'CHAMBRE', FALSE, 'Cheveux blancs longs, déambulateur', 'DEMO-020'),
    ('Jacqueline', 'Mercier', '1942-10-16', '2022-04-06', '20', 'SALLE', FALSE, 'Cheveux blancs, lunettes rondes', 'DEMO-021'),
    ('Raymond', 'Blanc', '1932-03-27', '2023-07-19', '22', 'SALLE', TRUE, 'Cheveux gris bouclés, béret', 'DEMO-022'),
    ('Monique', 'Guérin', '1939-08-10', '2024-10-04', '23', 'SALLE', FALSE, 'Cheveux blancs, lunettes', 'DEMO-023'),
    ('Gérard', 'Boyer', '1946-01-21', '2019-01-17', '24', 'CHAMBRE', FALSE, 'Cheveux blancs courts, fauteuil roulant', 'DEMO-024'),
    ('Suzanne', 'Garnier', '1936-06-04', '2020-04-02', '25', 'SALLE', FALSE, 'Cheveux gris, cardigan bleu', 'DEMO-025'),
    ('Claude', 'Chevalier', '1943-11-15', '2021-07-15', '26', 'SALLE', FALSE, 'Cheveux blancs longs, collier', 'DEMO-026'),
    ('Paulette', 'François', '1933-04-26', '2022-10-28', '27', 'SALLE', TRUE, 'Cheveux blancs, canne', 'DEMO-027'),
    ('Robert', 'Legrand', '1940-09-09', '2023-01-13', '28', 'CHAMBRE', FALSE, 'Cheveux gris bouclés, châle', 'DEMO-028'),
    ('Lucienne', 'Gauthier', '1930-02-20', '2024-04-26', '29', 'SALLE', FALSE, 'Cheveux blancs, écharpe', 'DEMO-029'),
    ('Georges', 'Perrin', '1937-07-03', '2019-07-11', '30', 'SALLE', FALSE, 'Cheveux blancs courts, appareil auditif', 'DEMO-030'),
    ('Georgette', 'Robin', '1944-12-14', '2020-10-24', '31', 'SALLE', FALSE, 'Cheveux gris, déambulateur', 'DEMO-031'),
    ('Roland', 'Clément', '1934-05-25', '2021-01-09', '32', 'CHAMBRE', TRUE, 'Cheveux blancs longs, lunettes rondes', 'DEMO-032'),
    ('Josette', 'Morin', '1941-10-08', '2022-04-22', '33', 'SALLE', FALSE, 'Cheveux blancs, béret', 'DEMO-033'),
    ('Maurice', 'Nicolas', '1931-03-19', '2023-07-07', '34', 'SALLE', FALSE, 'Cheveux gris bouclés, lunettes', 'DEMO-034'),
    ('Huguette', 'Henry', '1938-08-02', '2024-10-20', '35', 'SALLE', FALSE, 'Cheveux blancs, fauteuil roulant', 'DEMO-035'),
    ('Albert', 'Roussel', '1945-01-13', '2019-01-05', '36', 'CHAMBRE', FALSE, 'Cheveux blancs courts, cardigan bleu', 'DEMO-036'),
    ('Renée', 'Mathieu', '1935-06-24', '2020-04-18', '37', 'SALLE', TRUE, 'Cheveux gris, collier', 'DEMO-037'),
    ('René', 'Gautier', '1942-11-07', '2021-07-03', '38', 'SALLE', FALSE, 'Cheveux blancs longs, canne', 'DEMO-038'),
    ('Marguerite', 'Masson', '1932-04-18', '2022-10-16', '39', 'SALLE', FALSE, 'Cheveux blancs, châle', 'DEMO-039'),
    ('Fernand', 'Marchand', '1939-09-01', '2023-01-01', '40', 'CHAMBRE', FALSE, 'Cheveux gris bouclés, écharpe', 'DEMO-040'),
    ('Ginette', 'Duval', '1946-02-12', '2024-04-14', '41', 'SALLE', FALSE, 'Cheveux blancs, appareil auditif', 'DEMO-041'),
    ('Gaston', 'Denis', '1936-07-23', '2019-07-27', '42', 'SALLE', TRUE, 'Cheveux blancs courts, déambulateur', 'DEMO-042'),
    ('Odile', 'Dumont', '1943-12-06', '2020-10-12', '43', 'SALLE', FALSE, 'Cheveux gris, lunettes rondes', 'DEMO-043'),
    ('Émile', 'Marie', '1933-05-17', '2021-01-25', '44', 'CHAMBRE', FALSE, 'Cheveux blancs longs, béret', 'DEMO-044'),
    ('Mireille', 'Lemaire', '1940-10-28', '2022-04-10', '45', 'SALLE', FALSE, 'Cheveux blancs, lunettes', 'DEMO-045'),
    ('Jacques', 'Noël', '1930-03-11', '2023-07-23', '46', 'SALLE', FALSE, 'Cheveux gris bouclés, fauteuil roulant', 'DEMO-046'),
    ('Raymonde', 'Meyer', '1937-08-22', '2024-10-08', '47', 'SALLE', TRUE, 'Cheveux blancs, cardigan bleu', 'DEMO-047'),
    ('Daniel', 'Dufour', '1944-01-05', '2019-01-21', '48', 'CHAMBRE', FALSE, 'Cheveux blancs courts, collier', 'DEMO-048'),
    ('Andrée', 'Meunier', '1934-06-16', '2020-04-06', '49', 'SALLE', FALSE, 'Cheveux gris, canne', 'DEMO-049'),
    ('Alain', 'Brun', '1941-11-27', '2021-07-19', '50', 'SALLE', FALSE, 'Cheveux blancs longs, châle', 'DEMO-050'),
    ('Thérèse', 'Blanchard', '1931-04-10', '2022-10-04', '51', 'SALLE', FALSE, 'Cheveux blancs, écharpe', 'DEMO-051'),
    ('Yves', 'Giraud', '1938-09-21', '2023-01-17', '52', 'CHAMBRE', TRUE, 'Cheveux gris bouclés, appareil auditif', 'DEMO-052'),
    ('Lucette', 'Joly', '1945-02-04', '2024-04-02', '53', 'SALLE', FALSE, 'Cheveux blancs, déambulateur', 'DEMO-053'),
    ('Gilbert', 'Rivière', '1935-07-15', '2019-07-15', '54', 'SALLE', FALSE, 'Cheveux blancs courts, lunettes rondes', 'DEMO-054'),
    ('Fernande', 'Lucas', '1942-12-26', '2020-10-28', '55', 'SALLE', FALSE, 'Cheveux gris, béret', 'DEMO-055'),
    ('Serge', 'Brunet', '1932-05-09', '2021-01-13', '56', 'CHAMBRE', FALSE, 'Cheveux blancs longs, lunettes', 'DEMO-056'),
    ('Gisèle', 'Gaillard', '1939-10-20', '2022-04-26', '57', 'SALLE', TRUE, 'Cheveux blancs, fauteuil roulant', 'DEMO-057'),
    ('Christian', 'Barbier', '1946-03-03', '2023-07-11', '58', 'SALLE', FALSE, 'Cheveux gris bouclés, cardigan bleu', 'DEMO-058'),
    ('Nicole', 'Arnaud', '1936-08-14', '2024-10-24', '59', 'SALLE', FALSE, 'Cheveux blancs, collier', 'DEMO-059'),
    ('Marc', 'Martinez', '1943-01-25', '2019-01-09', '60', 'CHAMBRE', FALSE, 'Cheveux blancs courts, canne', 'DEMO-060'),
    ('Micheline', 'Gérard', '1933-06-08', '2020-04-22', '61', 'SALLE', FALSE, 'Cheveux gris, châle', 'DEMO-061'),
    ('Noël', 'Roche', '1940-11-19', '2021-07-07', '62', 'SALLE', TRUE, 'Cheveux blancs longs, écharpe', 'DEMO-062'),
    ('Arlette', 'Renard', '1930-04-02', '2022-10-20', '63', 'SALLE', FALSE, 'Cheveux blancs, appareil auditif', 'DEMO-063'),
    ('Victor', 'Schmitt', '1937-09-13', '2023-01-05', '64', 'CHAMBRE', FALSE, 'Cheveux gris bouclés, déambulateur', 'DEMO-064'),
    ('Yolande', 'Roy', '1944-02-24', '2024-04-18', '65', 'SALLE', FALSE, 'Cheveux blancs, lunettes rondes', 'DEMO-065'),
    ('Étienne', 'Leroux', '1934-07-07', '2019-07-03', '66', 'SALLE', FALSE, 'Cheveux blancs courts, béret', 'DEMO-066'),
    ('Danielle', 'Colin', '1941-12-18', '2020-10-16', '67', 'SALLE', TRUE, 'Cheveux gris, lunettes', 'DEMO-067'),
    ('Léon', 'Vidal', '1931-05-01', '2021-01-01', '68', 'CHAMBRE', FALSE, 'Cheveux blancs longs, fauteuil roulant', 'DEMO-068'),
    ('Françoise', 'Caron', '1938-10-12', '2022-04-14', '69', 'SALLE', FALSE, 'Cheveux blancs, cardigan bleu', 'DEMO-069'),
    ('Joseph', 'Picard', '1945-03-23', '2023-07-27', '70', 'SALLE', FALSE, 'Cheveux gris bouclés, collier', 'DEMO-070'),
    ('Liliane', 'Roger', '1935-08-06', '2024-10-12', '71', 'SALLE', FALSE, 'Cheveux blancs, canne', 'DEMO-071'),
    ('Francis', 'Fabre', '1942-01-17', '2019-01-25', '72', 'CHAMBRE', TRUE, 'Cheveux blancs courts, châle', 'DEMO-072'),
    ('Jeannine', 'Aubert', '1932-06-28', '2020-04-10', '73', 'SALLE', FALSE, 'Cheveux gris, écharpe', 'DEMO-073'),
    ('Armand', 'Lemoine', '1939-11-11', '2021-07-23', '74', 'SALLE', FALSE, 'Cheveux blancs longs, appareil auditif', 'DEMO-074'),
    ('Éliane', 'Renaud', '1946-04-22', '2022-10-08', '75', 'SALLE', FALSE, 'Cheveux blancs, déambulateur', 'DEMO-075'),
    ('Norbert', 'Dumas', '1936-09-05', '2023-01-21', '76', 'CHAMBRE', FALSE, 'Cheveux gris bouclés, lunettes rondes', 'DEMO-076'),
    ('Solange', 'Lacroix', '1943-02-16', '2024-04-06', '77', 'SALLE', TRUE, 'Cheveux blancs, béret', 'DEMO-077'),
    ('Clément', 'Olivier', '1933-07-27', '2019-07-19', '78', 'SALLE', FALSE, 'Cheveux blancs courts, lunettes', 'DEMO-078'),
    ('Bernadette', 'Philippe', '1940-12-10', '2020-10-04', '79', 'SALLE', FALSE, 'Cheveux gris, fauteuil roulant', 'DEMO-079'),
    ('Alfred', 'Bourgeois', '1930-05-21', '2021-01-17', '80', 'CHAMBRE', FALSE, 'Cheveux blancs longs, cardigan bleu', 'DEMO-080')
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
    ('DEMO-007', 'Lactose',       'Légère'),
    ('DEMO-021', 'Lactose', 'Légère'),
    ('DEMO-025', 'Pénicilline', 'Modérée'),
    ('DEMO-029', 'Gluten', 'Modérée'),
    ('DEMO-030', 'Lactose', 'Légère'),
    ('DEMO-031', 'Fruits à coque', 'Grave'),
    ('DEMO-035', 'Poisson', 'Grave'),
    ('DEMO-038', 'Pénicilline', 'Modérée'),
    ('DEMO-039', 'Lactose', 'Légère'),
    ('DEMO-046', 'Gluten', 'Modérée'),
    ('DEMO-048', 'Lactose', 'Légère'),
    ('DEMO-050', 'Fruits à coque', 'Grave'),
    ('DEMO-051', 'Pénicilline', 'Modérée'),
    ('DEMO-057', 'Lactose', 'Légère'),
    ('DEMO-058', 'Poisson', 'Grave'),
    ('DEMO-063', 'Gluten', 'Modérée'),
    ('DEMO-064', 'Pénicilline', 'Modérée'),
    ('DEMO-066', 'Lactose', 'Légère'),
    ('DEMO-069', 'Fruits à coque', 'Grave'),
    ('DEMO-075', 'Lactose', 'Légère'),
    ('DEMO-077', 'Pénicilline', 'Modérée'),
    ('DEMO-080', 'Gluten', 'Modérée')
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
    ('DEMO-012', 'Diabétique',          'Normale', 'Sucres rapides',      'Dessert sans sucre'),
    ('DEMO-013', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-014', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-015', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-016', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-017', 'Normal', 'Normale', NULL, 'Aide au repas nécessaire'),
    ('DEMO-018', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-019', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-020', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-021', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-022', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Aide au repas nécessaire'),
    ('DEMO-023', 'Végétarien', 'Mixée', 'Viande, poisson', NULL),
    ('DEMO-024', 'Normal', 'Normale', NULL, NULL),
    ('DEMO-025', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-026', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-027', 'Sans sel', 'Normale', 'Sel', 'Aide au repas nécessaire'),
    ('DEMO-028', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-029', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-030', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-031', 'Normal', 'Normale', NULL, NULL),
    ('DEMO-032', 'Sans sel', 'Normale', 'Sel', 'Aide au repas nécessaire'),
    ('DEMO-033', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-034', 'Sans sel', 'Mixée', 'Sel', NULL),
    ('DEMO-035', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-036', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-037', 'Végétarien', 'Normale', 'Viande, poisson', 'Aide au repas nécessaire'),
    ('DEMO-038', 'Normal', 'Normale', NULL, NULL),
    ('DEMO-039', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-040', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-041', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-042', 'Diabétique', 'Normale', 'Sucres rapides', 'Aide au repas nécessaire'),
    ('DEMO-043', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-044', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-045', 'Normal', 'Mixée', NULL, NULL),
    ('DEMO-046', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-047', 'Normal', 'Hachée', NULL, 'Aide au repas nécessaire'),
    ('DEMO-048', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-049', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-050', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-051', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-052', 'Normal', 'Normale', NULL, 'Aide au repas nécessaire'),
    ('DEMO-053', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-054', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-055', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-056', 'Diabétique', 'Mixée', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-057', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Aide au repas nécessaire'),
    ('DEMO-058', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-059', 'Normal', 'Normale', NULL, NULL),
    ('DEMO-060', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-061', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-062', 'Sans sel', 'Normale', 'Sel', 'Aide au repas nécessaire'),
    ('DEMO-063', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-064', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-065', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-066', 'Normal', 'Normale', NULL, NULL),
    ('DEMO-067', 'Sans sel', 'Mixée', 'Sel', 'Aide au repas nécessaire'),
    ('DEMO-068', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-069', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-070', 'Diabétique', 'Normale', 'Sucres rapides', 'Dessert sans sucre'),
    ('DEMO-071', 'Diabétique, sans sel', 'Normale', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-072', 'Végétarien', 'Normale', 'Viande, poisson', 'Aide au repas nécessaire'),
    ('DEMO-073', 'Normal', 'Normale', NULL, NULL),
    ('DEMO-074', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-075', 'Normal', 'Hachée', NULL, NULL),
    ('DEMO-076', 'Sans sel', 'Normale', 'Sel', NULL),
    ('DEMO-077', 'Diabétique', 'Normale', 'Sucres rapides', 'Aide au repas nécessaire'),
    ('DEMO-078', 'Diabétique, sans sel', 'Mixée', 'Sucres rapides, sel', 'Dessert sans sucre'),
    ('DEMO-079', 'Végétarien', 'Normale', 'Viande, poisson', NULL),
    ('DEMO-080', 'Normal', 'Normale', NULL, NULL)
) AS g(code, type, texture, restrictions, instructions)
JOIN resident r ON r.identity_code = g.code;

-- ---------- Petit-déjeuner du jour (8h) : servi en chambre par les hôtesses (les soignants peuvent aider) ----------
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT 'PETIT_DEJEUNER',
       CASE d.texture
            WHEN 'Mixée'  THEN 'Bouillie de céréales, compote, café au lait'
            WHEN 'Hachée' THEN 'Pain trempé, fromage blanc, thé'
            ELSE               'Café ou thé, pain, beurre, confiture, yaourt'
       END || CASE WHEN d.type ILIKE '%diab%' THEN ' (sans sucre)' ELSE '' END,
       CURRENT_DATE + TIME '08:00', 'A_FAIRE', r.id
FROM resident r JOIN dietary_regime d ON d.resident_id = r.id
WHERE r.identity_code LIKE 'DEMO-%';

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
WHERE r.identity_code LIKE 'DEMO-%';

INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT 'DINER',
       CASE d.texture
            WHEN 'Mixée'  THEN 'Soupe de légumes mixée, flan'
            WHEN 'Hachée' THEN 'Omelette hachée, purée, fromage blanc'
            ELSE               'Soupe, omelette, salade, fromage blanc'
       END || CASE WHEN d.type ILIKE '%diab%' THEN ' (sans sucre)' ELSE '' END,
       CURRENT_DATE + TIME '19:00', 'A_FAIRE', r.id
FROM resident r JOIN dietary_regime d ON d.resident_id = r.id
WHERE r.identity_code LIKE 'DEMO-%';

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
    ('DEMO-012', 'Ézétimibe',      '10 mg',    '18:00', FALSE),
    ('DEMO-013', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-014', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-014', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-015', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-015', 'Amlodipine', '5 mg', '18:00', FALSE),
    ('DEMO-016', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-016', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-017', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-018', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-018', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-018', 'Warfarine', '5 mg', '18:00', TRUE),
    ('DEMO-019', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-020', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-020', 'Oméprazole', '20 mg', '12:00', FALSE),
    ('DEMO-021', 'Oméprazole', '20 mg', '08:00', FALSE),
    ('DEMO-021', 'Lévothyroxine', '75 µg', '18:00', FALSE),
    ('DEMO-022', 'Lévothyroxine', '75 µg', '08:00', FALSE),
    ('DEMO-022', 'Metformine', '1000 mg', '12:00', FALSE),
    ('DEMO-023', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-024', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-024', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-024', 'Amlodipine', '5 mg', '18:00', FALSE),
    ('DEMO-025', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-026', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-026', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-027', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-027', 'Tramadol', '37,5 mg', '18:00', TRUE),
    ('DEMO-028', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-028', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-029', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-030', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-030', 'Oméprazole', '20 mg', '12:00', FALSE),
    ('DEMO-030', 'Lévothyroxine', '75 µg', '18:00', FALSE),
    ('DEMO-031', 'Oméprazole', '20 mg', '08:00', FALSE),
    ('DEMO-032', 'Lévothyroxine', '75 µg', '08:00', FALSE),
    ('DEMO-032', 'Metformine', '1000 mg', '12:00', FALSE),
    ('DEMO-033', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-033', 'Paracétamol', '1000 mg', '18:00', FALSE),
    ('DEMO-034', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-034', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-035', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-036', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-036', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-036', 'Tramadol', '37,5 mg', '18:00', TRUE),
    ('DEMO-037', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-038', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-038', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-039', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-039', 'Warfarine', '5 mg', '18:00', TRUE),
    ('DEMO-040', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-040', 'Oméprazole', '20 mg', '12:00', FALSE),
    ('DEMO-041', 'Oméprazole', '20 mg', '08:00', FALSE),
    ('DEMO-042', 'Lévothyroxine', '75 µg', '08:00', FALSE),
    ('DEMO-042', 'Metformine', '1000 mg', '12:00', FALSE),
    ('DEMO-042', 'Paracétamol', '1000 mg', '18:00', FALSE),
    ('DEMO-043', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-044', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-044', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-045', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-045', 'Amlodipine', '5 mg', '18:00', FALSE),
    ('DEMO-046', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-046', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-047', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-048', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-048', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-048', 'Warfarine', '5 mg', '18:00', TRUE),
    ('DEMO-049', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-050', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-050', 'Oméprazole', '20 mg', '12:00', FALSE),
    ('DEMO-051', 'Oméprazole', '20 mg', '08:00', FALSE),
    ('DEMO-051', 'Lévothyroxine', '75 µg', '18:00', FALSE),
    ('DEMO-052', 'Lévothyroxine', '75 µg', '08:00', FALSE),
    ('DEMO-052', 'Metformine', '1000 mg', '12:00', FALSE),
    ('DEMO-053', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-054', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-054', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-054', 'Amlodipine', '5 mg', '18:00', FALSE),
    ('DEMO-055', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-056', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-056', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-057', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-057', 'Tramadol', '37,5 mg', '18:00', TRUE),
    ('DEMO-058', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-058', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-059', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-060', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-060', 'Oméprazole', '20 mg', '12:00', FALSE),
    ('DEMO-060', 'Lévothyroxine', '75 µg', '18:00', FALSE),
    ('DEMO-061', 'Oméprazole', '20 mg', '08:00', FALSE),
    ('DEMO-062', 'Lévothyroxine', '75 µg', '08:00', FALSE),
    ('DEMO-062', 'Metformine', '1000 mg', '12:00', FALSE),
    ('DEMO-063', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-063', 'Paracétamol', '1000 mg', '18:00', FALSE),
    ('DEMO-064', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-064', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-065', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-066', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-066', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-066', 'Tramadol', '37,5 mg', '18:00', TRUE),
    ('DEMO-067', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-068', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-068', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-069', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-069', 'Warfarine', '5 mg', '18:00', TRUE),
    ('DEMO-070', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-070', 'Oméprazole', '20 mg', '12:00', FALSE),
    ('DEMO-071', 'Oméprazole', '20 mg', '08:00', FALSE),
    ('DEMO-072', 'Lévothyroxine', '75 µg', '08:00', FALSE),
    ('DEMO-072', 'Metformine', '1000 mg', '12:00', FALSE),
    ('DEMO-072', 'Paracétamol', '1000 mg', '18:00', FALSE),
    ('DEMO-073', 'Metformine', '1000 mg', '08:00', FALSE),
    ('DEMO-074', 'Paracétamol', '1000 mg', '08:00', FALSE),
    ('DEMO-074', 'Simvastatine', '40 mg', '12:00', FALSE),
    ('DEMO-075', 'Simvastatine', '40 mg', '08:00', FALSE),
    ('DEMO-075', 'Amlodipine', '5 mg', '18:00', FALSE),
    ('DEMO-076', 'Amlodipine', '5 mg', '08:00', FALSE),
    ('DEMO-076', 'Gliclazide', '30 mg', '12:00', TRUE),
    ('DEMO-077', 'Gliclazide', '30 mg', '08:00', TRUE),
    ('DEMO-078', 'Tramadol', '37,5 mg', '08:00', TRUE),
    ('DEMO-078', 'Furosémide', '40 mg', '12:00', FALSE),
    ('DEMO-078', 'Warfarine', '5 mg', '18:00', TRUE),
    ('DEMO-079', 'Furosémide', '40 mg', '08:00', FALSE),
    ('DEMO-080', 'Warfarine', '5 mg', '08:00', TRUE),
    ('DEMO-080', 'Oméprazole', '20 mg', '12:00', FALSE)
) AS m(code, medication, dose, at_time, high_risk)
JOIN resident r ON r.identity_code = m.code;

-- ---------- QR codes de démonstration (table qr_code de l'équipe) : jeton « QR-DEMO-001 »... ----------
INSERT INTO qr_code (token, active, resident_id, user_id)
SELECT 'QR-' || r.identity_code, TRUE, r.id, (SELECT id FROM users WHERE username = 'admin')
FROM resident r
WHERE r.identity_code LIKE 'DEMO-%' AND r.identity_code NOT IN ('DEMO-004', 'DEMO-009');  -- ces deux résidents n'ont pas de bracelet

-- ---------- Historique des 6 jours précédents (tendance d'appétit) ----------
-- Martin (DEMO-001) et Petit (DEMO-003) mangent de moins en moins depuis 3 jours.
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT t.type, 'Repas (historique)', (CURRENT_DATE - d.n) + t.at_time, 'FAIT', r.id
FROM resident r
CROSS JOIN generate_series(1, 6) AS d(n)
CROSS JOIN (VALUES ('DEJEUNER', TIME '12:00'), ('DINER', TIME '19:00')) AS t(type, at_time)
WHERE r.identity_code LIKE 'DEMO-%';

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
WHERE r.identity_code LIKE 'DEMO-%' AND m.scheduled_at < CURRENT_DATE;

-- Vérification rapide
SELECT (SELECT COUNT(*) FROM resident WHERE identity_code LIKE 'DEMO-%') AS residents,
       (SELECT COUNT(*) FROM meal) AS repas,
       (SELECT COUNT(*) FROM medication_dose) AS prises;

-- =====================================================
-- Version 2 : fonctions, planning, puces NFC, avatars
-- =====================================================

-- Fonctions : personnel = infirmier (jour), personnel2 = aide-soignante (jour)
INSERT INTO staff_profile (user_id, job, shift)
SELECT u.id, 'INFIRMIER', 'JOUR' FROM users u WHERE u.username = 'personnel'
ON CONFLICT (user_id) DO UPDATE SET job = EXCLUDED.job, shift = EXCLUDED.shift;
INSERT INTO staff_profile (user_id, job, shift)
SELECT u.id, 'AIDE_SOIGNANT', 'JOUR' FROM users u WHERE u.username = 'personnel2'
ON CONFLICT (user_id) DO UPDATE SET job = EXCLUDED.job, shift = EXCLUDED.shift;

-- Planning type, d'après le déroulé d'une journée de service (relancer ce bloc le remet à zéro)
DELETE FROM planning_task;
INSERT INTO planning_task (job, shift, start_time, end_time, label, kind, focus) VALUES
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
    ('AIDE_SOIGNANT', 'NUIT', '06:30', '06:45', 'Transmissions à l''équipe de jour',            'TRANSMISSION', NULL);

-- Puces NFC de démonstration : le contenu de la puce est « NFC-DEMO-001 » ... « NFC-DEMO-012 »
INSERT INTO resident_nfc_tag (token, resident_id)
SELECT 'NFC-' || r.identity_code, r.id FROM resident r
WHERE r.identity_code LIKE 'DEMO-%' AND r.identity_code NOT IN ('DEMO-004', 'DEMO-009')
ON CONFLICT (token) DO NOTHING;

-- Avatars illustrés (fictifs) : fichiers du dossier frontend/public/avatars
UPDATE resident SET photo_url = '/avatars/' || lower(identity_code) || '.svg' WHERE identity_code LIKE 'DEMO-%';

-- Deuxième infirmier de démonstration (personnel3) : avec personnel, les résidents sont répartis en deux parts
INSERT INTO staff_profile (user_id, job, shift)
SELECT u.id, 'INFIRMIER', 'JOUR' FROM users u WHERE u.username = 'personnel3'
ON CONFLICT (user_id) DO UPDATE SET job = EXCLUDED.job, shift = EXCLUDED.shift;

-- Présences de démonstration : les trois soignants sont en service
DELETE FROM staff_presence;
INSERT INTO staff_presence (user_id, started_at)
SELECT u.id, NOW() FROM users u WHERE u.username IN ('personnel', 'personnel2', 'personnel3');

-- Chevalets de démonstration : 1 à 90, les 60 premiers résidents (par code) en ont déjà un, les autres sont libres
DELETE FROM chevalet;
INSERT INTO chevalet (code) SELECT g::text FROM generate_series(1, 90) AS g;
UPDATE chevalet c
SET resident_id = r.id, associated_at = NOW()
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY identity_code) AS n
      FROM resident WHERE identity_code LIKE 'DEMO-%') r
WHERE c.code = r.n::text AND r.n <= 60;

-- =====================================================
-- Version 4 : interface Service (salle à manger, tables, menu de la semaine)
-- =====================================================

-- Compte de démonstration du service en salle : service1 / Demo1234!
INSERT INTO users (username, password_hash, full_name, role) VALUES
    ('service1', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Sofia Service', 'PERSONNEL')
ON CONFLICT (username) DO NOTHING;
INSERT INTO staff_profile (user_id, job, shift)
SELECT u.id, 'SERVICE', 'JOUR' FROM users u WHERE u.username = 'service1'
ON CONFLICT (user_id) DO UPDATE SET job = EXCLUDED.job, shift = EXCLUDED.shift;
DELETE FROM staff_presence WHERE user_id = (SELECT id FROM users WHERE username = 'service1');
INSERT INTO staff_presence (user_id, started_at) SELECT id, NOW() FROM users WHERE username = 'service1';

-- Planning du service en salle
INSERT INTO planning_task (job, shift, start_time, end_time, label, kind, focus) VALUES
    ('SERVICE', 'JOUR', '11:00', '11:30', 'Mise en place des tables et des chevalets', 'REPAS', 'REPAS'),
    ('SERVICE', 'JOUR', '11:30', '13:00', 'Service du déjeuner aux tables', 'REPAS', 'REPAS'),
    ('SERVICE', 'JOUR', '13:00', '14:00', 'Débarrassage et nettoyage de la salle', 'SOINS', NULL),
    ('SERVICE', 'JOUR', '14:00', '14:30', 'Pause', 'PAUSE', NULL),
    ('SERVICE', 'JOUR', '18:00', '18:30', 'Mise en place des tables', 'REPAS', 'REPAS'),
    ('SERVICE', 'JOUR', '18:30', '19:30', 'Service du dîner aux tables', 'REPAS', 'REPAS'),
    ('SERVICE', 'JOUR', '19:30', '20:00', 'Débarrassage et nettoyage de la salle', 'SOINS', NULL);

-- Tables : 10 tables de 8 places au maximum (les résidents s'installent où ils veulent, voir table_presence)
DELETE FROM table_presence;
DELETE FROM table_reader;
DELETE FROM dining_table;
INSERT INTO dining_table (label, capacity) SELECT 'Table ' || g, 8 FROM generate_series(1, 10) AS g;

-- Menu de la semaine en cours et de la suivante (lundi = 1 ... dimanche = 7)
DELETE FROM weekly_menu;
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
    (5, 'DEJEUNER', 'Céleri rémoulade', 'Poisson pané', 'Frites', 'Mousse au chocolat'),
    (5, 'DINER',    'Velouté de champignons', 'Gratin de légumes', 'Semoule', 'Fromage blanc'),
    (6, 'DEJEUNER', 'Salade de tomates', 'Escalope de dinde', 'Ratatouille', 'Tarte aux pommes'),
    (6, 'DINER',    'Soupe de poireaux', 'Pizza au fromage', 'Salade verte', 'Compote de pommes'),
    (7, 'DEJEUNER', 'Terrine de légumes', 'Gigot d''agneau', 'Flageolets', 'Gâteau de semoule'),
    (7, 'DINER',    'Soupe vermicelle', 'Oeufs durs mayonnaise', 'Purée de carottes', 'Yaourt nature')
) AS m(day, meal, starter, main, side, dessert);

-- Les repas du jour reprennent le menu du jour, adapté à la texture de chaque résident
UPDATE meal ml
SET description = wm.main_course || ', ' || lower(wm.side) || ', ' || lower(wm.dessert)
                  || CASE d.texture WHEN 'Mixée' THEN ' (mixé)' WHEN 'Hachée' THEN ' (haché)' ELSE '' END
                  || CASE WHEN d.type ILIKE '%diab%' THEN ' - dessert sans sucre' ELSE '' END
FROM resident r
JOIN dietary_regime d ON d.resident_id = r.id
JOIN weekly_menu wm ON wm.week_start = date_trunc('week', CURRENT_DATE)::date
                   AND wm.day_of_week = EXTRACT(ISODOW FROM CURRENT_DATE)
WHERE ml.resident_id = r.id AND r.identity_code LIKE 'DEMO-%'
  AND ml.scheduled_at::date = CURRENT_DATE AND ml.type = wm.meal_type;

-- Lecteurs RFID : TR1 sur la Table 1, TR2 sur la Table 2...
INSERT INTO table_reader (code, table_id)
SELECT 'TR' || substring(label FROM 7), id FROM dining_table;

-- Présences de démonstration : 24 résidents tirés au hasard (hors ceux qui mangent en chambre) installés à des tables au hasard,
-- 8 au maximum par table. Les autres résidents ne sont pas encore arrivés.
INSERT INTO table_presence (resident_id, table_id, arrived_at)
SELECT r.id, t.id, NOW() - (random() * INTERVAL '10 minutes')
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY random()) AS n
      FROM resident WHERE identity_code LIKE 'DEMO-%' AND meal_location = 'SALLE'
      ORDER BY random() LIMIT 24) r
JOIN dining_table t ON t.label = 'Table ' || (((r.n - 1) % 4) + 1);
