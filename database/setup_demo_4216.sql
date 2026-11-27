-- Première initialisation du volume fictif réservé à la démo 4216.
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
\ir personnel_service.sql
\ir chevalet.sql
\ir resident_photo.sql
\ir care_completion.sql
\ir tour_updates.sql
\ir staff_assignments.sql
\ir kitchen.sql
\ir rfid_badges.sql
\ir seed_personnel_v2_original.sql
COMMIT;
