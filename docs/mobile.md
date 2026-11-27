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

Le build actuel appelle `http://localhost:8080` et Docker publie le site et l’API sur la boucle locale du Mac. Préparer une URL HTTPS de démo joignable sur le réseau de recette, avec un certificat reconnu par les deux téléphones. Exposer le site et `/api/` via le même reverse proxy et laisser PostgreSQL sur le réseau privé. Pour le site, utiliser une URL d’API relative et laisser passer le flux des tournées sans mise en tampon. Pour l’application embarquée, configurer l’URL HTTPS absolue de l’API par environnement et autoriser uniquement les origines exactes des WebViews dans Spring. Vérifier la politique CSP et tester l’authentification, les requêtes CORS et le flux authentifié sur les deux plateformes. Le flux utilise directement `fetch`, en plus des appels Angular HttpClient.

## Session et réseau

- Reprendre le JWT à durée limitée, la révocation serveur et la déconnexion locale immédiate. Sur mobile, vérifier l’expiration au premier plan avant d’afficher de nouveau un écran privé, puis revalider via un appel authentifié dès que le serveur est joignable. Traiter le 401 du jeton courant en demandant une reconnexion et le 403 en affichant le refus. La première version peut garder le jeton mobile en mémoire et demander une reconnexion après fermeture du processus.
- Afficher l’état de connexion et l’heure de la dernière actualisation. Tester les cas où le Wi-Fi revient mais l’API reste indisponible. À la reprise effective, relancer le flux et recharger les listes autorisées. Les tournées disposent déjà d’une actualisation périodique et d’une reprise sur l’événement réseau.
- Les actes restent confirmés par le serveur. Si la réponse à une validation de tournée est perdue, conserver la référence de la demande tant que la fiche est ouverte et permettre le rejeu explicite prévu par le site. Après fermeture de la fiche ou du processus, consulter l’état serveur avant de refaire le geste. Garder le contrôle de version des consignes, des menus et des droits actifs. Exclure les dossiers, jetons persistants et files de mutations du cache hors ligne du premier lot.

## Critères de recette

Sur Android et iOS, dérouler la [recette sur huit comptes](recette.md) et la [saisie guidée](saisie-guidee.md) avec la base fictive. Vérifier en particulier que Sofia arrive sur les tables, qu’un créneau publié et son remplacement prennent effet dans les tournées, que la relève Nuit reste ciblée et qu’une modification de consigne oblige la Cuisine à revérifier le plateau. Rejouer aussi les accès croisés, le passage en arrière-plan, l’expiration, la révocation et la perte de réponse après une validation.

Utiliser la saisie du code fictif pour l’identification pendant ce lot. Les essais physiques caméra et RFID reprennent au signal de l’équipe. Avant de choisir un plugin RFID, relever le modèle, le type de tag et le mode de connexion du lecteur. Le circuit des prescriptions et son logiciel de référence restent à cadrer avec l’établissement.
