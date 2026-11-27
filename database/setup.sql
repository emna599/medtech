-- Initialise une base locale avec le jeu de démo partagé.
-- ATTENTION : le schéma supprime et recrée les tables MedTech.
\set ON_ERROR_STOP on
BEGIN;
\ir medtech_schema.sql
\ir seed_users.sql
\ir personnel_additions.sql
\ir security_and_concurrency.sql
\ir handover.sql
\ir handover_assignment.sql
\ir resident_daily.sql
\ir medical_record_version.sql
\ir seed_personnel.sql
\ir seed_care.sql
\ir personnel_service.sql
\ir chevalet.sql
\ir resident_photo.sql
\ir care_completion.sql
\ir tour_updates.sql
\ir seed_dining_accounts.sql
\ir staff_assignments.sql
\ir kitchen.sql
\ir seed_kitchen.sql
\ir seed_recette.sql
\ir seed_staff_assignments.sql
COMMIT;
