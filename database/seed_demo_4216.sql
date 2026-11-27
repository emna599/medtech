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
-- Petit-déjeuner du jour pour les résidents fictifs, sans écraser les repas déjà saisis.
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT 'PETIT_DEJEUNER', 'Petit-déjeuner en chambre', CURRENT_DATE + TIME '08:00', 'A_FAIRE', r.id
FROM resident r
WHERE r.active AND r.room_id IS NOT NULL AND r.identity_code LIKE 'DEMO-%'
  AND NOT EXISTS (
    SELECT 1 FROM meal m WHERE m.resident_id = r.id AND m.type = 'PETIT_DEJEUNER'
      AND m.scheduled_at >= CURRENT_DATE AND m.scheduled_at < CURRENT_DATE + 1
  );
-- Variante du menu Personnel V2, uniquement si le plat correspond encore au jeu initial.
UPDATE weekly_menu
SET side = 'Frites'
WHERE day_of_week = 5 AND meal_type = 'DEJEUNER'
  AND starter = 'Céleri rémoulade' AND main_course = 'Poisson pané'
  AND side = 'Épinards à la crème' AND dessert = 'Mousse au chocolat';
COMMIT;
