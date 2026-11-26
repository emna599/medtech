-- =====================================================
-- MedTech - mise en place COMPLÈTE de la base (identique pour toute l'équipe)
-- Exécute dans l'ordre : schéma, comptes de démo, chambres et résidents, données de soin.
-- Usage (depuis la racine du dépôt) :
--   psql -U postgres -d medtech -f database/setup.sql
-- ATTENTION : supprime et recrée toutes les tables.
-- =====================================================
\set ON_ERROR_STOP on
\ir medtech_schema.sql
\ir seed_users.sql
\ir seed_demo.sql
\ir seed_care.sql
