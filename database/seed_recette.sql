-- Recette locale avec données fictives. À exécuter dans une transaction.
SELECT pg_advisory_xact_lock(hashtext('medtech_seed_recette'));

\ir seed_service.sql

-- Un repas neuf par créneau pour les seuls résidents identifiés comme fictifs.
INSERT INTO meal (type, description, scheduled_at, status, resident_id)
SELECT slot.kind, 'Menu de recette', CURRENT_DATE + slot.at, 'A_FAIRE', r.id
FROM resident r
CROSS JOIN (VALUES ('DEJEUNER', TIME '12:00'), ('DINER', TIME '19:00')) AS slot(kind, at)
WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$' AND r.active
  AND NOT EXISTS (
      SELECT 1 FROM meal m WHERE m.resident_id = r.id
        AND m.type = slot.kind AND m.scheduled_at::date = CURRENT_DATE
  );

-- Reprend les prises fictives historiques sans copier leur état ni leur validation.
WITH examples AS (
    SELECT DISTINCT ON (d.resident_id, d.medication, d.scheduled_at::time)
           d.resident_id, d.medication, d.dose, d.scheduled_at::time AS at, d.high_risk
    FROM medication_dose d JOIN resident r ON r.id = d.resident_id
    WHERE r.identity_code ~ '^DEMO-0(0[1-9]|1[0-2])$' AND r.active
      AND d.scheduled_at < CURRENT_DATE
    ORDER BY d.resident_id, d.medication, d.scheduled_at::time, d.scheduled_at DESC, d.id DESC
)
INSERT INTO medication_dose (resident_id, medication, dose, scheduled_at, high_risk, status)
SELECT e.resident_id, e.medication, e.dose, CURRENT_DATE + e.at, e.high_risk, 'A_FAIRE'
FROM examples e
WHERE NOT EXISTS (
    SELECT 1 FROM medication_dose d WHERE d.resident_id = e.resident_id
      AND d.medication = e.medication AND d.scheduled_at = CURRENT_DATE + e.at
);

WITH account AS (
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES ('personnel_nuit', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Noa Infirmier de nuit', 'PERSONNEL')
    ON CONFLICT (username) DO NOTHING RETURNING id
)
INSERT INTO staff_profile (user_id, job, shift) SELECT id, 'INFIRMIER', 'NUIT' FROM account;

-- Créneau de nuit à publier, avec deux dates pour la vérification du changement de jour.
INSERT INTO staff_assignment (user_id, floor, starts_at, ends_at, published_at)
SELECT u.id, f.floor,
       (CURRENT_DATE + TIME '21:00') AT TIME ZONE 'Europe/Paris',
       (CURRENT_DATE + 1 + TIME '07:00') AT TIME ZONE 'Europe/Paris', NULL
FROM users u JOIN staff_profile p ON p.user_id = u.id
CROSS JOIN (SELECT min(floor) AS floor FROM room) f
WHERE u.username = 'personnel_nuit' AND p.job = 'INFIRMIER' AND p.shift = 'NUIT' AND f.floor IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM staff_assignment a WHERE a.user_id = u.id
        AND a.starts_at = (CURRENT_DATE + TIME '21:00') AT TIME ZONE 'Europe/Paris'
  );

INSERT INTO handover_action (created_by, request_id, observation, expected_action, target_shift)
SELECT id, '763106a1-4aad-4d0d-a44f-c183ccd939ff',
       'Exercice fictif : le point de situation a été préparé.',
       'Ouvrir la transmission, la prendre en charge puis la clôturer.', 'NUIT'
FROM users WHERE username = 'personnel2' AND role = 'PERSONNEL'
ON CONFLICT (created_by, request_id) DO NOTHING;
