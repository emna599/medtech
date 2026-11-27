-- Aperçu fictif. Ce script ne vise que les résidents identifiés par les codes de démo exacts.
SELECT pg_advisory_xact_lock(hashtext('medtech_seed_apercu'));

\ir seed_care.sql

CREATE TEMP TABLE medtech_apercu_cases ON COMMIT DROP AS
SELECT r.id, v.*
FROM (VALUES
    ('DEMO-ADMIN-01', 'Dernière consultation de démonstration : dossier transmis avec l’admission.',
     'Document de démonstration consulté. Vérification fictive avec le dossier de référence.',
     'Sans sel', 'Normale', 'Éviter les préparations contenant du sel ajouté.',
     'Lactose', 'Plateau identifié avant le service. Présenter les plats séparément.',
     'Lait', 'Modérée', 'Préfère déjeuner près de la fenêtre et boire de l’eau à température ambiante.',
     66.40, 'Exercice fictif : a participé à la promenade du matin.'),
    ('DEMO-ADMIN-03', 'Historique fictif : compte rendu d’admission disponible.',
     'Suivi fictif consigné dans le dossier de démonstration.',
     'Sans gluten', 'Normale', 'Vérifier les ingrédients du plateau réservé.',
     'Gluten', 'Utiliser le repère de chambre indiqué sur le plateau.',
     'Arachides', 'Sévère', 'Préfère une petite table à l’écart du passage.',
     61.75, 'Exercice fictif : repas pris en chambre.'),
    ('DEMO-ADMIN-05', 'Historique fictif : ancien changement de texture mentionné à l’admission.',
     'Consignes alimentaires documentées dans le dossier fictif.',
     'Normal', 'Mixée', 'Vérifier la texture indiquée dans la fiche.',
     'Lactose', 'Confirmer l’identité et la consigne avant de présenter le plateau.',
     'Noisettes', 'Modérée', 'Préfère une présentation en petits récipients.',
     73.10, 'Exercice fictif : a demandé que les plats soient présentés séparément.'),
    ('DEMO-ADMIN-09', 'Historique fictif : changement de chambre noté au dossier.',
     'Point de suivi fictif disponible dans le dossier de démonstration.',
     'Végétarien', 'Normale', 'Plateau sans viande ni poisson.',
     'Œufs', 'Vérifier les ingrédients du dessert avec le menu.',
     'Sésame', 'Légère', 'Préfère déjeuner avec un petit groupe.',
     57.80, 'Exercice fictif : a participé à l’activité de lecture.')
) AS v(code, history, treatments, diet, texture, restrictions, intolerances, instructions,
       allergy, severity, preference, weight, observation)
JOIN resident r ON r.identity_code = v.code AND r.active;

INSERT INTO medical_record (resident_id, history, treatments)
SELECT id, history, treatments FROM medtech_apercu_cases
ON CONFLICT (resident_id) DO UPDATE SET
    history = COALESCE(NULLIF(BTRIM(medical_record.history), ''), excluded.history),
    treatments = COALESCE(NULLIF(BTRIM(medical_record.treatments), ''), excluded.treatments),
    version = medical_record.version + 1,
    updated_at = LOCALTIMESTAMP
WHERE NULLIF(BTRIM(medical_record.history), '') IS NULL
   OR NULLIF(BTRIM(medical_record.treatments), '') IS NULL;

INSERT INTO dietary_regime (resident_id, type, texture, restrictions, intolerances, instructions)
SELECT c.id, c.diet, c.texture, c.restrictions, c.intolerances, c.instructions
FROM medtech_apercu_cases c
WHERE NOT EXISTS (SELECT 1 FROM dietary_regime d WHERE d.resident_id = c.id);

-- Complète uniquement un régime existant sans ambiguïté, en conservant les consignes renseignées.
UPDATE dietary_regime d
SET texture = COALESCE(NULLIF(BTRIM(d.texture), ''), c.texture),
    restrictions = COALESCE(NULLIF(BTRIM(d.restrictions), ''), c.restrictions),
    intolerances = COALESCE(NULLIF(BTRIM(d.intolerances), ''), c.intolerances),
    instructions = COALESCE(NULLIF(BTRIM(d.instructions), ''), c.instructions),
    version = d.version + 1
FROM medtech_apercu_cases c
WHERE d.resident_id = c.id
  AND (SELECT count(*) FROM dietary_regime other WHERE other.resident_id = c.id) = 1
  AND (NULLIF(BTRIM(d.texture), '') IS NULL OR NULLIF(BTRIM(d.restrictions), '') IS NULL
       OR NULLIF(BTRIM(d.intolerances), '') IS NULL OR NULLIF(BTRIM(d.instructions), '') IS NULL);

INSERT INTO allergy (resident_id, name, severity)
SELECT c.id, c.allergy, c.severity FROM medtech_apercu_cases c
WHERE NOT EXISTS (
    SELECT 1 FROM allergy a WHERE a.resident_id = c.id AND LOWER(a.name) = LOWER(c.allergy)
);

INSERT INTO resident_daily_preferences (resident_id, preferences, version)
SELECT id, preference, 1 FROM medtech_apercu_cases
ON CONFLICT (resident_id) DO NOTHING;

INSERT INTO resident_daily_entry (resident_id, author_id, request_id, recorded_at, weight_kg, observation)
SELECT c.id, u.id, md5('medtech-apercu-' || c.code || '-' || sample.days)::uuid,
       CURRENT_DATE - sample.days + TIME '09:00',
       c.weight + sample.weight_delta,
       CASE WHEN sample.days = 0 THEN c.observation ELSE 'Exercice fictif : relevé de comparaison.' END
FROM medtech_apercu_cases c
CROSS JOIN (VALUES (0, 0.00), (2, 0.10), (5, 0.35)) AS sample(days, weight_delta)
JOIN users u ON u.username = 'personnel2' AND u.role = 'PERSONNEL'
ON CONFLICT (author_id, request_id) DO NOTHING;

INSERT INTO staff_note (content, category, user_id, resident_id)
SELECT 'Exercice fictif : préférences et plateau vérifiés avec la fiche.', 'OBSERVATION', u.id, c.id
FROM medtech_apercu_cases c
JOIN users u ON u.username = 'personnel2' AND u.role = 'PERSONNEL'
WHERE NOT EXISTS (
    SELECT 1 FROM staff_note n WHERE n.user_id = u.id AND n.resident_id = c.id
      AND n.content = 'Exercice fictif : préférences et plateau vérifiés avec la fiche.'
);
