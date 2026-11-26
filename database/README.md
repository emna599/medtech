# Base de données MedTech

Base **PostgreSQL** nommée `medtech`. Le backend la valide au démarrage (`ddl-auto=validate`) : il ne crée ni ne modifie les tables, tout passe par ces scripts.

## Initialisation locale

Docker exécute `database/setup.sql` à la création du volume. Le script enchaîne dans une même transaction le schéma, les comptes, les extensions du personnel et les données communes (12 résidents fictifs).

Sans Docker, exécuter `./database/setup.ps1` sous PowerShell ou `psql -U postgres -d medtech -f database/setup.sql` sur une base locale créée au préalable. Le script PowerShell demande confirmation et utilise PostgreSQL sur localhost.

**Attention** : l’initialisation supprime les tables MedTech de la base cible et efface les données qu’elles contiennent. Les évolutions du schéma et des données de démo passent par les fichiers SQL versionnés.

### Mise à jour d’une base existante

`docker compose up --build` exécute automatiquement `security_and_concurrency.sql`, `handover.sql` `resident_daily.sql` `handover_assignment.sql` et `medical_record_version.sql` avant de démarrer l’API. Pour une installation manuelle existante, appliquer ce fichier avec `psql -v ON_ERROR_STOP=1 -d medtech -f database/security_and_concurrency.sql -f database/handover.sql -f database/resident_daily.sql -f database/handover_assignment.sql -f database/medical_record_version.sql` avant de relancer le backend. Ces scripts conservent les données et peuvent être exécutés plusieurs fois. La commande d’initialisation complète reste réservée à une nouvelle base ou à une réinitialisation voulue.

## Numérotation des chambres

Tout nouveau numéro est composé de l’étage (0 à 20) suivi de deux chiffres (01 à 99). Les anciens numéros sont conservés et peuvent être édités sans les renuméroter si le numéro et l’étage restent identiques.

## Modèle de données

```
users ──┬── meal_distribution ── meal ── resident ──┬── room
        ├── qr_code ─────────────────────────────────┤
        └── audit_log                                ├── medical_record (1-1)
                                                     ├── allergy
                                                     └── dietary_regime
```

### Tables

| Table | Rôle | Colonnes principales |
|---|---|---|
| `users` | Comptes de l'application (nom réservé, d'où « users ») | `username` unique, `password_hash` (BCrypt), `full_name`, `role` (ADMIN, PERSONNEL ou MEDECIN), `enabled`, `created_at` |
| `room` | Chambres | `number` unique, `floor`, `capacity` (> 0) |
| `resident` | Résidents | `first_name`, `last_name`, `birth_date`, `admission_date`, `active`, `room_id` |
| `medical_record` | Fiche médicale, une par résident | `history`, `treatments`, `updated_at`, `resident_id` unique |
| `allergy` | Allergies d'un résident | `name`, `severity`, `resident_id` |
| `dietary_regime` | Régimes alimentaires | `type`, `restrictions`, `intolerances`, `instructions`, `resident_id` |
| `meal` | Repas prévus | `type`, `description`, `scheduled_at`, `resident_id` |
| `meal_distribution` | Distribution d'un repas, au plus une par repas | `served_at`, `comment`, `meal_id` unique, `user_id` |
| `qr_code` | QR codes d'identification | `token` unique, `active`, `created_at`, `deactivated_at`, `resident_id`, `user_id` |
| `audit_log` | Journal des actions | `action`, `entity_type`, `entity_id`, `created_at`, `user_id` |

### Comportement à la suppression

- Supprimer un **résident** supprime en cascade sa fiche médicale, ses allergies, ses régimes, ses repas et ses QR codes. En pratique l'application désactive les résidents au lieu de les supprimer.
- Supprimer une **chambre** met `room_id` à `NULL` chez ses résidents (le backend l'interdit s'il reste des résidents actifs).
- Supprimer un **utilisateur** met `user_id` à `NULL` dans `qr_code` et `audit_log`. Il est refusé s'il a servi un repas (`meal_distribution`).

### Index

Sur `resident(room_id)`, `allergy(resident_id)`, `dietary_regime(resident_id)`, `meal(resident_id)`, `meal(scheduled_at)`, `qr_code(resident_id)`, `audit_log(user_id)` et `audit_log(created_at)`.

## Données de démonstration

Le jeu commun de `seed_personnel.sql` contient 12 résidents fictifs, des chambres, ainsi que les repas, prises et codes QR de démo. `seed_demo.sql` est l’ancien jeu limité à l’administration.

Toutes ces données sont fictives. Ne mets jamais de vraies données de résidents dans le dépôt.

## Outils utiles

- Se connecter en ligne de commande :
  ```
  & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d medtech
  ```
- Redémarrer le service (PowerShell administrateur) : `Restart-Service postgresql-x64-17`
