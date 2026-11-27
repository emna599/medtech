# MedTech EHPAD — Espace PERSONNEL (niveau 1)

Interface destinée aux soignants (aides-soignants, infirmiers) pour **servir les repas** et **donner les médicaments**, en salle à manger comme en chambre, avec une identification fiable du résident.

Principe de conception : **« un écran, un geste »**, pensé d'abord pour la tablette, avec de grandes zones tactiles et le moins de saisie possible.

> Toutes les données de démonstration sont **fictives**.

---

## 1. Ce que fait l'application

| Fonction | Description |
|---|---|
| Accueil | Choix **Repas / Médicaments**, créneau (déjeuner, dîner, matin, midi, soir), progression « X / Y faits », recherche par nom ou chambre, filtre À faire / Faits / Tous |
| Salle à manger | **Grille de photos** des résidents : on reconnaît la personne, on touche, on valide |
| Chambres | **Liste ordonnée par chambre** avec « Démarrer la tournée » : après chaque validation, la fiche du résident suivant s'ouvre |
| Fiche résident | Photo, **bandeau rouge d'allergies**, régime et texture, actions **Servi / Donné**, **Refusé** (avec motif), **Plus tard**, quantité mangée, changement de lieu (salle ↔ chambre) |
| Doute d'identité | Le soignant signale un doute : **Servi / Donné est bloqué** tant qu'un **autre** soignant ne l'a pas levé |
| **Scanner** | Bouton unique en haut : **QR code** pendant les repas, **puce NFC** pour les médicaments. La fiche s'affiche, puis confirmation « C'est bien cette personne » |
| Assistant | Bouton **Assistant** (en bas à droite) : questions en français, écrites ou **dictées à la voix**, réponses sur le service en cours. Il **propose** une validation, le soignant **confirme** |
| Appétit | Dans la fiche d'un repas : graphique des 7 derniers jours (une barre par jour) et alerte **« en baisse »** quand les trois derniers jours sont nettement moins bons ou sous la moitié. L'assistant répond aussi à « appétit de Mme Martin ? » |
| Mode sombre | Bouton lune / soleil dans le bandeau ; suit le réglage du système tant qu'on n'a pas choisi |
| Relève | Bouton **Relève** : résumé à transmettre à l'équipe suivante (repas et prises faits par créneau, reste à faire, doutes d'identité, refus, repas à peine touchés, traitements à risque non donnés), avec **Copier le résumé** |
| Pochette (OCR) | Dans **Scanner** (onglet Autre) : **Photographier l'étiquette d'une pochette**. Le service OCR de l'équipe lit le nom, Spring retrouve le résident, et le soignant **compare le visage à la photo** avant de continuer. Facultatif : sans service OCR, un message l'indique |
| Traçabilité | Chaque action est enregistrée dans `audit_log` avec le soignant, l'heure et le résident |

### Règles métier (côté serveur)

- Un repas ou une prise passe de `A_FAIRE` à `FAIT`, `REFUSE` ou `PLUS_TARD`.
- Un élément déjà `FAIT` ou `REFUSE` ne peut plus être modifié (erreur 409).
- Un refus **exige un motif**.
- `FAIT` est **refusé** s'il existe un doute d'identité ouvert sur le résident.
- Un doute ne peut être levé que par **un autre utilisateur** que celui qui l'a signalé.
- Les créneaux : `MATIN` avant 11 h, `MIDI` avant 15 h, sinon `SOIR`. Les repas sont `DEJEUNER` et `DINER`.
- Accès réservé aux rôles `PERSONNEL` et `ADMIN`.

---

## 2. Architecture

```
Angular 22 (tablette)  ──HTTP/JSON + JWT──►  Spring Boot 4 (Java 21)  ──JPA──►  PostgreSQL
 localhost:4200                                localhost:8080                      base « medtech »
```

- **Frontend** : Angular standalone, signals, `OnPush`, Angular Material (Material Symbols).
- **Backend** : Spring Web, Spring Data JPA (`ddl-auto=validate`), Spring Security (JWT sans état, BCrypt).
- **Base** : PostgreSQL. Le schéma n'est jamais modifié par Hibernate : il est géré par les scripts SQL.

### Où se trouve le code

Backend, `backend/src/main/java/com/esigelec/ehpad_backend/` :

| Dossier | Contenu |
|---|---|
| `controller/PersonnelController.java` | Toutes les routes `/api/personnel/**` |
| `service/AssistantService.java` | Assistant par règles (mots-clés), sans modèle externe |
| `service/` | `CareService` (repas et médicaments), `ResidentService`, `IdentityDoubtService`, `AuditService`, `CurrentUserService`, `ResidentCardAssembler` |
| `entity/`, `repository/` | Entités JPA et requêtes |
| `dto/` | Objets échangés avec le frontend (jamais d'historique médical) |
| `exception/` | Erreurs 400 / 404 / 409 (`PersonnelExceptionHandler`) |
| `security/SecurityConfig.java` | Une ligne ajoutée pour `/api/personnel/**` |

Frontend, `frontend/src/app/` :

| Fichier | Rôle |
|---|---|
| `features/personnel/personnel-dashboard.*` | Accueil (onglets, grille, liste, progression) |
| `features/personnel/resident-sheet/` | Fiche résident (fenêtre de dialogue) |
| `features/personnel/identify-dialog/` | Écran **Scanner** (NFC, QR code, code saisi, pochette) |
| `features/personnel/planning-dialog/` | Mon planning (fixe, selon la fonction et l'équipe) |
| `features/personnel/notes-dialog/` | Notes de traçabilité (saisie ou dictée) |
| `features/personnel/components/resident-avatar.ts` | Photo ou initiales colorées |
| `features/personnel/releve-dialog/` | Résumé de relève (lecture seule, calculé depuis le service du jour) |
| `features/personnel/assistant-dialog/` | Fenêtre de l'assistant (discussion, dictée vocale, confirmation) |
| `core/services/personnel.service.ts` | Appels HTTP |
| `shared/models/personnel.model.ts` | Types et libellés |
| `shared/components/toolbar/` | Bandeau avec le logo |
| `src/styles.scss`, `public/logo.svg` | Thème aux couleurs du logo |

Base de données, `database/` :

| Script | Rôle |
|---|---|
| `medtech_schema.sql` | Schéma de base (équipe) |
| `seed_users.sql` | Comptes de démonstration (équipe) |
| `personnel_additions.sql` | Colonnes et tables du personnel (`medication_dose`, `identity_doubt`…), **re-jouable** |
| `seed_personnel.sql` | 80 résidents fictifs (`DEMO-001` à `DEMO-080`, chambres 1 à 80), repas et prises du jour, **re-jouable** |
| `install_personnel.sql` | Les deux scripts ci-dessus à la suite |

---

## 3. API

Toutes les routes demandent l'en-tête `Authorization: Bearer <jwt>`.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/personnel/me` | Le soignant connecté : fonction, équipe, droits |
| GET | `/api/personnel/planning` | Planning type de sa fonction et de son équipe |
| GET / POST | `/api/personnel/notes` | Notes de traçabilité (`?residentId=` pour un résident) |
| GET / POST | `/api/personnel/residents/{id}/photo` | Photo d'un résident (l'envoi est **réservé à l'administrateur**) |
| GET | `/api/personnel/residents?search=` | Liste des résidents actifs |
| GET | `/api/personnel/residents/{id}` | Fiche d'un résident |
| PUT | `/api/personnel/residents/{id}/meal-location` | Salle ↔ chambre |
| POST | `/api/personnel/identify` | Retrouver un résident par code de bracelet |
| POST | `/api/personnel/identify/pochette` | Photo d'une étiquette (champ `photo`) : résident proposé par l'OCR |
| GET | `/api/personnel/residents/{id}/appetite?days=7` | Appétit des derniers jours (3 à 14) |
| GET | `/api/personnel/service?kind=REPAS\|MEDICAMENT` | Éléments du jour à servir |
| POST | `/api/personnel/meals/{id}/complete` | Valider un repas (`status`, `comment`) |
| PUT | `/api/personnel/meals/{id}/quantity` | Quantité mangée |
| POST | `/api/personnel/doses/{id}/complete` | Valider une prise de médicament (**infirmiers seulement**, sinon 403) |
| POST | `/api/personnel/assistant` | Question à l'assistant (`message`) : réponse, résidents cités, action à confirmer |
| GET / POST | `/api/personnel/identity-doubts` | Lister / signaler un doute |
| POST | `/api/personnel/identity-doubts/{id}/resolve` | Lever un doute (autre soignant) |

---

## 4. Tutoriel : installer et lancer

### Prérequis

- Java 21, Node.js 22 (ou plus récent), PostgreSQL 18 avec pgAdmin
- Un fichier `.env` à la racine du dépôt backend (voir `.env.example`) :

```
DB_URL=jdbc:postgresql://localhost:5432/medtech
DB_USERNAME=postgres
DB_PASSWORD=...
JWT_SECRET=...
JWT_EXPIRATION_MINUTES=60
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

> Spring Boot **ne lit pas** le fichier `.env` tout seul : il faut charger ses variables dans la session (étape 2) ou utiliser `"envFile": "${workspaceFolder}/.env"` dans `.vscode/launch.json`.

### Étape 1 — Préparer la base (une seule fois, puis à volonté)

Les scripts se lancent dans cet ordre. Les deux premiers sont ceux de l'équipe et ne se relancent qu'à la création de la base.

```powershell
cd database
$env:PGPASSWORD = (Select-String -Path ..\.env -Pattern '^DB_PASSWORD=(.*)$').Matches[0].Groups[1].Value
$env:PGCLIENTENCODING = "UTF8"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

& $psql -h localhost -U postgres -d medtech -f medtech_schema.sql
& $psql -h localhost -U postgres -d medtech -f seed_users.sql
& $psql -h localhost -U postgres -d medtech -f personnel_additions.sql
& $psql -h localhost -U postgres -d medtech -f seed_personnel.sql
```

Le dernier script affiche `residents = 12`. **Relancer `seed_personnel.sql`** remet la démo à zéro (repas et prises « à faire »).

### Étape 2 — Lancer le backend

```powershell
Get-Content .env | Where-Object { $_ -match '^\s*[^#\s][^=]*=' } | ForEach-Object {
  $k, $v = $_ -split '=', 2
  Set-Item -Path "Env:$($k.Trim())" -Value $v.Trim()
}
cd backend
.\mvnw.cmd spring-boot:run
```

Attendre `Started EhpadBackendApplication`. Si le port 8080 est déjà pris :

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080 -State Listen).OwningProcess -Force
```

### Étape 3 — Lancer le frontend

```powershell
cd frontend
npm install
npx ng serve
```

Ouvrir <http://localhost:4200>.

### Comptes de démonstration

| Utilisateur | Mot de passe | Usage |
|---|---|---|
| `personnel` | `Demo1234!` | Sam Soignant : espace personnel |
| `personnel2` | `Demo1234!` | Léa, **aide-soignante** : repas et soins, médicaments en consultation seule ; lever un doute d'identité |
| `admin`, `medecin` | `Demo1234!` | Autres espaces |

Codes de bracelet de démonstration : `DEMO-001` à `DEMO-012`.

---

## 5. Parcours de test

1. **Salle à manger.** Connexion `personnel`, onglet Repas, Déjeuner. Toucher un résident, **Servi**, choisir la quantité. Le compteur « X / 12 » avance.
2. **Allergie.** Ouvrir un résident allergique (Colette Simon : lactose ; Lucien Roux : arachides) : le bandeau rouge est en haut de la fiche.
3. **Refus.** Ouvrir un résident, **Refusé** : un motif est obligatoire.
4. **Tournée en chambre.** Onglet Chambres, **Démarrer la tournée** : les fiches s'enchaînent dans l'ordre des chambres.
5. **Médicaments.** Bouton Médicaments, même geste avec **Donné**. Les prises « à risque » sont signalées.
6. **Scanner.** Dans l'onglet Autre, saisir `DEMO-001`, vérifier la photo, **C'est bien cette personne**.
7. **Doute d'identité.** Avec `personnel`, ouvrir un résident, **J'ai un doute sur l'identité** puis **Signaler le doute** : Servi/Donné est bloqué. Dans une fenêtre de navigation privée, se connecter avec `personnel2`, ouvrir le même résident et appuyer sur **Confirmer l'identité**. Le blocage disparaît. Le même soignant ne peut pas lever son propre doute.
8. **Changement de lieu.** Dans une fiche, passer un résident de la salle à la chambre : il apparaît dans l'autre onglet.

9. **Assistant.** Bouton **Assistant**. Essayer : « Qui n'a pas encore mangé ? », « Quels médicaments restent à donner ? », « Allergies de Mme Simon », « Régime de M. Durand », « Où est Mme Petit ? », « Qui a refusé ? », « Résumé du service ». Pour agir : « Marque le repas de M. Durand comme servi » : l'assistant prépare l'action, rien n'est enregistré avant **Confirmer**. Le micro (Chrome ou Edge) dicte la question en français et l'envoie tout seul à la fin de la phrase. **Lire les réponses** active la voix de l'assistant ; **Mains libres** enchaîne : vous parlez, il répond à voix haute, puis il réécoute.

### Sécurité de l'assistant

- Il ne voit que ce que voit déjà le soignant (fiche personnel et service du jour) : **jamais l'historique médical**.
- Il **ne modifie rien** : la validation passe par la route normale, avec les mêmes règles (doute d'identité, déjà fait, etc.) et la même traçabilité.
- Sans doute d'identité levé, il refuse de préparer la validation.
- Il fonctionne par règles : aucune donnée n'est envoyée à un service extérieur.

---

## 6. Thème

Les couleurs viennent du logo MedTech : **vert-bleu** `#0f766e`, **bleu nuit** `#12365c`, **corail** `#e8715a`. Elles sont définies dans `frontend/src/styles.scss` (variables `--brand-*` et jetons Material `--mat-sys-*`). La police est Nunito.

Choix d'accessibilité : zones tactiles d'au moins 48 px, allergies toujours en rouge avec une icône (jamais la couleur seule), focus clavier visible, animations réduites si le système le demande.

---

## 7. Lecture des pochettes par OCR (facultatif)

Le service est le prototype Flask de l'équipe (`R&D/app.py`, route `/scan`). Spring lui transmet la photo, lit le nom reconnu et le rapproche des résidents de la base (nom et prénom, dans n'importe quel ordre, sans accents).

1. Installer et lancer le prototype : `pip install rapidocr-onnxruntime rapidfuzz opencv-python numpy pillow flask`, puis `python app.py` (port 5000).
2. Remplacer `R&D/residents.json` par `database/ocr_residents_demo.json` (les 12 résidents de démonstration), puis relancer le prototype.
3. Si le service tourne ailleurs que sur `localhost:5000`, ajouter `OCR_SERVICE_URL=http://adresse:5000` dans le `.env`.
4. Dans l'application : **Je ne le connais pas**, puis **Photographier l'étiquette d'une pochette**. Sur tablette, cela ouvre l'appareil photo.

Sécurité : l'OCR ne fait que **proposer**. Le soignant doit comparer le visage à la photo et confirmer, comme avec le code du bracelet. L'identification est tracée (`IDENTIFICATION_POCHETTE`). Les photos ne sont pas enregistrées. Un code-barres sur les étiquettes n'est pas utilisé (à valider avec le client).

## 7bis. Résidents et scan de QR code

- **Bouton « Résidents »** (barre du haut) : liste de tous les résidents, recherche par nom ou chambre (sans tenir compte des accents), fiche en lecture seule (allergies, régime, texture, consignes, tendance d'appétit) et accès à son service du jour.
- **Scanner un QR code** : dans « Je ne le connais pas », la caméra lit le QR du bracelet. Le jeton est cherché d'abord dans la table `qr_code` (générée par l'espace médecin), puis dans `identity_code`. Si la caméra n'est pas disponible, utiliser « Photo du QR code » ou saisir le code.
- La caméra en direct exige **HTTPS ou localhost**.
- Planche de QR de démonstration : `database/qr_demo_residents.png` (jetons `QR-DEMO-001` à `QR-DEMO-012`, créés par `seed_personnel.sql`).
- Nouvelle dépendance front : `jsqr` → lancer `npm install` dans `frontend/frontend`.
- Nouveau test Java : `ResidentServiceTokenTest`, `StaffServiceTest`, `TeamServiceTest`, `ChevaletServiceTest`.

## 7ter. Version 2 : fonctions, NFC, planning, notes, photos, base commune

**Fonctions.** Un soignant est **infirmier** ou **aide-soignant** (table `staff_profile`). Seul l'infirmier (ou l'administrateur) peut valider une prise de médicament ; l'aide-soignant la consulte. Un compte PERSONNEL sans ligne dans `staff_profile` est traité comme aide-soignant. Pour en créer un :

```sql
INSERT INTO staff_profile (user_id, job, shift)
SELECT id, 'INFIRMIER', 'JOUR' FROM users WHERE username = 'nom_utilisateur';  -- ou 'AIDE_SOIGNANT', 'NUIT'
```

**NFC et QR code.** Le bouton **Scanner** s'ouvre sur le **QR code** dans l'onglet Repas et sur la **puce NFC** dans l'onglet Médicaments. La lecture NFC du navigateur (Web NFC) ne marche que sur **Chrome pour Android, en HTTPS** ; ailleurs, on saisit le code de la puce. Les puces de démonstration contiennent `NFC-DEMO-001` à `NFC-DEMO-012` (écrire ce texte sur la puce avec une application comme « NFC Tools »). Table : `resident_nfc_tag`.

**Équipe en service et répartition.** Bouton **Équipe** (ex. « 2 inf. · 1 AS ») : le nombre d'infirmiers et d'aides-soignants en service, leurs **noms**, leur part de résidents et l'heure de prise de service. Chacun appuie sur **Je prends mon service** / **Je termine mon service** (table `staff_presence`). Les résidents, triés par chambre, sont répartis à **parts égales entre les soignants présents de la même fonction** : un infirmier seul suit tout le monde (75 ou 80), deux infirmiers en suivent environ 40 chacun. L'écran principal montre **Mes résidents / Tous** et des alertes (aucun infirmier, plus de 40 résidents par infirmier, aucune aide-soignante). Les infirmiers voient toute l'équipe, les aides-soignants leurs collègues aides-soignants. Comptes de démo : `personnel` et `personnel3` (infirmiers), `personnel2` (aide-soignante), tous en service après `seed_personnel.sql`.

**Matin, bracelets, chevalets, alertes (version 3).**
- **Le matin** (petit-déjeuner, médicaments du matin), il n'y a plus de choix « salle à manger » : tout se fait en tournée des chambres.
- **Identification** : les résidents **avec bracelet** ont un bouton **Scanner le bracelet** dans leur fiche (il confirme, ou signale un bracelet qui n'est pas le leur) ; **sans bracelet**, la fiche demande de lire le nom et de comparer le visage à la photo. Dans la démo, `DEMO-004` et `DEMO-009` n'ont pas de bracelet. C'est une aide, qui ne bloque pas le service.
- **Distribution des repas de 11 h 30 à 13 h** : infirmiers et aides-soignants y figurent tous les deux au planning. Plusieurs plages peuvent être **en cours en même temps** (tournée de médicaments et distribution des repas). Une plage **Distribution des chevalets** (11 h à 11 h 30) précède le service : à adapter dans `seed_personnel.sql` si l'horaire diffère.
- **Chevalets** : table `chevalet(id, code, resident_id, associated_at, associated_by)`. Dans la fiche d'un résident, pendant les repas : **Associer un chevalet** (saisir son numéro), **Changer**, **Retirer**. Un chevalet n'est associé qu'à un résident, et un résident n'a qu'un chevalet ; réassigner un chevalet déjà pris demande une confirmation. Saisir un numéro de chevalet dans **Scanner** (onglet Autre) retrouve aussi le résident. Démo : chevalets 1 à 20, les 1 à 8 déjà associés.
- **Alertes du planning** : la **cloche** en haut active les notifications du navigateur. À l'heure où une tâche du planning commence, un message s'affiche dans la page (avec **Ouvrir** vers les repas ou les médicaments) et une notification système si elles sont activées. Elles ne fonctionnent que **page ouverte** (pas de serveur de notification).

**Planning.** Bouton **Planning** : plages fixes selon la fonction et l'équipe (transmissions, tournées de 7 h, 11 h 30 et 17 h, pauses), avec la plage en cours en évidence. Elles viennent de la table `planning_task`, remplie par `seed_personnel.sql` ; on l'adapte en SQL.

**Notes de traçabilité.** Bouton **Notes** (ou **Ajouter une note** dans une fiche) : saisie au clavier ou **dictée vocale**, trois types (traçabilité, observation, incident), chaque note est signée et horodatée (table `staff_note`).

**Photos.** Les 12 résidents de démo ont un avatar illustré fictif (`frontend/public/avatars`). **L'administrateur** peut envoyer une vraie photo : **Résidents** → fiche → **Changer la photo** (JPEG, PNG ou WebP, 3 Mo maximum, stockée dans `resident_photo`).

**Base de données commune.** Tout le monde exécute les **mêmes scripts versionnés** de `database/`, dans cet ordre, sur une base `medtech` vide :
1. `medtech_schema.sql` puis `seed_users.sql` (équipe)
2. `personnel_additions.sql` puis `seed_personnel.sql` (ou `install_personnel.sql` qui fait les deux)

Tous les scripts sont relançables. Les données de démo sont identiques chez chacun après exécution ; pour repartir à zéro, relancer `seed_personnel.sql`.

## 8. Tests automatiques

```powershell
# Frontend : modèles, planning, appels HTTP, assistant, graphique d'appétit, lecture NFC
cd frontend
npx ng test --watch=false

# Backend : assistant, appétit, pochette, QR, droits infirmier (JUnit + Mockito, sans base de données)
cd backend
.\mvnw.cmd test -Dtest="AssistantServiceTest,AppetiteServiceTest,PochetteScanServiceTest,ResidentServiceTokenTest,StaffServiceTest,TeamServiceTest,ChevaletServiceTest"
```

## 9. Dépannage

| Symptôme | Cause probable |
|---|---|
| Erreur 404 sur `/api/personnel/...` | Un **ancien backend** tourne encore sur le port 8080 : l'arrêter et relancer |
| `APPLICATION FAILED TO START … Port 8080 was already in use` | Idem |
| Le backend s'arrête sur une erreur de validation de schéma | `personnel_additions.sql` n'a pas été exécuté |
| pgAdmin : « authentification par mot de passe échouée » | Utiliser le `DB_PASSWORD` du `.env` |
| Le backend ne trouve pas la base | Variables du `.env` non chargées dans la session PowerShell |

---

## 10. Limites et suite prévue

- Le scan par **bracelet / QR code** est facultatif (client réservé) : seule la saisie du code est faite.
- L'assistant fonctionne par règles ; un modèle de langage reste possible en option (données fictives uniquement).
- La dictée vocale n'est pas encore dans les commentaires de refus (uniquement dans l'assistant).
- La lecture des pochettes dépend du prototype Flask : elle n'est pas fiable sur une photo floue ou mal éclairée.
- Les tests Java (assistant, appétit, pochette) sont écrits mais n'ont pas été exécutés par l'auteur de ce document : à lancer avec `mvnw.cmd test`.

## 7quater. Interface « Service » (salle à manger)

Compte de démo : `service1` / `Demo1234!` (fonction `SERVICE`, équipe de jour). Au login, l'écran personnel affiche la salle à manger au lieu des tournées.

- **Les résidents s'installent où ils veulent** : aucune place n'est attribuée. Chaque table (10 tables de 8 résidents au maximum, `dining_table`) a un lecteur RFID (`table_reader` : TR1 = Table 1…). Quand le résident s'assoit, le lecteur lit son bracelet (jeton NFC ou QR) et l'enregistre (`table_presence`). L'écran n'affiche à chaque table que les résidents **présents**, dans l'ordre d'arrivée.
- Chaque résident présent montre nom, prénom, photo, allergies, régime/texture, chevalet, « En chambre » le cas échéant, et une case **Fait** (réutilise `POST /api/personnel/meals/{id}/complete`). Un clic ouvre la fiche détaillée avec « Fait » / « Refusé » (motif obligatoire). Une table pleine (8) refuse un 9e résident (409).
- **Menu de la semaine** : table `weekly_menu` (lundi de la semaine, jour 1–7, déjeuner/dîner). Tant qu'aucune nouvelle semaine n'est saisie, le dernier menu se répète. Menu du jour en haut de l'écran, bouton « Menu de la semaine » pour naviguer.
- **API** : `GET /api/personnel/dining/tables?slot=DEJEUNER|DINER`, `GET /api/personnel/dining/menu?date=AAAA-MM-JJ`, `POST /api/personnel/dining/readings` `{ readerCode, token | residentId, leaving }` (réponses `OK`, `ALREADY`, `MOVED`, `LEFT`). Un vrai lecteur (ESP32 + module RFID) appellera cette route avec un compte de service.
- **Démonstration sans lecteur** : le seed installe 24 résidents au hasard sur les tables 1 à 4 ; bouton de départ sur chaque résident ; le bouton « Scanner » (NFC/QR/code) retrouve un résident déjà installé.
- Le service en salle n'a pas accès aux médicaments et n'entre pas dans la répartition des résidents entre soignants.

Après mise à jour : relancer `install_personnel.sql` (UTF-8), redémarrer le backend, tests : `DiningServiceTest`.

### 7quinquies. Menu du jour et résidents concernés

L'interface Service compare le menu du repas (entrée, plat, accompagnement, dessert) aux résidents **présents à table**
(`MenuCompatibility`, mots-clés des plats) : allergie (STOP : ne pas servir), régime sans sel / sans sucre / végétarien
et texture mixée / hachée (ADAPT : adapter le plat). Le résultat est dans `DiningDto.Seat.warnings` ; l'écran affiche,
par plat, la liste des résidents concernés (ex. vendredi : « Frites »). Règles simples = aide au service, pas un avis médical.

### 7sexies. Petit-déjeuner et ordre de tournée

- Le **petit-déjeuner** (8 h, type `PETIT_DEJEUNER`) est servi **en chambre** par les hôtesses (compte « Service ») ;
  infirmiers et aides-soignants peuvent aider depuis le même écran (onglet « Petit-déjeuner » de la liste des repas).
  Le service ouvre sur la salle ; le bouton « Chambres » mène à la tournée, « Tables » y retourne.
- Les listes de tournée sont triées **par étage puis par numéro de chambre croissant** (titres d'étage dans la liste des chambres).

### 7septies. Démonstration « téléphone = table, carte de cantine = bracelet »

Sans antenne RFID, un téléphone Android joue le lecteur d'une table et une carte NFC joue le bracelet :
1. Ouvrir l'application dans **Chrome pour Android** (le NFC web exige HTTPS ou `localhost` : brancher le téléphone en USB, activer le
   débogage USB, puis `adb reverse tcp:4200 tcp:4200` et `adb reverse tcp:8080 tcp:8080`, et ouvrir `http://localhost:4200` sur le téléphone).
2. Écran Service : choisir « Ce téléphone = Table 1 », appuyer sur **Lire** : le NFC n'écoute qu'**une carte**, puis s'arrête (30 s maximum).
3. Approcher la carte du dos du téléphone : le résident associé apparaît à la table choisie (`POST /dining/readings` avec le jeton de la carte).
4. Carte inconnue : l'écran propose « À qui est-elle ? » ; le choix d'un résident l'associe (`POST /residents/{id}/nfc`) et le place à table.
Limite : Web NFC ne lit que les cartes au format NDEF (cartes NTAG/MIFARE Ultralight, ou cartes vierges formatées). Certaines cartes de cantine
MIFARE Classic ne sont pas lisibles par Chrome.

### 7octies. Étiquette de médicament (infirmier) : photo → résident → bracelet

Bouton **Étiquette** (réservé aux infirmiers) :
1. Photographier l'étiquette : les caractères sont lus **dans le navigateur** (Tesseract.js, français ; au premier usage il télécharge son
   lecteur de texte, donc internet est nécessaire une fois). Le nom et le prénom lus sont comparés aux résidents de la base (tolérance à une lettre
   mal lue ; la chambre et l'âge départagent deux résidents proches).
2. La photo du résident s'affiche, avec ses allergies et les médicaments lus sur l'étiquette.
3. **Scanner son bracelet** (NFC du téléphone, ou code saisi sur ordinateur) : si le bracelet est celui du résident de l'étiquette, « Identité confirmée »
   puis « Donner les médicaments » ; sinon « Ce n'est pas la bonne personne ». Un bracelet inconnu peut être associé au résident de l'étiquette (démonstration).
Étiquettes de test : `database/etiquettes_demo/` (12 résidents de la base, un PNG chacune + `planche_etiquettes_A4.pdf` à imprimer, ou à afficher à l'écran).
Après `npm install` (nouvelle dépendance `tesseract.js`). Les étiquettes dépendent des données de `demo_du_jour.ps1` (prises de 8 h du jour).
