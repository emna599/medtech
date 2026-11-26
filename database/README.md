# Base de données MedTech

Base **PostgreSQL** nommée `medtech`. Le backend la valide au démarrage (`ddl-auto=validate`) : il ne crée ni ne modifie les tables, tout passe par ces scripts.

## Fichiers

| Fichier | Contenu |
|---|---|
| `setup.ps1` | Script tout-en-un : crée la base et exécute les trois scripts ci-dessous |
| `setup.sql` | Enchaîne schéma, comptes de démo et données de démo |
| `medtech_schema.sql` | Création de toutes les tables et des index |
| `seed_users.sql` | 3 comptes de démonstration (admin, personnel, médecin) |
| `seed_demo.sql` | 16 chambres (3 étages) et 24 résidents fictifs |
| `seed_care.sql` | Fiches médicales, allergies, régimes, repas, distributions et QR codes fictifs |

## Mise en place (identique pour toute l'équipe)

Pour que tout le monde ait **la même base et les mêmes données**, chacun utilise le même script. En PowerShell, depuis la racine du dépôt :

```
.\database\setup.ps1
```

Le script :
1. cherche `psql` tout seul ;
2. crée la base `medtech` si elle n'existe pas ;
3. exécute `medtech_schema.sql`, `seed_users.sql`, `seed_demo.sql` puis `seed_care.sql` (via `setup.sql`).

Il demande le mot de passe PostgreSQL (jamais écrit dans un fichier) et une confirmation avant d'effacer les tables.

Si PowerShell refuse d'exécuter le script : `Set-ExecutionPolicy -Scope Process Bypass`, puis relance.

Ensuite, reporte l'URL et le mot de passe dans ton fichier `.env` (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).

### Sans le script (manuel)

```
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE medtech;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d medtech -f database\setup.sql
```

> **Attention** : `medtech_schema.sql` commence par supprimer toutes les tables (`DROP TABLE ... CASCADE`). Le relancer efface les données.

### Règle pour garder les bases identiques

Chacun a sa propre base locale : les données saisies chez toi ne sont pas visibles chez les autres. Donc :
- toute modification de structure passe par `medtech_schema.sql`, jamais à la main dans pgAdmin ;
- toute donnée de démo commune passe par `seed_demo.sql`, `seed_care.sql` ou `seed_users.sql`, puis tout le monde relance `setup.ps1` après un `git pull`.

## Numérotation des chambres

Le numéro d'une chambre est l'**étage suivi de deux chiffres (01 à 99)** : étage 1 → 101 à 199, étage 2 → 201 à 299. Les étages vont de 0 à 20. Le backend et le formulaire refusent un numéro qui ne suit pas cette règle.

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

Toutes les données sont **fictives** (noms volontairement inventés : Exemple, Maquette, Prototype...). Ne mets jamais de vraies données de résidents dans le dépôt.

`seed_demo.sql` crée :
- 16 chambres sur 3 étages (27 lits) : 101 à 106, 201 à 206 et 301 à 304 ;
- 24 résidents : 22 actifs et 2 inactifs (Henri Ancien, Roger Parti) ;
- 2 résidents actifs sans chambre, pour tester l'alerte rouge : Simone Inventee et Jeanne Attente.

`seed_care.sql` ajoute, pour les interfaces Personnel et Médecin :
- 22 fiches médicales (une par résident actif) ;
- 10 allergies, de gravité légère, modérée ou sévère ;
- 11 régimes alimentaires (sans sel, diabétique, sans gluten, haché, mixé, végétarien...) ;
- des repas : 3 par jour et par résident actif, de J-3 à J+3 autour du jour où tu lances le script ;
- les distributions : les repas passés sont servis par le compte `personnel`, sauf environ 1 sur 9, pour avoir des repas « à servir » dans la démo ;
- 23 QR codes : un actif par résident actif, et un ancien QR désactivé pour Marie Exemple (cas du renouvellement), créés par le compte `medecin`.

Résultat attendu dans le tableau de bord admin : 22 résidents actifs et 2 inactifs, 2 résidents sans chambre, 20 lits occupés sur 27 (74 %), étage 1 : 9/10, étage 2 : 7/10, étage 3 : 4/7.

Les dates des repas dépendent du jour d'exécution : relance `setup.ps1` pour recentrer les repas sur aujourd'hui.

## Outils utiles

- Se connecter en ligne de commande :
  ```
  & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d medtech
  ```
- Redémarrer le service (PowerShell administrateur) : `Restart-Service postgresql-x64-17`
