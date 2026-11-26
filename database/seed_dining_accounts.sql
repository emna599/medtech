-- Comptes fictifs supplémentaires. À charger uniquement sur une base de démonstration.
WITH new_users AS (
    INSERT INTO users (username, password_hash, full_name, role) VALUES
        ('service1', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Sofia Service', 'PERSONNEL'),
        ('personnel3', '$2a$10$imHcs1FjvykvJFGeoljrRuAgqU27ZUtsFG2XOxqLGgK/kqrkdvR2y', 'Hugo Infirmier', 'PERSONNEL')
    ON CONFLICT (username) DO NOTHING
    RETURNING id, username
)
INSERT INTO staff_profile (user_id, job, shift)
SELECT id, CASE username WHEN 'service1' THEN 'SERVICE' ELSE 'INFIRMIER' END, 'JOUR'
FROM new_users;
