#!/bin/bash
# Charge le schéma et les jeux de données dans l'ordre, au tout premier démarrage
# du conteneur Postgres (les fichiers .sql sont montés en lecture seule dans /sql).
set -e
for f in medtech_schema.sql seed_users.sql personnel_additions.sql seed_personnel.sql; do
  echo "== init base : $f =="
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "/sql/$f"
done
echo "== base MedTech prête =="
