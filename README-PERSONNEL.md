# MedTech EHPAD — Espace PERSONNEL (niveau 1)

Interface destinée aux soignants (aides-soignants, infirmiers) pour **servir les repas** et **donner les médicaments**, en salle à manger comme en chambre, avec une identification fiable du résident.

Principe de conception : **« un écran, un geste »**, pensé d'abord pour la tablette, avec de grandes zones tactiles et le moins de saisie possible.

> Toutes les données de démonstration sont **fictives**.

---

## 1. Ce que fait l'application

| Fonction | Description |
|---|---|
| Accueil | Choix **Repas / Médicaments**, créneau (déjeuner, dîner, matin, midi, soir), progression « X / Y faits », recherche par nom ou chambre, filtre À faire / Faits / Tous |
| Salle à manger | Cartes résidents avec nom, chambre, statut et alertes. **Service en salle** permet de gérer les présences et les chevalets |
| Chambres | **Liste ordonnée par chambre** avec « Démarrer la tournée » : après chaque validation, la fiche du résident suivant s'ouvre |
| Fiche résident | Photo, **bandeau rouge d'allergies**, régime et texture, actions **Servi / Donné**, **Refusé** (avec motif), **Plus tard**, quantité mangée, changement de lieu (salle ↔ chambre) |
| Doute d'identité | Le soignant signale un doute : **Servi / Donné est bloqué** tant qu'un **autre** soignant ne l'a pas levé |
| « Je ne le connais pas » | Saisie du code du bracelet (facultatif) pour afficher la fiche, puis confirmation « C'est bien cette personne » |
| Assistant | Bouton **Assistant** (en bas à droite) : questions en français, écrites ou **dictées à la voix**, réponses sur le service en cours. Il **propose** une validation, le soignant **confirme** |
| Appétit | Dans la fiche d'un repas : graphique des 7 derniers jours (une barre par jour) et alerte **« en baisse »** quand les trois derniers jours sont nettement moins bons ou sous la moitié. L'assistant répond aussi à « appétit de Mme Martin ? » |
| Affichage | Contraste et tailles de lecture adaptés à l’écran par défaut. Bouton lune / soleil pour choisir le thème |
| Relève | Bouton **Relève** pour transmettre et attribuer les actions à poursuivre, consulter les clôtures et copier le résumé du service |
| Pochette (OCR) | Dans « Je ne le connais pas » : **Photographier l'étiquette d'une pochette**. Le service OCR de l'équipe lit le nom, Spring retrouve le résident, et le soignant **compare le visage à la photo** avant de continuer. Facultatif : sans service OCR, un message l'indique |
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
| `features/personnel/identify-dialog/` | Écran « Je ne le connais pas » |
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
| `seed_personnel.sql` | 12 résidents fictifs, repas et prises du jour, **re-jouable** |
| `install_personnel.sql` | Les deux scripts ci-dessus à la suite |

---

## 3. API

Toutes les routes demandent l'en-tête `Authorization: Bearer <jwt>`.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/personnel/residents?search=` | Liste des résidents actifs |
| GET | `/api/personnel/residents/{id}` | Fiche d'un résident |
| PUT | `/api/personnel/residents/{id}/meal-location` | Salle ↔ chambre |
| POST | `/api/personnel/identify` | Retrouver un résident par code de bracelet |
| POST | `/api/personnel/identify/pochette` | Photo d'une étiquette (champ `photo`) : résident proposé par l'OCR |
| GET | `/api/personnel/residents/{id}/appetite?days=7` | Appétit des derniers jours (3 à 14) |
| GET | `/api/personnel/service?kind=REPAS\|MEDICAMENT` | Éléments du jour à servir |
| POST | `/api/personnel/meals/{id}/complete` | Valider un repas (`status`, `comment`) |
| PUT | `/api/personnel/meals/{id}/quantity` | Quantité mangée |
| POST | `/api/personnel/doses/{id}/complete` | Valider une prise de médicament |
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
| `personnel2` | `Demo1234!` | Léa Infirmière : lever un doute d'identité |
| `admin`, `medecin` | `Demo1234!` | Autres espaces |

Codes de bracelet de démonstration : `DEMO-001` à `DEMO-012`.

---

## 5. Parcours de test

Le [guide des parcours](docs/parcours.md#personnel) décrit les écrans actuels, les confirmations et les essais reportés. Sur grand écran, l’affichage s’adapte automatiquement. Le pied de page donne un accès rapide aux tournées et au retour en haut.

Dans **Service en salle**, installez un résident après vérification de son identité. Sélectionnez **Associer un chevalet**, saisissez le numéro imprimé et confirmez. Le chevalet s’affiche sur la carte. Pour le rendre disponible, confirmez sa libération ou enregistrez le départ. **Ouvrir la fiche repas** mène à la validation habituelle du plateau. Le portrait ajouté par l’administration apparaît sur cette fiche quand il est disponible.


1. **Salle à manger.** Connexion `personnel`, onglet Repas, Déjeuner. Toucher un résident, **Servi**, choisir la quantité. Le compteur « X / 12 » avance.
2. **Allergie.** Ouvrir un résident allergique (Colette Simon : lactose ; Lucien Roux : arachides) : le bandeau rouge est en haut de la fiche.
3. **Refus.** Ouvrir un résident, **Refusé** : un motif est obligatoire.
4. **Tournée en chambre.** Onglet Chambres, **Démarrer la tournée** : les fiches s'enchaînent dans l'ordre des chambres.
5. **Médicaments.** Bouton Médicaments, même geste avec **Donné**. Les prises « à risque » sont signalées.
6. **Je ne le connais pas.** Saisir `DEMO-001`, vérifier la photo, **C'est bien cette personne**.
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
- Nouveau test Java : `ResidentServiceTokenTest`.

## 8. Tests automatiques

```powershell
# Frontend : 26 tests (modèles, appels HTTP, assistant, graphique d'appétit)
cd frontend
npx ng test --watch=false

# Backend : assistant et tendance d'appétit (JUnit + Mockito, sans base de données)
cd backend
.\mvnw.cmd test -Dtest="AssistantServiceTest,AppetiteServiceTest,PochetteScanServiceTest"
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
