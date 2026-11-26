# MedTech EHPAD

Application web de gestion et d'identification des résidents d'un EHPAD : comptes, résidents, chambres, suivi des repas et QR codes. Projet de hackathon réalisé en équipe, avec une interface par rôle.

## Parcours

Le [guide des parcours](docs/parcours.md) couvre les trois rôles, l’affichage sur grand écran et le service en salle.

## Rôles

| Rôle | Espace | État |
|---|---|---|
| ADMIN | Comptes, résidents, chambres et étages, tableau de bord et statistiques | Fait |
| PERSONNEL | Soin et restauration : scan de QR code, repas, distribution | À faire |
| MEDECIN | Fiche médicale, allergies et régimes, QR codes | À faire |

## Technologies

- **Frontend** : Angular 22, TypeScript, Angular Material
- **Backend** : Spring Boot (Java 21), Spring Web, Data JPA, Spring Security, JWT, Maven, ZXing
- **Base de données** : PostgreSQL
- **API** : REST, authentification JWT sans état

## Structure du dépôt

```
medtech/
├── backend/     API Spring Boot (package com.esigelec.ehpad_backend)
├── frontend/    Application Angular
├── database/    Schéma SQL et jeux de données (voir database/README.md)
├── docs/        Documentation
└── .env.example Modèle des variables d'environnement
```

## Prérequis

- JDK 21
- Node.js et npm
- PostgreSQL 17 (ou version proche)

## Installation

### 1. Base de données

Même base et mêmes données pour toute l'équipe, avec un seul script (PowerShell, depuis la racine du dépôt) :

```
.\database\setup.ps1
```

Détails dans [database/README.md](database/README.md).

### 2. Variables d'environnement

Copie `.env.example` en `.env` à la racine du dépôt, puis renseigne tes valeurs :

| Variable | Rôle |
|---|---|
| `DB_URL` | URL JDBC, par exemple `jdbc:postgresql://localhost:5432/medtech` |
| `DB_USERNAME` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Secret de signature, 32 caractères minimum |
| `JWT_EXPIRATION_MINUTES` | Durée de validité du jeton |
| `CORS_ALLOWED_ORIGINS` | Origine du frontend, `http://localhost:4200` en local |

Le fichier `.env` ne doit jamais être poussé sur GitHub (il est déjà ignoré).

### 3. Backend

PowerShell :

```
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
.\mvnw spring-boot:run
```

L'API écoute sur http://localhost:8080. Adapte le chemin de `JAVA_HOME` à ton installation.

### 4. Frontend

```
cd frontend
npm install
npx ng serve
```

L'application est disponible sur http://localhost:4200.

## Comptes de démonstration

Comptes fictifs créés par `database/seed_users.sql`, mot de passe `Demo1234!` :

| Identifiant | Rôle |
|---|---|
| `admin` | ADMIN |
| `personnel` | PERSONNEL |
| `medecin` | MEDECIN |

À supprimer ou à changer avant tout usage réel.

## API

Toutes les routes, sauf la connexion, demandent un jeton : `Authorization: Bearer <token>`.

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion, renvoie le jeton |
| GET | `/api/admin/dashboard` | Statistiques globales |
| GET, POST | `/api/admin/users` | Liste et création des comptes |
| GET, PUT | `/api/admin/users/{id}` | Détail et modification d'un compte |
| PUT | `/api/admin/users/{id}/password` | Réinitialisation du mot de passe |
| GET, POST | `/api/admin/rooms` | Liste et création des chambres |
| PUT, DELETE | `/api/admin/rooms/{id}` | Modification et suppression d'une chambre |
| GET | `/api/admin/residents` | Liste, filtres `search`, `active`, `roomId` |
| POST | `/api/admin/residents` | Création d'un résident |
| GET, PUT | `/api/admin/residents/{id}` | Détail et modification d'un résident |

Les routes `/api/admin/**` sont réservées au rôle ADMIN.

## Règles de gestion (admin)

- Un compte ou un résident n'est jamais supprimé : on le désactive.
- Un administrateur ne peut pas se désactiver lui-même ni retirer son propre rôle ADMIN.
- Il doit toujours rester au moins un administrateur actif.
- La capacité d'une chambre ne peut pas passer sous le nombre de résidents actifs qu'elle contient.
- Une chambre qui contient des résidents actifs ne peut pas être supprimée.
- Un résident ne peut pas être affecté à une chambre pleine (seuls les résidents actifs comptent).
- La date d'admission ne peut pas précéder la date de naissance.
- Le numéro de chambre est l'étage suivi de deux chiffres (étage 2 : 201 à 299).
- Un résident actif sans chambre est signalé en rouge dans l'interface.

## Branches

- `main` : version stable
- `feature/<nom>` : une branche par fonctionnalité, fusionnée dans `main` par pull request

## Tests rapides de l'API (PowerShell)

```
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login -ContentType "application/json" -Body '{"username":"admin","password":"Demo1234!"}'
$h = @{ Authorization = "Bearer $($r.token)" }
Invoke-RestMethod -Uri http://localhost:8080/api/admin/dashboard -Headers $h
```


## Exposition publique

Le Compose du dépôt est destiné à la démonstration locale avec des données fictives. Les ports 4200 et 8080 sont publiés sur la boucle locale. Une mise en ligne nécessite un environnement dédié sans comptes de démonstration, des secrets uniques, un accès HTTPS et des origines CORS explicites. Configurer la politique CSP avec les origines réelles du site et de l’API. Si un proxy est utilisé, définir puis tester les adresses clientes de confiance ou limiter les tentatives à la passerelle en complément du quota applicatif. La gestion des données réelles et les procédures d’exploitation restent à valider avant ouverture.
