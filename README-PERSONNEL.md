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
| « Je ne le connais pas » | Saisie du code du bracelet (facultatif) pour afficher la fiche, puis confirmation « C'est bien cette personne » |
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
| GET | `/api/personnel/service?kind=REPAS\|MEDICAMENT` | Éléments du jour à servir |
| POST | `/api/personnel/meals/{id}/complete` | Valider un repas (`status`, `comment`) |
| PUT | `/api/personnel/meals/{id}/quantity` | Quantité mangée |
| POST | `/api/personnel/doses/{id}/complete` | Valider une prise de médicament |
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

1. **Salle à manger.** Connexion `personnel`, onglet Repas, Déjeuner. Toucher un résident, **Servi**, choisir la quantité. Le compteur « X / 12 » avance.
2. **Allergie.** Ouvrir un résident allergique (Colette Simon : lactose ; Lucien Roux : arachides) : le bandeau rouge est en haut de la fiche.
3. **Refus.** Ouvrir un résident, **Refusé** : un motif est obligatoire.
4. **Tournée en chambre.** Onglet Chambres, **Démarrer la tournée** : les fiches s'enchaînent dans l'ordre des chambres.
5. **Médicaments.** Bouton Médicaments, même geste avec **Donné**. Les prises « à risque » sont signalées.
6. **Je ne le connais pas.** Saisir `DEMO-001`, vérifier la photo, **C'est bien cette personne**.
7. **Doute d'identité.** Avec `personnel`, ouvrir un résident, **J'ai un doute sur l'identité** puis **Signaler le doute** : Servi/Donné est bloqué. Dans une fenêtre de navigation privée, se connecter avec `personnel2`, ouvrir le même résident et appuyer sur **Confirmer l'identité**. Le blocage disparaît. Le même soignant ne peut pas lever son propre doute.
8. **Changement de lieu.** Dans une fiche, passer un résident de la salle à la chambre : il apparaît dans l'autre onglet.

---

## 6. Thème

Les couleurs viennent du logo MedTech : **vert-bleu** `#0f766e`, **bleu nuit** `#12365c`, **corail** `#e8715a`. Elles sont définies dans `frontend/src/styles.scss` (variables `--brand-*` et jetons Material `--mat-sys-*`). La police est Nunito.

Choix d'accessibilité : zones tactiles d'au moins 48 px, allergies toujours en rouge avec une icône (jamais la couleur seule), focus clavier visible, animations réduites si le système le demande.

---

## 7. Dépannage

| Symptôme | Cause probable |
|---|---|
| Erreur 404 sur `/api/personnel/...` | Un **ancien backend** tourne encore sur le port 8080 : l'arrêter et relancer |
| `APPLICATION FAILED TO START … Port 8080 was already in use` | Idem |
| Le backend s'arrête sur une erreur de validation de schéma | `personnel_additions.sql` n'a pas été exécuté |
| pgAdmin : « authentification par mot de passe échouée » | Utiliser le `DB_PASSWORD` du `.env` |
| Le backend ne trouve pas la base | Variables du `.env` non chargées dans la session PowerShell |

---

## 8. Limites et suite prévue

- Le scan par **bracelet / QR code** est facultatif (client réservé) : seule la saisie du code est faite.
- **Niveau 2** : scan de la pochette par OCR (service Flask de l'équipe, appelé via Spring), assistant « MedTech Assist » (règles d'abord, LLM en option, limité au rôle, confirmation avant action, données fictives uniquement), dictée vocale.
- **Niveau 3** : tendance d'appétit, résumé de relève, mode sombre.
- Pas encore de tests automatisés pour le module personnel.
