-- Compte fictif pour la recette locale uniquement.
WITH account AS (
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES ('cuisine1', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Camille Cuisine', 'PERSONNEL')
    ON CONFLICT (username) DO NOTHING RETURNING id
)
INSERT INTO staff_profile (user_id, job, shift) SELECT id, 'CUISINE', 'JOUR' FROM account;
