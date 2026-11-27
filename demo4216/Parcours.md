# Parcours de la démo 4216

- **Administration**. Attribuer ou révoquer les badges des agents dans Comptes. Gérer les QR et les bracelets des résidents dans leur fiche.
- **Aide-soignant et infirmier**. Scanner et confirmer l’identité, puis ouvrir la tournée autorisée. Vérifier les créneaux publiés dans **Planning**. Utiliser Pointage RFID avec son propre badge. Dans Relève, le résumé s’affiche d’abord. Ouvrir **Transmissions de l’équipe** pour enregistrer ou prendre en charge une action.
- **Service en salle**. Scanner et confirmer l’identité. Si la personne est déjà installée, le panneau de sa table s’ouvre. Sinon, sélectionner une table puis confirmer l’installation. Gérer le chevalet depuis le panneau. Pointer avec le badge du compte connecté.
- **Médecin**. Identifier un résident et ouvrir le dossier médical après confirmation.

La démo partage l’API d’intégration. Une lecture par code ou clavier permet d’essayer les flux sans lecteur physique.

## Relancer depuis GitHub

Depuis la branche `feature/demo-4216`, démarrez la démo avec Docker Compose. Le navigateur utilise un seul point d’entrée et l’API les mêmes données PostgreSQL pour tous les profils.

```sh
docker compose -f docker-compose.yml -f docker-compose.4216.yml up -d --build frontend-4216
```

Ouvrez [la démo](http://localhost:4216/login). Le premier démarrage charge le jeu fictif d’origine de `personnel-v2` (`e29a20b`) dans un volume PostgreSQL dédié à 4216. Il contient 80 résidents, 80 chambres, 160 repas et 136 prises pour la date d’initialisation, ainsi que les avatars, les QR, le menu et 10 tables. Le démarrage ajoute aussi les affectations et les badges de test nécessaires à l’API commune. Le volume conserve les modifications entre les redémarrages.

| Compte de démonstration | Profil | Code de badge fictif |
| --- | --- | --- |
| `admin` | Administration | |
| `medecin` | Médecin | |
| `personnel2` | Aide-soignant | `BADGE-DEMO-AIDE` |
| `personnel3` | Infirmier | `BADGE-DEMO-INFIRMIER` |
| `service1` | Service en salle | `BADGE-DEMO-SERVICE` |

Les cinq comptes fictifs utilisent `Demo1234!`. Dans **Scanner**, essayez `NFC-DEMO-002`. Dans **Pointage RFID**, saisissez le code du badge du compte connecté.

Deux personnes qui ouvrent la même instance travaillent sur la même base. Chaque installation Docker indépendante possède son propre volume PostgreSQL et un jeu initial identique. Après le passage de l’ancienne démo à ce volume dédié, reconnectez-vous pour ouvrir une session sur cette base.

## Installer la démo 4216 sur iPhone

Sur le réseau privé Tailscale, le relais transmet `/demo4216/api/` vers le backend du projet Compose `medtech-demo-4216` en retirant le préfixe `/demo4216`. Le backend accepte l’origine Capacitor et utilise le volume de la démo 4216. Pour synchroniser les deux interfaces dans Xcode, lancez depuis `frontend/` la commande suivante en remplaçant l’adresse d’exemple.

```sh
MEDTECH_DEMO_IOS_API_URL=https://mac.tailnet.ts.net/demo4216 npm run ios:demo4216
```

Branchez l’iPhone, sélectionnez-le dans Xcode et lancez **Run**. Le projet utilise le même identifiant iOS que l’application de démo précédente. Cette installation remplace donc sa version sur l’iPhone. Pour vérifier la démo, connectez-vous avec `personnel2` pour la tournée Personnel V2 ou `service1` pour les tables.

### Scanner sur iPhone un bracelet affiché sur le Mac

Dans l’administration de la démo 4216, ouvrez la fiche du résident puis **Bracelet d’identification**. Affichez le QR actif après actualisation de la page. La démo 4216 encode directement le code du bracelet. Vous pouvez conserver le bracelet actif, puis scanner ce QR dans l’app iPhone connectée à la même base 4216.

### Tester le NFC sur iPhone

Dans **Pointage RFID**, touchez **Lire le badge NFC** et approchez le haut de l’iPhone d’une étiquette NFC contenant un enregistrement Texte NDEF avec `BADGE-DEMO-AIDE`. Avec `personnel2`, vérifiez le code affiché, puis confirmez l’arrivée ou le départ. Pour l’identification d’un résident, ouvrez **Scanner → NFC** et utilisez une étiquette de test contenant `NFC-DEMO-002`.

Pour un essai avec une carte étudiante compatible, ouvrez **Bracelet d’identification → Gérer le RFID → Lire la puce NFC** dans l’app iPhone. Lorsqu’aucun texte ou lien NDEF lisible n’est présent, l’app renseigne le numéro de série sous la forme affichée par NFC Tools. Vérifiez le numéro, puis attribuez-le à un résident fictif. Sur un compte Personnel, utilisez **Scanner → Puce NFC** et confirmez le nom et la chambre. L’app effectue une lecture seule.

L’app iOS doit être signée avec une équipe Apple autorisée à utiliser **Near Field Communication Tag Reading** et le réglage Xcode `MEDTECH_NFC_ENTITLEMENTS` doit pointer vers `App/App.entitlements`. En l’absence de ce droit, la saisie et le QR restent disponibles.

## Installer la démo sur Android

Le téléphone doit avoir le NFC activé et pouvoir joindre le même relais HTTPS privé que l’iPhone. La compilation utilise le JDK 21 et le SDK Android 36.

```sh
cd frontend
npm ci
MEDTECH_DEMO_ANDROID_API_URL=https://mac.tailnet.ts.net/demo4216 npm run android:demo4216
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Dans **Administration → Résidents → Bracelet d’identification → Gérer le RFID**, choisissez **Lire la puce NFC** et présentez la carte. Si la puce contient un texte ou un lien NDEF lisible, l’app utilise ce code. Sinon, elle affiche son numéro de série en hexadécimal. Confirmez l’attribution au résident fictif, puis relisez la carte depuis **Scanner → Puce NFC** avec `personnel2`. La lecture ne modifie pas la carte.
