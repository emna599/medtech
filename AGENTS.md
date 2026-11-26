# AGENTS.md — contexte projet pour les assistants IA (Codex, Claude, etc.)

> **À lire en PREMIER, avant toute action.** Puis lire **[`JOURNAL.md`](JOURNAL.md)** :
> c'est le **journal vivant** du projet (ce qui a été fait, les décisions, ce qui reste).
> Ce dépôt est la **source de vérité partagée** entre tous les humains et tous les modèles.

## Le projet
Plateforme de gestion d'un EHPAD, interface par rôle (ADMIN / PERSONNEL / MEDECIN).
- **Backend** : Spring Boot 4.2 (Java 21), Spring Security + JWT, Spring Data JPA, ZXing. Package `com.esigelec.ehpad_backend`.
- **Frontend** : Angular 22 (standalone, signals), Angular Material.
- **Base** : PostgreSQL (schéma + données de démo versionnés dans `database/`).

## Démarrer (une seule commande)
```
docker compose up --build
```
→ Interface http://localhost:4200 · API http://localhost:8080
Comptes de démo (mot de passe `Demo1234!`) : `admin`, `personnel`, `medecin`.
Détail (et lancement manuel) : voir `JOURNAL.md` § « Lancement du projet ».

## Branches — IMPORTANT
- **`integration`** = branche de travail active : l'application **complète** (admin + personnel + medecin fusionnés). **Travailler ici.**
- `main` : authentification seule. **Ne jamais pousser directement sur `main`, ne jamais force-push.** La fusion vers `main` se fait par **pull request**, après revue d'équipe.
- `feature/*` : modules d'origine de chaque coéquipier·ère (référence).

## Base de données : LA MÊME pour tout le monde
La base est **définie par le code** : les scripts SQL de `database/` (schéma + données de démo).
Avec Docker, ils sont **chargés automatiquement** au premier démarrage → **tout le monde obtient une base identique**.
- **Règle d'or** : ne **jamais** modifier la base à la main (pgAdmin, SQL direct). Toute évolution du schéma ou des données passe par un **fichier `.sql` committé** dans `database/`.
- Repartir d'une base propre et identique : `docker compose down -v` puis `docker compose up`.
- `ddl-auto=validate` : le backend refuse de démarrer si une entité ne correspond pas au schéma → garde-fou contre les désynchronisations.

## Conventions
- Sécurité par rôle : `/api/admin/**` → ADMIN ; `/api/personnel/**` → PERSONNEL/ADMIN ; dossier médical → MEDECIN. **Ne pas retirer ces règles en fusionnant.**
- Un `ResidentService` par domaine : `AdminResidentService`, `MedicalResidentService`, `ResidentService` (personnel). Ne pas les refusionner par mégarde.
- Les entités partagent les tables `database/medtech_schema.sql` (+ `personnel_additions.sql`). Nom de table au **singulier**.

## Protocole de relais entre sessions / modèles (contexte « temps réel »)
Il n'y a pas de mémoire magique commune : **le dépôt Git EST la mémoire partagée.** Donc, à chaque session (quel que soit le modèle ou l'humain) :
1. **Au début** : `git pull` sur `integration`, puis lire `AGENTS.md` + `JOURNAL.md`.
2. **Pendant** : faire le travail sur `integration` (ou une `feature/*`).
3. **À la fin** : **mettre à jour `JOURNAL.md`** (ce qui a été fait, décisions, ce qui reste), puis `git commit` + `git push`.
Ainsi le modèle suivant (Codex, Claude…) démarre avec **tout le contexte à jour**.

> Codex lit automatiquement ce fichier `AGENTS.md`. Claude Code lit `CLAUDE.md` (qui pointe ici).
