-- Affectations fictives du jour. Le jeu de démonstration peut être relancé le lendemain.
INSERT INTO staff_assignment (user_id, floor, starts_at, ends_at)
SELECT u.id, sectors.floor, CURRENT_DATE, CURRENT_DATE + 1
FROM users u
LEFT JOIN staff_profile p ON p.user_id = u.id
CROSS JOIN (SELECT DISTINCT floor FROM room) sectors
WHERE u.username IN ('personnel', 'personnel2', 'personnel3')
  AND u.role = 'PERSONNEL' AND u.enabled
  AND COALESCE(p.job, 'AIDE_SOIGNANT') IN ('INFIRMIER', 'AIDE_SOIGNANT')
  AND NOT EXISTS (
      SELECT 1 FROM staff_assignment a
      WHERE a.user_id = u.id AND a.floor = sectors.floor AND a.starts_at = CURRENT_DATE
  );
