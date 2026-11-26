# Journal de travail — MedTech EHPAD

> Journal des travaux réalisés sur le projet (intégration, corrections, design, analyse).
> Tenu à jour au fil des sessions. Branche de travail : `integration`.

---

## Session du 2026-11-26

### 1. Analyse du dépôt
- Cloné `emna599/medtech`. Stack : **Spring Boot 4.2 (Java 21) + Angular 22 + PostgreSQL**, auth **JWT**, Angular Material.
- Domaine : plateforme de gestion d'EHPAD (résidents, chambres, dossiers médicaux, repas, médicaments, QR codes, audit).
- **Constat clé** : `main` ne contient que l'authentification ; tout le travail réel vit sur des branches **non fusionnées** :
  - `feature/admin-users` (Emna) — comptes, résidents, chambres, dashboard. **~90 %**.
  - `feature/personnel` (Dorra + Emna) — soin, repas, médicaments, scan QR, assistant, OCR. **~85 %**, la plus aboutie, seule avec des tests.
  - `feature/medecin` (zheng) — API résidents + dossier médical en **lecture seule**, **aucune interface**. **~15 %**.

### 2. Audit de sécurité
- **JWT** : solide (secret contrôlé ≥32 car., rôle rechargé depuis la base à chaque requête, compte désactivé refusé immédiatement). Faiblesses : pas de révocation (token valable 60 min après logout), **pas de rate-limit sur le login** (brute-force).
- **XSS** : aucun vecteur (pas d'`innerHTML`/`bypassSecurity`). Angular échappe par défaut. Token en `sessionStorage`.
- **CSRF** : `csrf().disable()` correct ici (JWT en header, pas de cookie).
- **Injection SQL** : aucune (JPQL + paramètres nommés partout).
- **En-têtes** : `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Cache-Control` présents. Manquent CSP + HSTS.
- **Contrôle d'accès** (testé) : sans token → 401, mauvais rôle → 403, bon rôle → 200.
- **Secrets** : `.env` ignoré, `.env.example` sans vrai secret, pas d'actuator exposé.

### 3. Intégration des 3 branches → branche `integration`
- Fusion `admin` (propre), puis `medecin` et `personnel` (conflits résolus) :
  - `Resident` = version personnel (sur-ensemble : +photo, signes distinctifs, emplacement repas, code d'identité).
  - Les 3 `ResidentService` homonymes → renommés **`AdminResidentService`** / **`MedicalResidentService`** / `ResidentService` (personnel).
  - `ResidentRepository` et `ResidentMapper` = **union** des 3 modules.
  - `SecurityConfig` = règles combinées (`/api/admin/**`→ADMIN, `/api/personnel/**`→PERSONNEL+ADMIN, medecin via `@PreAuthorize`).
  - `styles.scss` fusionné.
- **Bug trouvé par `ddl-validate`** : l'entité `MedicalRecord` pointait sur `medical_records` (pluriel) alors que le schéma a `medical_record` (singulier) → corrigé.
- **Vérifications (tout vert)** : backend compile + démarre, **23 tests passent**, frontend build, les **3 rôles** tournent sur une seule app, données unifiées, contrôle d'accès 401/403/200 OK.

### 4. Refonte de l'interface
- 1re version « premium » (inspirée Cazam) : rejetée par le user → faisait « trop IA » (dégradés, blobs, serif, pastilles arrondies, corail).
- **Version SOBRE retenue** : à plat, palette neutre (gris froids) + **un seul accent teal discret**, zéro dégradé, typo **Inter** (plus de serif), rayons réduits (6–8px), bordures fines, ombres minimales. Login à plat (panneau uni), build prod OK.

### 5. Analyse de la logique métier EHPAD
Points relevés (sécurité du soin, modèle manquant, améliorations). Correction en cours — voir §6.

### 6. Corrections de logique métier
- **Doute d'identité (#2)** : vérifié dans le code — **déjà bloquant** (`completeMeal`/`completeDose` refusent un statut FAIT si doute non résolu). Mon analyse initiale était erronée : rien à corriger ici.
- **Allergènes / texture / médicament à risque (#1) — CORRIGÉ** :
  - Backend (`CareService`) : `completeMeal` refuse (HTTP 409) de valider « servi » pour un résident **allergique** ou à **texture adaptée** (Hachée/Mixée) tant que le soignant n'a pas **confirmé** (`acknowledgeRisk`). Idem `completeDose` pour un **médicament à risque**. La confirmation est **tracée dans l'audit** (`REPAS_RISQUE_CONFIRME` / `PRISE_RISQUE_CONFIRME`).
  - Frontend (fiche résident) : clic « Servi » → **dialogue de confirmation** listant allergies/texture avant validation.
  - Vérifié de bout en bout : sans confirmation → 409 (« Vérifiez le plateau… ») ; avec confirmation → 200 ; dialogue affiché dans l'UI.
  - Backend compile, **23 tests passent**, frontend build OK.
- Restent en *analyse* (features, pas encore faites) : GIR/AGGIR (#4), entité Prescription (#3), rôles IDE/aide-soignant (#5), motif+date de sortie (#6), alerte dénutrition (#7), relève persistée (#9).

### Push
- 1re tentative : 403 (droits d'écriture manquants).
- **Résolu** : le compte est collaborateur du dépôt → `integration` **poussée sur `emna599/medtech`** (branche séparée, `main` non touchée).
- PR possible : https://github.com/emna599/medtech/pull/new/integration (non créée pour l'instant).

### Contenu de la branche `integration` (8 commits au-dessus de `main`)
1. Intégration des 3 modules (admin + medecin + personnel), collisions résolues.
2. `fix(medecin)` : table `medical_record` (singulier).
3. `refactor(ui)` : design sobre (neutre, à plat, Inter).
4. `feat(soin)` : confirmation obligatoire avant de servir un repas/médicament à risque + `JOURNAL.md`.

---

## Lancement du projet

### Option 1 — Docker, une seule commande (recommandé pour l'équipe)
Prérequis : Docker Desktop. Depuis la racine du dépôt :

```
docker compose up --build
```

Cela construit et démarre **tout** : PostgreSQL (schéma + données de démo chargés automatiquement), le backend Spring Boot et le frontend Angular.
- Interface : http://localhost:4200
- API : http://localhost:8080
- Comptes de démo (mot de passe **Demo1234!**) : `admin`, `personnel`, `medecin`.

Arrêter : `Ctrl+C` puis `docker compose down` (ajouter `-v` pour effacer aussi les données et repartir d'une base neuve).

> **Testé le 2026-11-26** : `docker compose up --build` construit les images et démarre DB + backend + frontend ; base initialisée (12 résidents), les 3 comptes se connectent (HTTP 200), app servie sur http://localhost:4200. ✅

### Option 2 — Manuel (développement)
1. Base : créer une base `medtech` puis exécuter dans l'ordre `database/medtech_schema.sql`, `seed_users.sql`, `personnel_additions.sql`, `seed_personnel.sql`.
2. Copier `.env.example` → `.env` (à la racine) et renseigner les valeurs.
3. Backend : `cd backend && ./mvnw spring-boot:run` (JDK 21).
4. Frontend : `cd frontend && npm install && npx ng serve`.

### Quelle branche tester ?
- **`integration`** : l'application **complète** (les 3 modules fusionnés). **C'est la branche à tester.**
- `main` : authentification seule.
- `feature/admin-users` / `feature/personnel` / `feature/medecin` : un module isolé (utile pour comparer au travail d'origine d'un·e coéquipier·ère).

---

## Guide de test par rôle (A → Z)

> Objectif : dérouler chaque rôle et cocher chaque fonctionnalité pour repérer un éventuel problème.

### 👑 ADMINISTRATEUR (`admin` / Demo1234!)
1. **Connexion** → on arrive sur le *Tableau de bord*.
2. **Tableau de bord** : vérifier les tuiles (résidents actifs, lits occupés, taux d'occupation, comptes par rôle, dernières admissions) et l'alerte « résident(s) sans chambre ».
3. **Résidents** : liste, recherche par nom, filtre d'état (Actifs / Tous), pagination (10/page). Ouvrir une fiche (clic sur une ligne).
4. **Créer un résident** (« Nouveau résident ») : nom, dates, chambre. Vérifier les garde-fous :
   - date d'admission **antérieure** à la naissance → refus ;
   - affecter à une chambre **déjà pleine** (capacité atteinte) → refus.
5. **Modifier / désactiver** un résident.
6. **Chambres et étages** : liste, créer/modifier une chambre (numéro, étage, capacité).
7. **Comptes** : créer un compte (identifiant, rôle, mot de passe), modifier le rôle, réinitialiser le mot de passe, désactiver. Garde-fous à vérifier :
   - **se désactiver soi-même** ou retirer son propre rôle admin → refus ;
   - retirer le **dernier administrateur actif** → refus ;
   - **identifiant déjà pris** → refus.
8. **Déconnexion**.
- À surveiller : liste/tri/pagination se font côté client (volume EHPAD faible, assumé).

### 🩺 MÉDECIN (`medecin` / Demo1234!)
1. **Connexion** → *Espace médecin*.
2. ⚠️ **L'interface médecin est un placeholder** (le module n'a pas encore d'écrans). À tester donc surtout via l'API :
   - `GET /api/residents` (liste), `GET /api/residents/{id}` (détail),
   - `GET /api/residents/{id}/medical-record` (dossier — réservé MEDECIN).
   - Contrôle d'accès : avec un jeton `personnel`, le dossier médical renvoie **403**.
3. **Déconnexion**.
- À faire ensuite (backlog) : écrire l'interface médecin + l'écriture du dossier, allergies/régimes, QR codes.

### 🧑‍⚕️ PERSONNEL / SOIGNANT (`personnel` / Demo1234!)
1. **Connexion** → *Espace personnel*, onglet **Repas**.
2. Parcourir : créneau **Déjeuner / Dîner**, filtres **Salle à manger / Chambres**, **À faire / Faits / Tous**, recherche.
3. **Ouvrir une fiche** (clic sur une carte) : identité, signes distinctifs, **courbe d'appétit 7 jours**, repas du créneau, régime / texture / à éviter, consignes.
4. **Servir un repas** :
   - résident **sans** allergie → « Servi » direct ;
   - résident **avec** allergie/texture (ex. **Lucien ROUX · Arachides · Hachée**) → « Servi » ouvre un **dialogue de confirmation** (vérifier le plateau) ; tester *Annuler* puis *J'ai vérifié, valider* ;
   - **Refusé** → le **motif** est obligatoire ;
   - **Plus tard** ;
   - après « servi », saisir la **quantité mangée**.
5. **Doute d'identité** : « J'ai un doute sur l'identité » → signaler. Essayer de servir → **bloqué** tant que le doute n'est pas levé. Lever le doute (⚠️ un **autre** soignant doit le faire : le backend refuse la même personne).
6. **« Je ne le connais pas »** : identification par code bracelet / scan QR / photo de pochette (OCR).
7. Onglet **Médicaments** : tournée **Matin / Midi / Soir**, « Démarrer la tournée », donner une prise ; un **médicament à risque** demande une **confirmation**.
8. **Résidents** (annuaire), **Relève** (passation d'équipe, résumé à copier), **Assistant** (ex. « qui reste à servir ? »).
9. **Thème sombre** (bouton lune), **Déconnexion**.
- À surveiller : le **scan QR** nécessite une caméra ; l'**OCR pochette** nécessite le service Flask externe (absent → message « indisponible », c'est normal).

### 🔒 Contrôles de sécurité (rapides)
- Non connecté, aller sur `/admin` → redirigé vers `/login`.
- Connecté `personnel`, forcer l'URL `/admin` → redirigé (guard) ; et l'API `/api/admin/**` renvoie **403**.
- Jeton invalide/expiré → déconnexion automatique.

---

## À venir
- **Ré-intégration du travail d'un·e coéquipier·ère** (mises à jour en cours) : en fin de journée, une fois stabilisé, relire ses fichiers modifiés, les intégrer à `integration`, avec une passe **logique métier** + **sécurité** (JWT, CSRF, XSS, injection, contrôle d'accès par rôle au merge).
- Discuter de `integration` avec l'équipe, puis **ouvrir la pull request vers `main`** (plus tard, pas maintenant).
- Logique métier EHPAD restante (features) : GIR/AGGIR, entité Prescription, rôles IDE/aide-soignant, motif+date de sortie, alerte dénutrition, relève persistée.
- Sécurité : rate-limit sur le login, stratégie de révocation JWT, CSP.

---

## Base de données : la même pour toute l'équipe
La base est **définie par le code** (scripts de `database/`), pas créée à la main. Deux façons de garantir que tout le monde a la même :

- **Chacun sa base locale, identique (recommandé)** : avec `docker compose up`, les scripts SQL sont chargés automatiquement → base identique pour tous. Pour repartir d'une base neuve et identique : `docker compose down -v && docker compose up`.
  - **Règle d'or** : ne jamais modifier la base à la main ; toute évolution passe par un `.sql` committé dans `database/`. (Amélioration possible plus tard : migrations **Flyway** au lieu du `DROP ... CREATE`.)
- **Une seule base partagée dans le cloud (si on veut des données communes en direct)** : héberger Postgres (Neon / Supabase / Railway, offres gratuites) et pointer tous les `.env` vers la **même** `DB_URL`. Avantage : données réellement communes et en temps réel ; inconvénient : il faut gérer le secret de connexion (hors Git) et une écriture d'une personne affecte tout le monde. Non nécessaire pour le développement.

## Continuer avec plusieurs modèles (Codex, Claude…) et se relayer
Il n'y a pas de mémoire commune entre outils IA : **le dépôt Git est la mémoire partagée.** Pour que chaque modèle (et chaque coéquipier·ère) reparte avec **tout le contexte à jour**, on a ajouté :
- **`AGENTS.md`** (lu automatiquement par **Codex**) et **`CLAUDE.md`** (lu par Claude Code) : vue d'ensemble, lancement, règles de branches, règle « base identique », et le **protocole de relais**.
- **`JOURNAL.md`** : le journal vivant (ce fichier).

**Protocole à chaque session, quel que soit le modèle ou la personne :**
1. `git pull` sur `integration`, puis lire `AGENTS.md` + `JOURNAL.md`.
2. Travailler sur `integration`.
3. **Mettre à jour `JOURNAL.md`**, puis `git commit` + `git push`.

C'est ça, le « temps réel » : non pas une mémoire partagée entre IA, mais une **synchronisation Git disciplinée** (pull au début, push + journal à jour à la fin).
