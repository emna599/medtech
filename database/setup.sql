-- Initialise une base locale avec le jeu de démo partagé.
-- ATTENTION : le schéma supprime et recrée les tables MedTech.
\set ON_ERROR_STOP on
BEGIN;
\ir medtech_schema.sql
\ir seed_users.sql
\ir personnel_additions.sql
\ir seed_personnel.sql
COMMIT;
