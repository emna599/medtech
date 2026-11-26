#!/bin/bash
# Charge le schéma et les jeux de données dans l'ordre, au tout premier démarrage
# du conteneur Postgres (les fichiers .sql sont montés en lecture seule dans /sql).
set -e
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /sql/setup.sql
echo "== base MedTech prête =="
