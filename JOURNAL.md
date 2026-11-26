# Journal de travail — MedTech EHPAD

> Journal des travaux réalisés sur le projet (intégration, corrections, design, analyse).
> Tenu à jour au fil des sessions. Branche de travail : `integration`.

---

## Relais Codex du 2026-11-26 — assistant, attribution et dossier médical

- Étendu l’assistant du personnel : absences au repas, reports, refus par créneau, plateaux à revérifier, doutes d’identité, prises à risque en attente et aide pour le QR, le poids et la relève. Le serveur répond à partir des données de service et de règles locales. Une question clinique est réorientée vers l’équipe. En cas de plusieurs prises possibles ou de vérification à risque, l’assistant renvoie vers la fiche.
- Une action de relève peut être prise en charge, libérée ou reprise par un autre soignant après confirmation. L’attribution et la clôture vérifient la version côté serveur. Seul le titulaire courant peut clôturer. La reprise indique le titulaire précédent et demande de vérifier avec l’équipe. Les changements d’attribution sont audités.
- Le médecin peut créer et modifier les antécédents et traitements documentés d’un résident actif, avec contrôle de version et audit. Les informations sont des observations en texte, sans création d’ordonnance ni modification de la tournée. Les anciennes valeurs ne sont pas archivées par ce chantier. À cadrer avant un usage réel : conservation des révisions et validation du circuit de correction.
- Migrations versionnées `handover_assignment.sql` et `medical_record_version.sql`. Vérifications : 31 tests backend, 31 tests frontend, rôles, saisies, concurrence de création et de modification du dossier, attribution simultanée, transfert et refus de clôture obsolète. Chromium valide la suggestion de l’assistant, la reprise et la saisie du dossier.
- [Circuit du plateau](docs/circuit-plateau.md) préparé pour la validation avec l’établissement. La vue cuisine, l’accusé de réception, les rôles IDE/aide-soignant/cuisine et les prescriptions restent à valider avec l’équipe métier.

---

## Relais Codex du 2026-11-26 — cartes de la salle à manger

- Compacté les cartes de service : avatar à gauche, identité et texture regroupées, alertes juste en dessous, statut à droite ou sous le texte sur les cartes étroites.
- Corrigé le débordement des contrôles à 320 px. Build Angular et 31 tests frontend réussis. Chromium vérifié à 1280, 390 et 320 px, y compris la visibilité d’une allergie et l’ouverture de la fiche. Site local actualisé.

---

## Relais Codex du 2026-11-26 — écran personnel et suivi quotidien

- Corrigé la disposition du tableau personnel : outils, créneau, progression, filtres et résultats ont chacun leur espace. Les cartes ont une hauteur cohérente par rangée et des avatars plus petits. L’assistant est avec les outils, sans bouton flottant au-dessus du contenu. Les alertes et les actions de service restent visibles.
- Ajouté **Suivi quotidien** à la fiche consultée depuis **Personnel → Résidents** et en lecture au médecin. Préférences modifiables, relevés de poids et observations datés et associés à l’auteur, historique des 30 derniers relevés. La courbe de consommation existante reste dans la fiche personnel. Pas de seuil ni de diagnostic automatique ajouté.
- Le personnel peut modifier les préférences et saisir les relevés. Le médecin peut consulter et l’administration ne peut pas accéder à la nouvelle API. Écriture limitée aux résidents actifs, textes et poids contrôlés côté serveur, requêtes paramétrées et rendu texte. Les préférences obsolètes reçoivent 409 et la répétition d’une même saisie ne rajoute pas de relevé.
- Au repas, **Absent**, **Refusé** et **Plus tard** restent distincts. Une absence clôt le repas sélectionné et ne compte pas dans l’appétit. Elle ne modifie pas les médicaments ni les autres repas. Pour un retour pendant le service, conserver le repas en « Plus tard » tant que l’absence définitive n’est pas établie.
- [Cadrage du circuit des prescriptions](docs/prescriptions.md) préparé pour l’atelier IDE/médecin. Restent à valider la source de référence, les responsabilités, les transitions lorsqu’une prescription est arrêtée ou suspendue et la reprise des prises historiques. Le circuit actuel de la tournée médicaments n’a pas été modifié.
- Migration versionnée `resident_daily.sql`. Vérifications sur base neuve et existante : 27 tests backend, 31 tests frontend, droits de lecture et d’écriture, limites de saisie, conflits de préférences, reprises de requête, refus de la double clôture du repas et parcours Chromium sur ordinateur et mobile.

---

## Relais Codex du 2026-11-26 — relève persistée et interface commune

- Première priorité fonctionnelle : la relève conserve les observations et actions à poursuivre avec leur auteur et leur heure. Les actions ouvertes restent affichées aux relèves suivantes. La clôture enregistre le compte et l’heure et déplace l’action dans les 30 dernières clôtures visibles. Le résumé du service reste disponible séparément et les transmissions enregistrées ne font pas partie du contenu copié.
- L’API de relève est réservée à PERSONNEL. Les règles des autres API restent en vigueur. Les entrées sont validées côté serveur, transmises via des requêtes paramétrées et affichées en texte. Un identifiant de demande par auteur empêche les doublons lors d’une nouvelle tentative. La clôture est atomique et une seconde clôture reçoit 409. Cette version offre un suivi partagé sans attribution individuelle préalable.
- La liste médecin sert de référence visuelle. Connexion simplifiée, barre commune aux trois rôles, cartes pour les listes d’administration et surfaces harmonisées côté personnel. Filtres, tri, pagination et actions admin sont conservés. `/medecin` ouvre directement l’annuaire protégé du médecin.
- Migration versionnée `handover.sql`, intégrée à l’initialisation et aux mises à jour Docker sans réinitialiser les données. Vérifications : 26 tests backend et 31 tests frontend, accès par rôle, entrées invalides, création répétée, clôture simultanée et parcours Chromium entre deux comptes. Navigation et cartes vérifiées sur ordinateur et mobile.
- Suites fonctionnelles : définir qui prend en charge une action à la relève et comment elle change de titulaire, puis cadrer la vue cuisine et la revérification des plateaux. Préférences, absence et suivi nutritionnel restent à développer. Le circuit de la prescription et les droits IDE/aide-soignant/cuisine restent à valider avec l’équipe métier.

---

## Relais Codex du 2026-11-26 — sécurité et opérations concurrentes

- L’API `/api/residents/**` est réservée au médecin. L’administration et le personnel conservent leurs API dédiées et les autorisations existantes. Les routes non déclarées sont refusées par défaut. Les ports Docker de démonstration sont publiés sur la boucle locale. Le frontend sert une CSP qui bloque les scripts intégrés et les sources de script externes.
- PostgreSQL limite les tentatives à 12 par identifiant et 60 par adresse sur dix minutes. Le serveur renvoie 429 et `Retry-After`. Les quotas persistent entre redémarrages de l’API. L’adresse est celle de la connexion directe. Une configuration de proxy doit traiter ce point avant exposition. Les comptes créés ou réinitialisés demandent 12 caractères au minimum.
- Les JWT expirent au bout de 30 minutes par défaut et exigent une session serveur active. Une déconnexion révoque la session correspondante. Modifier le mot de passe, le rôle ou l’activation révoque les sessions du compte. Les anciens jetons imposent de se reconnecter lors de la mise à jour. Le navigateur ferme aussi les écrans à l’expiration et affiche un message si le serveur ne confirme pas une déconnexion demandée hors ligne.
- Verrouillage de la capacité des chambres, des prises, des repas et du signalement des doutes d’identité. Une édition ou une suppression d’allergie ou de régime fondée sur une ancienne version est refusée. Les textures adaptées contradictoires ne peuvent plus être ajoutées. Une contradiction historique bloque « Servi » jusqu’à correction.
- Le tableau Repas actualise toutes les dix secondes les consignes modifiées du jour et signale les habitants ayant un repas à traiter. La fiche détail demande une nouvelle vérification. Le signalement s’affiche sur un tableau authentifié ouvert. Aucun rôle cuisine ni canal hors application n’a été ajouté.
- La migration SQL idempotente s’exécute avant le backend sous Docker et conserve les données existantes. Vérifié sur une base neuve et une base existante, avec 26 tests backend et 31 tests frontend. Contrôles API simultanés pour la capacité, la prise, le repas et l’édition médicale, plus les quotas, la révocation et le cloisonnement. Chromium a confirmé l’alerte sur une tournée déjà ouverte, la déconnexion et le parcours sous CSP.
- L’exposition publique reste hors de ce relais. Restent à valider dans un environnement dédié : HTTPS, secrets et comptes hors démonstration, politique réseau/CORS du déploiement, revue de sécurité indépendante et organisation du signalement à la cuisine si le tableau n’est pas ouvert.

---

## Relais Codex du 2026-11-26 — administration et codes QR

- Intégré `3fdf4ad` de `feature/admin-users` (identité visuelle, alertes des résidents sans chambre, validation de la numérotation, script commun) et `f37697c` de `feature/medecin` (création, renouvellement, désactivation, téléchargement et impression des QR). Aucun nouveau commit personnel, auth ou initialisation backend. Conservé le thème sobre commun aux trois rôles.
- Chambre nouvelle ou renumérotée : étage 0 à 20 et suffixe 01 à 99, contrôlés dans le formulaire et l’API. Une chambre historique reste modifiable lorsque son numéro et son étage sont conservés. Les nouvelles bases de démo utilisent des numéros conformes. Docker et l’installation manuelle utilisent le même `database/setup.sql` transactionnel, qui charge aussi les extensions et le jeu du personnel. Aucune réinitialisation de la base de travail.
- Réservé les API QR au médecin. Un QR actif identifie le résident via l’API authentifiée du personnel. Un renouvellement concurrent fondé sur un ancien code reçoit 409 et l’ancien QR devient inutilisable dès la validation du remplacement. Générations et révocations sont auditées. Les jetons révoqués ne sont plus retournés. L’impression isole le QR du reste de la fiche et l’encodage a été corrigé après échec du décodage avec le scanner du personnel.
- Vérifié : Docker sur volumes neuf et existant, 24 tests backend et 30 tests frontend, rôles et cycle QR via l’API, renouvellements simultanés (201 et 409), lecture par le décodeur du personnel, numérotation et édition de chambre historique. Chromium : renouvellement, téléchargement, aperçu d’impression isolé et validation du formulaire de chambre. La caméra physique et le lanceur PowerShell sous Windows restent à essayer.

---

## Relais Codex du 2026-11-26 — allergies, régimes et service des repas

- Intégré `da16ab8` de Ran depuis `feature/medecin`. Le médecin peut consulter, créer, modifier et supprimer les allergies et régimes depuis la fiche résident. Les nouveaux endpoints de lecture et d’écriture sont réservés à MEDECIN. L’administration conserve ses fonctions existantes. Le personnel consulte les consignes dans son espace repas, issu des mêmes tables PostgreSQL.
- Fusionné les méthodes des repositories et conservé la forme du DTO personnel. Les intolérances sont visibles dans « À éviter ». Une texture normale ne masque plus une texture adaptée lorsqu’un résident a plusieurs régimes. Les tables et scripts SQL existants suffisent.
- Les écritures médecin et la validation d’un repas s’ordonnent avec le même verrou résident. À la validation, le backend compare la version des consignes affichées avec celle des consignes enregistrées. Une confirmation obsolète reçoit 409. La fiche personnel recharge le repas puis demande une nouvelle confirmation si nécessaire. Les clients de l’API qui confirment un risque repas doivent transmettre `mealRiskVersion` depuis la fiche résident. Le flux médicaments est inchangé.
- Vérifié sur Docker isolé : 24 tests backend dont le test de régression, 26 tests frontend, CRUD et cloisonnement via l’API, données visibles côté personnel, confirmation obsolète refusée et nouvelle confirmation acceptée. Chromium a validé l’édition médecin, puis l’actualisation et l’affichage des nouvelles consignes sur une fiche repas déjà ouverte.
- À cadrer avec l’équipe : gestion des modifications concurrentes de la même fiche par deux médecins, règles en cas de consignes alimentaires contradictoires et signalement aux équipes de préparation lorsqu’un plateau est déjà préparé. La fiche repas se réactualise à la validation, sans diffusion en direct pendant la tournée.

---

## Relais Codex du 2026-11-26 — espace médecin

- Synchronisé `integration` et repris le commit `250187c` de `feature/medecin`. Les branches admin et personnel n’avaient aucun commit distant supplémentaire à intégrer.
- L’espace médecin propose l’annuaire des résidents, la recherche par nom ou chambre, la fiche résident et le dossier médical en lecture seule. Le conflit du modèle partagé a été résolu en conservant les types et helpers admin et en ajoutant les DTO médecin. La navigation entre deux fiches annule les requêtes de la précédente.
- Conservé les règles d’accès existantes et les mappings PostgreSQL déjà intégrés. Aucun changement d’API ou de SQL. Régénéré le lockfile pour que `npm ci` installe les dépendances requises par le build.
- Vérifié sur une stack Docker isolée initialisée par les scripts versionnés : build de production, 23 tests backend et 26 tests frontend. Les trois comptes de démo se connectent. L’API du dossier répond 401 sans jeton, 403 pour admin/personnel et 404 pour médecin sur les 12 résidents du jeu de démo. Parcours Chromium validé : recherche, ouverture de fiche, dossier absent, nouvelle tentative avec un dossier fictif simulé, identifiant invalide et redirection du rôle personnel.
- À venir pour le médecin : jeu de démo fictif pour les dossiers, écriture du dossier médical et QR codes. Le reste du backlog figure dans « À venir ».

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

> **Si l’espace médecin affiche encore l’ancien écran** : vérifier que la copie utilisée par Docker est sur `integration` et à jour, puis reconstruire les services avec `docker compose up -d --build backend frontend`. Le commit Git seul ne met pas à jour les conteneurs déjà démarrés. Vérifié le 2026-11-26 : après reconstruction du frontend et de l’API sur le site local, le compte médecin ouvre l’annuaire puis les sections Allergies et Régimes alimentaires. Le conteneur et le volume PostgreSQL existants ont été conservés.

### Option 2 — Manuel (développement)
1. Base : créer une base locale `medtech` puis exécuter `database/setup.sql`, également utilisé par Docker.
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
1. **Connexion** → annuaire **Résidents** de l’espace médecin.
2. Rechercher un nom ou un numéro de chambre, puis ouvrir une fiche.
3. Vérifier l’identité, la chambre et la section **Dossier médical**. Sur une base de démo initiale, utiliser **Créer le dossier** pour enregistrer des données fictives.
4. Vérifier l’ajout, la modification et la suppression d’une allergie ou d’un régime avec des données fictives. L’ouverture de la fiche repas du même résident côté personnel doit afficher les consignes actualisées.
5. Dans **QR Code**, vérifier le téléchargement et l’impression. Après renouvellement, vérifier côté personnel que le nouveau code identifie le résident et que l’ancien est refusé.
6. Vérifier que le retour à la liste et la déconnexion fonctionnent.
- API : `GET /api/residents` (liste), `GET /api/residents/{id}` (détail), `GET /api/residents/{id}/medical-record` (dossier réservé à MEDECIN). Le dernier endpoint répond **403** avec un jeton personnel ou admin.

### 🧑‍⚕️ PERSONNEL / SOIGNANT (`personnel` / Demo1234!)
1. **Connexion** → *Espace personnel*, onglet **Repas**.
2. Parcourir : créneau **Déjeuner / Dîner**, filtres **Salle à manger / Chambres**, **À faire / Faits / Tous**, recherche.
3. **Ouvrir une fiche** (clic sur une carte) : identité, signes distinctifs, **courbe d'appétit 7 jours**, repas du créneau, régime / texture / à éviter, consignes.
4. **Servir un repas** :
   - résident **sans** allergie → « Servi » direct ;
   - résident **avec** allergie/texture (ex. **Lucien ROUX · Arachides · Hachée**) → « Servi » ouvre un **dialogue de confirmation** (vérifier le plateau) ; tester *Annuler* puis *J'ai vérifié, valider* ;
   - **Refusé** → le **motif** est obligatoire ;
   - **Plus tard** laisse le repas à traiter ; **Absent** clôt ce repas sans quantité consommée ;
   - après « servi », saisir la **quantité mangée**.
   - si le médecin modifie une consigne alors que la fiche repas est ouverte, la validation doit être refusée et la fiche actualisée. Relire les nouvelles consignes puis relancer « Servi » ;
5. **Doute d'identité** : « J'ai un doute sur l'identité » → signaler. Essayer de servir → **bloqué** tant que le doute n'est pas levé. Lever le doute (⚠️ un **autre** soignant doit le faire : le backend refuse la même personne).
6. **« Je ne le connais pas »** : identification par code bracelet / scan QR / photo de pochette (OCR).
7. Onglet **Médicaments** : tournée **Matin / Midi / Soir**, « Démarrer la tournée », donner une prise ; un **médicament à risque** demande une **confirmation**.
8. **Résidents** (annuaire), **Relève** (créer une transmission, la prendre en charge puis la reprendre et la clôturer avec un autre compte personnel), **Assistant** (ex. « qui reste à servir ? »).
9. **Thème sombre** (bouton lune), **Déconnexion**.
- À surveiller : le **scan QR** nécessite une caméra ; l'**OCR pochette** nécessite le service Flask externe (absent → message « indisponible », c'est normal).

### 🔒 Contrôles de sécurité (rapides)
- Non connecté, aller sur `/admin` → redirigé vers `/login`.
- Connecté `personnel`, forcer l'URL `/admin` → redirigé (guard) ; et l'API `/api/admin/**` renvoie **403**.
- Jeton invalide/expiré → déconnexion automatique.

---

## À venir
- **Espace médecin** : ajouter des dossiers de démo fictifs via `database/`, puis définir la politique de conservation des révisions du dossier médical.
- Discuter de `integration` avec l'équipe, puis **ouvrir la pull request vers `main`** (plus tard, pas maintenant).
- Logique métier EHPAD restante (features) : GIR/AGGIR, entité Prescription, rôles IDE/aide-soignant, motif+date de sortie, alerte dénutrition et circuit du plateau.
- Sécurité avant exposition : environnement dédié, HTTPS, secrets et comptes hors démonstration, paramètres du proxy et revue indépendante.

### Décision — base de données & déploiement
- **Pendant le développement** : chacun sa **base locale identique** (via `docker compose up`, scripts SQL versionnés). Pas de base partagée pour l'instant.
- **En fin de projet** : déployer **tout dans le cloud, gratuitement**. Pistes (offres gratuites) :
  - **Base PostgreSQL** : Neon ou Supabase (free tier).
  - **Backend Spring Boot** : Render, Railway ou Fly.io (free tier).
  - **Frontend Angular** : Vercel, Netlify ou GitHub Pages.
  - À prévoir au moment du déploiement : `CORS_ALLOWED_ORIGINS` vers l'URL du front déployé, `DB_URL`/secrets via les variables d'environnement de l'hébergeur (jamais dans Git), et faire pointer `environment.ts` du front vers l'URL publique de l'API.

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
