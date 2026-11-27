# Cadrage MedTech EHPAD pour Android et iOS

## Choix proposé

Embarquer le frontend Angular et Angular Material dans Capacitor pour Android et iOS. La même compilation web fournit les écrans, routes, formulaires et confirmations. Spring Boot reste la référence pour les sessions, les autorisations de rôle et les affectations actives. PostgreSQL et ses scripts versionnés dans `database/` servent les deux clients.

| Option | Apport | Coût ou dépendance |
| --- | --- | --- |
| Angular et Capacitor | Écrans partagés, application installable, accès aux API natives via des plugins | Deux projets natifs à maintenir, compilation et signature par plateforme, recette des WebViews |
| Site mobile ou PWA | Recette tactile rapide dans Safari et Chrome, distribution par URL, installation possible sur l’écran d’accueil | Intégration des lecteurs et contrôle du cycle de vie dépendent du navigateur et du matériel |
| Client séparé Flutter, React Native ou natif | Interface et intégrations propres au mobile, API Spring réutilisable | Écrans, règles d’interaction et recette à maintenir en double |

Commencer la recette sur le site responsive depuis les téléphones, puis vérifier les mêmes parcours dans les builds Capacitor. Utiliser le dossier de sortie navigateur Angular comme `webDir`, avec un `index.html` à sa racine. Prévoir Android Studio pour Android et Xcode avec signature de développement pour un iPhone. Le format et le mode de distribution du pilote restent à confirmer.

[Installation de Capacitor](https://capacitorjs.com/docs/getting-started) · [Environnement de compilation Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup) · [Applications web sur l’écran d’accueil iOS](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

## Accès depuis un téléphone

### Recette Safari sur le Wi-Fi du Mac

Sur un Wi-Fi privé, relevez l’adresse IP Wi-Fi du Mac dans **Réglages Système → Wi-Fi → Détails → TCP/IP**. Depuis le dépôt, remplacez l’adresse de l’exemple et démarrez une base fictive dédiée avec Docker Compose.

```sh
export MEDTECH_LAN_IP=192.168.1.57
docker compose -p medtech-iphone -f docker-compose.yml -f compose.iphone.yml up -d --build
```

Sur l’iPhone connecté au même Wi-Fi, ouvrez `http://192.168.1.57:4201` dans Safari avec l’adresse du Mac. Connectez-vous avec `service1` et `Demo1234!`. Sofia doit arriver directement sur **Tables**. Si Safari ne charge pas la page, vérifiez qu’elle s’ouvre sur le Mac à `http://127.0.0.1:4201`, que l’adresse Wi-Fi du Mac n’a pas changé et que le réseau et le pare-feu autorisent les connexions vers ce port. Vous pouvez utiliser **Partager → Sur l’écran d’accueil** pour créer un raccourci.

Cette instance utilise HTTP et des données fictives. Arrêtez-la après la recette avec la même commande Compose en remplaçant `up -d --build` par `down`. Le volume fictif est conservé.

### Héberger l’API iOS de démonstration sur le Mac

Utilisez un réseau Wi-Fi privé et l’IP Wi-Fi du Mac. Depuis la racine du dépôt, créez une fois le fichier de configuration à l’extérieur du dépôt. Remplacez l’adresse d’exemple par celle du Mac. Conservez ce fichier pour redémarrer le même projet.

```sh
(umask 077
  printf 'MEDTECH_LAN_IP=192.168.1.57\nMEDTECH_IOS_JWT_SECRET='
  openssl rand -hex 32
) > ../medtech-ios-api.env

docker compose --env-file ../medtech-ios-api.env -p medtech-ios-api \
  -f docker-compose.yml -f compose.ios-api.yml up -d --build

docker compose --env-file ../medtech-ios-api.env -p medtech-ios-api \
  -f docker-compose.yml -f compose.ios-api.yml exec -T ios-api \
  cat /data/caddy/pki/authorities/local/root.crt > /tmp/medtech-ios-root.pem
openssl x509 -in /tmp/medtech-ios-root.pem -outform DER -out /tmp/MedTech-Demo.cer
```

Le projet dédié héberge uniquement l’API sur le port 8443 et garde la base fictive dans un volume isolé. Caddy conserve son autorité dans un volume dédié. Envoyez uniquement `MedTech-Demo.cer` à l’iPhone, par exemple avec AirDrop. Installez le certificat reçu dans **Réglages**, puis activez sa confiance dans **Général → Informations → Réglages des certificats**. Retirez ce certificat de l’iPhone après la recette. [Confiance des certificats sur iPhone](https://support.apple.com/fr-fr/102390)

Utilisez `https://192.168.1.57:8443`, avec l’IP du Mac, comme `MEDTECH_IOS_API_ORIGIN` dans les étapes USB. L’iPhone doit rester sur le même Wi-Fi. Si l’IP du Mac change, adaptez le fichier d’environnement, relancez le projet et recompilez le bundle iOS avec la nouvelle origine.

### Installer l’application iOS par USB

Le projet Xcode est dans `frontend/ios/App/App.xcodeproj`. Capacitor embarque le build Angular dans l’application et Swift Package Manager résout ses dépendances iOS. La connexion à Spring Boot nécessite une API de démonstration HTTPS joignable depuis l’iPhone et un certificat reconnu par iOS. Le câble sert à installer et déboguer l’application. Les requêtes passent par le réseau.

1. Installez Xcode 26 ou une version ultérieure compatible avec votre iPhone. Ouvrez Xcode et connectez votre compte Apple dans **Settings → Accounts**.
2. Si vous hébergez l’API ailleurs que sur le Mac selon la procédure ci-dessus, configurez-la pour accepter l’origine `capacitor://localhost`. Sous Docker Compose, utilisez `CORS_ALLOWED_ORIGINS='http://localhost:4200,capacitor://localhost'` lors du démarrage de l’API. Conservez les autres origines explicitement autorisées pour cet environnement si nécessaire.
3. Depuis `frontend/`, compilez et synchronisez en remplaçant l’adresse d’exemple par l’origine réelle de l’API.

   ```sh
   npm ci
   MEDTECH_IOS_API_ORIGIN=https://demo.example.com npm run ios:sync
   npx cap open ios
   ```

4. Branchez et déverrouillez l’iPhone. Confirmez **Faire confiance** si iOS le demande. Dans Xcode, sélectionnez la cible **App**, activez **Automatically manage signing** et choisissez votre équipe ou **Personal Team**. Sélectionnez l’iPhone comme destination et lancez **Run**. Activez le **Mode développeur** sur l’iPhone si Xcode le demande.
5. Ouvrez **MedTech EHPAD** depuis l’écran d’accueil et connectez-vous avec `service1` et `Demo1234!`. Vérifiez l’arrivée sur **Tables** et reprenez la recette fictive par rôle.

[Mode développeur sur iPhone](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device) · [Signature avec un compte Apple](https://developer.apple.com/help/account/basics/about-your-developer-account/)

## Session et réseau

- Reprendre le JWT à durée limitée, la révocation serveur et la déconnexion locale immédiate. Sur mobile, vérifier l’expiration au premier plan avant d’afficher de nouveau un écran privé, puis revalider via un appel authentifié dès que le serveur est joignable. Traiter le 401 du jeton courant en demandant une reconnexion et le 403 en affichant le refus. La première version peut garder le jeton mobile en mémoire et demander une reconnexion après fermeture du processus.
- Afficher l’état de connexion et l’heure de la dernière actualisation. Tester les cas où le Wi-Fi revient mais l’API reste indisponible. À la reprise effective, relancer le flux et recharger les listes autorisées. Les tournées disposent déjà d’une actualisation périodique et d’une reprise sur l’événement réseau.
- Les actes restent confirmés par le serveur. Si la réponse à une validation de tournée est perdue, conserver la référence de la demande tant que la fiche est ouverte et permettre le rejeu explicite prévu par le site. Après fermeture de la fiche ou du processus, consulter l’état serveur avant de refaire le geste. Garder le contrôle de version des consignes, des menus et des droits actifs. Exclure les dossiers, jetons persistants et files de mutations du cache hors ligne du premier lot.

## Critères de recette

Sur Android et iOS, dérouler la [recette sur huit comptes](recette.md) et la [saisie guidée](saisie-guidee.md) avec la base fictive. Vérifier en particulier que Sofia arrive sur les tables, qu’un créneau publié et son remplacement prennent effet dans les tournées, que la relève Nuit reste ciblée et qu’une modification de consigne oblige la Cuisine à revérifier le plateau. Rejouer aussi les accès croisés, le passage en arrière-plan, l’expiration, la révocation et la perte de réponse après une validation.

Utiliser la saisie du code fictif pour l’identification pendant ce lot. Les essais physiques caméra et RFID reprennent au signal de l’équipe. Avant de choisir un plugin RFID, relever le modèle, le type de tag et le mode de connexion du lecteur. Le circuit des prescriptions et son logiciel de référence restent à cadrer avec l’établissement.
