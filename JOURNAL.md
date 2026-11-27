# Journal de travail — MedTech EHPAD

> Journal des travaux réalisés sur le projet (intégration, corrections, design, analyse).
> Tenu à jour au fil des sessions. Branche de travail : `integration`.

---

## Relais Codex du 2026-11-27 — RFID web, pictogrammes et connexion

- Reprise ciblée de `feature/personnel-v2` : lecteur Web NFC lorsque disponible et pictogrammes avec libellés dans l’identification, la fiche de tournée et les tables. Le code fourni par le lecteur ou saisi au clavier reste utilisable.
- Admin gère les badges des agents et les bracelets RFID des résidents. Le parcours d’identité reconnaît le RFID du résident et conserve la confirmation, les QR et les codes existants. Le pointage RFID compare le badge au compte connecté et réutilise les présences, sans modifier les habilitations. Les codes agent sont conservés sous forme d’empreinte et ne sont pas retournés. Migration additive `rfid_badges.sql`.
- La connexion reprend la carte centrée de `feature/personnel-v2` et conserve les comportements de la branche `integration`, dont la reprise après scan.
- PostgreSQL isolé : attribution, remplacement, révocation, refus d’un badge agent étranger, double pointage, ancien code résident, lecture à table, isolation des profils. 36 tests backend et 37 frontend réussis. Chromium a vérifié l’attribution, le pointage, la confirmation d’identité et la connexion à 1280 et 320 px. Les essais physiques NFC/RFID restent à faire.

---

## Relais Codex du 2026-11-27 — lecture des bracelets imprimés depuis le site

- Le scanner iPhone lit le QR du site, puis la validation de l’origine rejetait le lien de la démo imprimé avec `http://localhost:4200`. L’origine du site émetteur est désormais configurable pour le build iOS. L’app extrait le code et le vérifie auprès de l’API habituelle.
- Build iOS resynchronisé avec l’origine de la démo et 34 tests frontend réussis. La lecture du bracelet sur l’appareil reste à confirmer après installation de cette version.

---

## Relais Codex du 2026-11-27 — autorisation caméra sur iPhone

- Le lecteur QR existant demande le flux vidéo de la caméra. Ajout de la déclaration d’usage dans le projet iOS, requise pour que l’iPhone puisse demander l’accès. Fichier validé avec plutil. Recompiler dans Xcode et vérifier la lecture d’un QR fictif sur l’appareil.

---

## Relais Codex du 2026-11-27 — saisie de connexion sur iPhone

- L’accès Tailscale à la démo est confirmé sur iPhone. L’API accepte le compte fictif `personnel2`, bien qu’un essai sur l’appareil ait été refusé.
- Désactivation des corrections et de la majuscule automatique pour l’identifiant. Les espaces en bordure de l’identifiant sont retirés à l’envoi. Bundle iOS resynchronisé et vérification sur appareil à reprendre.

---

## Relais Codex du 2026-11-27 — accès privé iPhone hors du Wi-Fi de la maison

- Le Mac et l’iPhone sont connectés au même réseau Tailscale. Tailscale Serve fournit une origine HTTPS privée et transmet les requêtes au relais du Mac sur `127.0.0.1:8767`, connecté à la base fictive iOS existante.
- Page de test HTTPS et connexion fictive Service vérifiées depuis le Mac. Bundle Angular iOS reconstruit et synchronisé avec l’origine Tailscale. L’installation de cette version avec Xcode et sa connexion depuis l’iPhone restent à vérifier.

---

## Relais Codex du 2026-11-27 — zone sûre iPhone

- La capture iPhone confirme l’arrivée de Sofia sur les tables. La barre d’état iOS recouvrait l’en-tête.
- Le conteneur Angular applique les marges de sécurité fournies par l’écran. Bundle iOS recompilé et synchronisé. Le rendu de l’en-tête reste à confirmer sur l’appareil après relance dans Xcode.

---

## Relais Codex du 2026-11-27 — test réseau natif depuis la connexion iOS

- L’autorisation réseau local n’a pas résolu l’erreur de connexion signalée. Le journal HTTP ne montre aucune requête de connexion de l’application.
- Une erreur réseau sur la page de connexion iOS déclenche désormais un GET natif via Capacitor vers la page de test, sans transmettre les identifiants. Son résultat ou l’erreur système est affiché sur l’iPhone pour distinguer l’accès HTTPS du comportement de la vue web. Bundle iOS resynchronisé et 33 tests frontend réussis. Résultat sur l’appareil en attente.

---

## Relais Codex du 2026-11-27 — accès réseau local dans l’application iOS

- La page de test HTTPS s’affiche dans Safari sur l’iPhone. Le dernier essai depuis l’application ne figure pas dans le journal HTTP, dont le fonctionnement est confirmé depuis le Mac.
- Ajout de la déclaration iOS pour les connexions réseau locales. L’API du bundle reste en HTTPS. Relancer la cible iPhone dans Xcode et vérifier la connexion sur l’appareil.

---

## Relais Codex du 2026-11-27 — diagnostic HTTPS sur iPhone

- L’application signée s’ouvre sur l’iPhone. La connexion échoue et Safari a affiché un avertissement de certificat. La chaîne TLS et la connexion au compte fictif fonctionnent depuis le Mac.
- Ajout du chemin `/connexion-test` au proxy de démo. Le message est vérifié depuis le Mac et sert à tester la connexion Safari de l’iPhone sans saisir d’identifiants.

---

## Relais Codex du 2026-11-27 — données et accès pour la recette iPhone

- Relancé les scripts datés sur la base fictive dédiée iOS sans remise à zéro. L’API HTTPS sert 24 résidents, un dossier médical fictif, 42 repas côté aide-soignant, 12 prises côté infirmier et 22 plateaux au déjeuner. Planning publié, relève Nuit, tables et menu vérifiés par lecture d’API.
- Les huit comptes se connectent. Vérifié les refus pour les médicaments côté aide-soignant, l’administration côté Service et le dossier médical côté Cuisine. Le guide donne la commande de renouvellement et les essais à rejouer dans l’application installée.
- L’application iPhone reste à compiler et installer avec Xcode complet, puis à tester sur l’appareil.

---

## Relais Codex du 2026-11-27 — API iOS HTTPS sur le Mac

- Aucun Raspberry Pi disponible. Le Mac héberge la démo iOS sur son Wi-Fi via Caddy, avec une base et un secret JWT dédiés, une autorité TLS locale et une origine CORS limitée à Capacitor.
- API démarrée sur `https://192.168.1.57:8443`. Certificat vérifié depuis le Mac, prérequêtes CORS acceptées pour Capacitor, origine tierce refusée, huit connexions fictives et flux des tournées vérifiés. Bundle iOS synchronisé avec cette adresse.
- Installation du certificat sur l’iPhone et installation USB de l’application encore à vérifier. Xcode complet est requis sur le Mac. Le [guide mobile](docs/mobile.md#héberger-lapi-ios-de-démonstration-sur-le-mac) documente le démarrage et la préparation du certificat.

---

## Relais Codex du 2026-11-27 — projet iOS pour installation USB

- Ajout du projet Xcode iOS avec Capacitor 8 et Swift Package Manager. La cible embarque Angular et le build reçoit l’origine HTTPS de l’API de démo. Les étapes de signature et de branchement sont dans le [guide mobile](docs/mobile.md#installer-lapplication-ios-par-usb).
- Build Angular iOS, synchronisation Capacitor, validation des fichiers Xcode avec plutil et 33 tests frontend réussis. L’origine d’exemple est un paramètre de vérification du build. Il reste à configurer une API HTTPS joignable, à disposer de Xcode complet et à signer et tester sur l’iPhone.

---

## Relais Codex du 2026-11-27 — démo Safari sur iPhone

- Le build Docker utilise une API de même origine via nginx, avec transmission sans tampon du flux des tournées. Le serveur Angular de développement conserve son URL locale habituelle.
- Le [guide mobile](docs/mobile.md#recette-safari-sur-le-wi-fi-du-mac) lance une stack fictive isolée sur le Wi-Fi privé du Mac. La stack `medtech-iphone` tourne sur le port 4201 à la fin de la session pour la recette Safari.
- Compilation Docker et 33 tests frontend réussis. Depuis le Mac, page de connexion chargée via son IP Wi-Fi, authentification des huit comptes, flux des tournées reçu et accès Administration refusé au compte Service. L’ouverture depuis l’iPhone reste à vérifier sur l’appareil. La version native iOS reste à construire avec Xcode.

---

## Relais Codex du 2026-11-27 — cadrage Android et iOS

- `integration` synchronisée en fast-forward sur le relais `829a170` avant l’audit. Le [cadrage mobile](docs/mobile.md) compare PWA, Capacitor et client séparé. Il propose de tester le site responsive sur téléphone, puis d’embarquer Angular dans Capacitor pour conserver les parcours et contrôles existants.
- Le guide décrit l’accès HTTPS à la démo, le JWT et la reprise après suspension ou coupure. Il s’appuie sur la recette des huit comptes, le planning publié, les affectations actives, la relève jour/nuit et les tables de Sofia.
- Session de cadrage documentaire. Le build natif et la recette sur téléphones restent à réaliser. Les prescriptions restent à cadrer et les essais caméra et RFID physiques attendent le signal de l’équipe.

---

## Relais du 2026-11-27 — démarrage du chantier mobile

- Le site web de référence est sur `integration`. Le dernier changement fonctionnel est `0422f34` : Sofia ouvre les tables directement après connexion et les soignants y accèdent depuis leur tournée. Vérifié dans Chromium, dont l’accueil Service à 320 px. Les 33 tests frontend passent. Le dernier lot planning, relève et Cuisine a aussi passé les 36 tests backend et été vérifié avec les huit comptes fictifs.
- La base de démonstration locale avait 24 résidents, 16 chambres et 44 repas lors de la dernière recette. Les repas, les prises et les affectations sont datés. Utiliser les scripts fictifs versionnés décrits dans la recette pour compléter le jour du test sans réinitialiser le volume.
- Guides de référence : [parcours par rôle](docs/parcours.md), [recette par compte](docs/recette.md), [valeurs à saisir](docs/saisie-guidee.md), [circuit du plateau](docs/circuit-plateau.md) et [prescriptions](docs/prescriptions.md). Marie Exemple sert de référence remplie. Élise Démonstration est l’exercice de saisie manuelle.
- Objectif de la prochaine session : créer une application mobile à partir du site Angular existant et de son API Spring Boot. Comparer d’abord la réutilisation du frontend dans une enveloppe mobile et un client séparé selon les besoins Android/iOS, caméra et RFID. Garder l’API et les autorisations serveur comme référence. Prévoir l’accès à l’API depuis un téléphone réel, la gestion de session, le retour réseau et les parcours propres à chaque rôle. Aucun choix de technologie mobile n’a été arrêté.
- Les prescriptions et leur logiciel de référence restent à cadrer avec l’établissement. Les essais caméra et RFID physiques restent reportés. La recette manuelle complète reste à dérouler.

---

## Relais Codex du 2026-11-27 — accès direct aux tables

- Le profil Service arrive sur les tables intégrées à sa page d’accueil. Le bouton intermédiaire et l’ouverture automatique d’une fenêtre ont été supprimés. Le raccourci depuis les tournées reprend le même tableau dans une fenêtre.
- Build et 33 tests frontend réussis. Chromium a vérifié les deux accès, le menu et la largeur de 320 px pour le profil Service.

---

## Relais Codex du 2026-11-27 — aperçu fictif et saisie guidée

- La démo complète les jeux fictifs avec les résidents du lot administratif. Marie Exemple, Odette Fictive, Lucien Imaginaire et Georgette Brouillon disposent d’exemples de dossier, régime, allergies, préférences, poids, observations et notes. Le script versionné cible les codes de démonstration et conserve les valeurs renseignées.
- La [saisie guidée](docs/saisie-guidee.md) donne les valeurs à entrer et les résultats attendus par formulaire. Élise Démonstration sert à la saisie manuelle et n’est pas précréée dans la démo locale. Les tournées et les plateaux d’exercice utilisent des repas ou prises déjà planifiés.
- Vérifié sur PostgreSQL isolé et dans la démo locale : chargement et réexécution sans doublon des données d’aperçu. Chromium a vérifié le dossier de Marie, puis la création de la chambre, d’Élise et de son dossier par les formulaires sur la base isolée.

---

## Relais Codex du 2026-11-27 — planning publié, relève ciblée et cuisine

- Le planning regroupe les affectations par jour et équipe. Un brouillon ne figure dans aucun créneau agent et n’ouvre aucun accès. La publication et le remplacement sont disponibles depuis l’administration. **Mes services** montre les créneaux publiés. La vue planning indique les étages sans affectation publiée dans la sélection.
- La relève peut cibler Jour ou Nuit. Son auteur voit la transmission et l’équipe destinataire peut la prendre en charge et la clôturer. Le résumé de l’aide-soignant continue de fonctionner sans interroger les prises.
- L’espace Cuisine a une autorité serveur propre, une publication de menu et un suivi des plateaux par version des consignes et du menu. Service en salle voit les états sur ses tables après actualisation. Une confirmation obsolète est rejetée.
- Recette sur PostgreSQL isolé : huit comptes, publication et garde à cheval sur deux jours, relève Nuit, refus interrôles, cycle Préparé → À revérifier → Corrigé et nouvelle revérification après publication du menu. Chromium a ouvert les huit comptes et vérifié le planning, la relève, les tables et la correction d’un plateau sur mobile. 36 tests backend et 33 frontend passent.
- Le script fictif `seed_recette.sql` complète la base locale sans effacer l’historique. La démo existante contient 12 résidents et chambres, 10 tables, 24 repas et 12 prises du jour. Une base fictive neuve contient 24 résidents, 16 chambres et davantage de repas. La [fiche de recette](docs/recette.md) détaille les essais manuels et les vérifications restantes.

---

## Relais Codex du 2026-11-27 — affectations par étage et créneau

- **Administration → Comptes → Affectations** permet d’accorder une plage par étage, de la retirer et de transférer atomiquement la période restante à un collègue actif de même fonction.
- Les tournées, leur validation et leurs rejeux, les fiches et l’appétit côté Personnel, les changements de lieu, l’OCR de pochette et l’Assistant appliquent le périmètre actif. Les autorisations du Service en salle et les transmissions de relève suivent leurs circuits propres. Les résidents sans chambre sont exclus des secteurs.
- Migration additive `staff_assignments.sql` et jeu fictif renouvelable par jour. Vérifié sur PostgreSQL isolé : accès avant/après créneau, refus hors étage, remplacement et refus du rejeu après transfert. Chromium a vérifié l’ajout depuis Comptes. 36 tests backend et 33 tests frontend réussis. Le volume local garde les repas datés du 26 novembre et a reçu les affectations du 27.

---

## Relais Codex du 2026-11-27 — droits médicaments par fonction

- Lecture et validation des prises ainsi que l’OCR de pochette réservés aux comptes Personnel avec fonction INFIRMIER. La validation vérifie la fonction avant tout reçu idempotent. Les écrans et l’Assistant suivent le même droit.
- L’aide-soignant conserve la tournée Repas et ouvre la relève via **Transmettre un écart de prise**. Le compte Service reste sur les tables. Le dossier de prescription et les affectations datées qui limiteront les tournées par secteur restent à intégrer.
- 36 tests backend et 33 tests frontend réussis. Chromium a vérifié les parcours IDE et aide-soignant. Sur PostgreSQL isolé, vérification de la lecture et de la validation IDE, du refus Aide-soignant/Service/Administration par API, du maintien des repas et du filtrage de l’Assistant.

---

## Relais Codex du 2026-11-27 — fonctions et équipes dans l’administration

- Le formulaire Comptes attribue les fonctions infirmier, aide-soignant et service en salle et l’équipe de jour ou de nuit. La liste distingue rôle, fonction et équipe. Les comptes historiques sans profil restent utilisables.
- L’API réserve le profil au rôle PERSONNEL, enregistre fonction et équipe ensemble et révoque les sessions quand l’affectation change. Un changement vers un autre rôle retire le profil. Les clients qui omettent les champs conservent le profil d’un compte Personnel existant.
- Vérifié sur PostgreSQL isolé : création Service, modification vers infirmier de nuit, révocation, refus hors admin, validation des champs et compatibilité des mises à jour sans profil. Chromium a vérifié la modification de l’équipe depuis le formulaire. 35 tests backend et 33 tests frontend passent. Les droits par action des IDE et aides-soignants et par secteur restent à valider.

---

## Relais Codex du 2026-11-27 — accès Service en salle

- Un compte PERSONNEL avec la fonction SERVICE reçoit une autorité serveur propre au service en salle. Accès aux tables, au menu, aux lectures de présence, aux chevalets et à l’identification limitée. Les tournées, les médicaments, les dossiers, les notes et la relève sont refusés. Un changement de profil ferme aussi les abonnements aux tournées.
- Sofia arrive directement sur les tables. Le jeu fictif ajoute `service1` et `personnel3` avec les profils de la branche d’origine. Le script de démo ajoute les comptes absents et conserve les comptes existants.
- Vérifié sur PostgreSQL isolé : profils créés, accès aux tables et refus des routes de soins pour Sofia, accès Personnel pour Hugo. Chromium a vérifié l’ouverture des tables à la connexion de Sofia et leur réouverture. Compilation, 35 tests backend et 33 tests frontend réussis.
- Attribution des fonctions depuis l’administration, habilitations par secteur et distinction IDE/aide-soignant restent à cadrer.

---

## Relais Codex du 2026-11-27 — audit du profil Service et des branches

- Récupéré les branches distantes `feature/*`. Les cinq branches historiques sont dans l’ascendance d’`integration`. `feature/personnel-v2` a un commit supplémentaire, `7b6b3d4`, qui ouvre les tables par défaut pour le profil SERVICE, facilite l’accès des soignants aux tables et simplifie certains écrans.
- La branche historique Personnel prévoyait les comptes fictifs `service1` (Sofia Service, fonction SERVICE) et `personnel3` (Hugo Infirmier), tous deux avec le rôle PERSONNEL. Leurs lignes de seed ne sont pas reprises dans les scripts d’intégration. L’interface Service en salle et la fonction SERVICE existent déjà dans l’intégration.
- À reprendre après revue métier : gestion des profils et affectations depuis l’administration, écran d’accueil Service, jeux de test par fonction et contrôles d’accès serveur. La branche historique exigeait un droit métier pour valider une prise, tandis que l’intégration a conservé le périmètre général PERSONNEL/ADMIN. Distinguer lecture, validation et droits administratifs avant d’activer de nouveaux comptes. Aucun changement fonctionnel lors de cet audit.

---

## Relais Codex du 2026-11-27 — registre de tournée Personnel

- La tournée utilise un registre à colonnes sur ordinateur et une liste de résidents sur mobile. Nom, chambre, consignes, alertes et statut sont alignés. La ligne ouvre la fiche de tournée.
- Créneau, lieu, statut et recherche disposent de champs de même hauteur. Le sélecteur Repas/Médicaments et la progression sont au-dessus des filtres. Guide des parcours et identifiants de démo actualisés.
- Compilation et 33 tests frontend réussis. Vérifié en Chromium : lieu, statut, recherche, fiche résident, impression cuisine et largeur de 320 px en clair et sombre.

---

## Relais Codex du 2026-11-27 — feuille de préparation et responsabilités métier

- Dans **Repas → Outils → Feuille de préparation**, aperçu et impression des totaux du créneau par texture et régime. Les repas à servir couvrent salle et chambres indépendamment des filtres de tournée. Repérage chiffré des consignes à vérifier, sans identité ni chambre.
- Refonte de l’en-tête Personnel, séparation des commandes et de la liste de travail, accès direct à Résidents et fiche d’annuaire réorganisée.
- Vérifié en Chromium sur la démo : feuille agrégée, masquage de la tournée en mode impression, recherche et ouverture d’une fiche résident à 320 px. Compilation et 33 tests frontend réussis.
- L’écran Équipe affiche les présences déclarées. Les tranches de chambres calculées au pointage ont été retirées de cet écran.
- Le guide des parcours consigne la répartition proposée entre cuisine, service et soins ainsi que les interfaces avec prescription et dispensation. Le planning nominatif, l’affectation effective, la date de garde et la source de prescription restent à valider avec l’établissement avant de câbler leurs règles.

---

## Relais Codex du 2026-11-27 — lisibilité de la tournée et cohérence métier

- Tournées avec commandes séparées par des filets, cartes ajustées à leur contenu et statut près du nom sur ordinateur. Annuaire du personnel sous forme de liste avec recherche par nom ou chambre.
- L’écran **Organisation type** indique que les horaires actuels sont des exemples par fonction et par équipe. Le planning nominatif reste à concevoir avec un responsable de publication, des affectations datées et un circuit de remplacement.
- Points de revue métier : la présence déclarée recalcule une répartition indicative des résidents. Une affectation de soins nécessite un responsable et un périmètre explicite. Le menu hebdomadaire est alimenté par les données de démonstration. Il reste à définir qui le publie et qui confirme la prise en compte d’un changement. Les journées de service et les gardes de nuit doivent partager une règle de date et de fuseau.
- Compilation Angular et 33 tests frontend réussis.
- Orientation approuvée pour la cuisine, les habilitations et le circuit des prescriptions. Les responsabilités opérationnelles et le logiciel de référence restent à confirmer avec l’établissement.

---

## Relais Codex du 2026-11-26 — synchronisation des tournées et commandes partagées

- Les listes Repas et Médicaments se rechargent après un signal serveur lié à une transaction validée. Le flux authentifié transporte seulement un signal générique. L’API habituelle reste la source des données affichées. La vérification périodique toutes les dix secondes et au retour du réseau couvre les interruptions du flux. Les fiches ouvertes restent stables pendant la saisie.
- Boutons pleins, secondaires à contour fin, filtres segmentés et champs encadrés appliquent les mêmes dimensions et états de focus. La déconnexion utilise le bouton secondaire partagé. Les rubriques du pied de page sont séparées par un filet. Guide des parcours et README personnel actualisés.
- Migration versionnée `database/tour_updates.sql`. Sur base isolée, Chromium a vérifié la propagation d’un report de repas entre deux comptes avant le rafraîchissement de secours et le refus d’accès hors rôle. L’API a confirmé le signal après validation d’une prise et la fermeture du flux à la révocation. 35 tests backend et 33 tests frontend passent. Contrôles vérifiés dans les trois espaces sous Chromium, en clair et en sombre, jusqu’à 320 px.
- La vue cuisine, les habilitations métier détaillées et le circuit des prescriptions restent à valider avec l’établissement. Les essais caméra et RFID restent reportés.

---

## Relais Codex du 2026-11-26 — confirmation fiable des gestes de tournée

- Repas et prises utilisent une référence de demande créée par la fiche. Le serveur enregistre le reçu et le geste dans la même transaction. Un rejeu par le même compte confirme l’opération déjà acceptée et renvoie l’état courant. La même clé avec une autre validation reçoit un conflit. Une coupure ou une réponse serveur incertaine propose de rejouer exactement la demande tant que la fiche est ouverte.
- Pour servir un repas, l’API exige la version des consignes affichées. Après un conflit, la fiche recharge l’état et garde les actions bloquées si l’actualisation échoue. L’Assistant ouvre le repas ou la prise exacts pour vérification et validation dans le parcours habituel.
- Les deux tournées s’actualisent toutes les dix secondes et au retour du réseau. L’écran indique la dernière actualisation et signale une actualisation indisponible. Le flux serveur continu reste une évolution de pilote.
- Migration additive `care_completion.sql`. Vérifié sur PostgreSQL isolé : six requêtes simultanées avec la même clé produisent une écriture auditée, une clé réutilisée avec un contenu différent est refusée et une version de consignes absente ou obsolète ne permet pas de servir. Chromium a simulé la perte d’une réponse après enregistrement, puis vérifié le rejeu avec la même clé. Le circuit cuisine, les droits métier fins et les prescriptions restent à valider avec l’établissement.

---

## Relais Codex du 2026-11-26 — réorganisation de la tournée

- La tournée ouvre sur le titre, les accès courts à l’identification et au service en salle, puis les filtres et les cartes. Le menu **Outils** regroupe l’annuaire, la relève, le planning, l’équipe, les notes et l’assistant. La progression rejoint les commandes du créneau et les changements de consignes restent visibles.
- Cartes alignées par rangée avec identité, chambre et statut dans des zones fixes. La texture normale et le régime sont présentés en texte. Allergies, textures adaptées et autres points de vigilance gardent un badge avec un libellé. Le pied de page du personnel est compact.
- Guide des parcours et README personnel actualisés. Build et 33 tests frontend réussis. Vérifié dans Chromium sur les trois rôles de 320 à 1 920 px. La tournée a été contrôlée avec ouverture de la relève depuis Outils, du service en salle et d’une fiche résident.

---

## Relais Codex du 2026-11-26 — repères visuels et pied de page

- Ajouté des repères Material Symbols aux écrans principaux et aux sections de soin, à la tournée et aux panneaux d’équipe. Les pictogrammes accompagnent le libellé. La tournée donne une consigne de départ et met en évidence les changements de consignes par une icône et du texte.
- Retiré le motif de plan du pied de page. Les raccourcis existants ont leur pictogramme et une destination par rôle. Le guide des parcours est à jour.
- Build et 33 tests frontend réussis. Vérifié dans Chromium en clair et en sombre pour les trois rôles, de 320 à 1 920 px, avec ouverture du service en salle et navigation depuis le pied de page.

---

## Relais Codex du 2026-11-26 — identité visuelle du site

- Harmonisé l’en-tête, les boutons et les liens avec le vert du logo MedTech. Le logo de l’en-tête ramène à l’accueil du rôle. Le pied de page regroupe les raccourcis utiles en colonnes, séparés du retour en haut. Le motif de plan, de repère et de conversation est décoratif.
- Le rendu reprend les principes d’alignement et de respiration des références visuelles, avec une composition propre à l’outil de l’établissement. Vérifié dans Chromium pour les trois rôles, sur mobile et ordinateur, en clair et en sombre. Build et 33 tests frontend réussis.

---

## Relais Codex du 2026-11-26 — lisibilité permanente, en-tête et pied de page

- Retiré la commande et le réglage Projection. Les contrastes, les cartes et l’échelle typographique s’appliquent dès l’ouverture et s’adaptent à la largeur de l’écran. Les groupes d’actions restent visibles dans la tournée.
- Ajouté un en-tête commun qui met en évidence l’espace connecté et un pied de page avec les raccourcis du rôle et le retour en haut. Le pied de la connexion présente uniquement les commandes publiques.
- Mis à jour le guide des parcours, le guide de test et les README. Vérifié dans Chromium pour les trois rôles à 320, 390, 1 440 et 1 920 px, avec bascule sombre et navigation par le pied de page. Build et 33 tests frontend réussis.

---

## Relais Codex du 2026-11-26 — projection, chevalets et photos

- Ajouté **Projection** aux trois espaces, avec contraste renforcé et texte agrandi sur grand écran. L’espace personnel regroupe les commandes en trois ensembles visibles. Les statuts et alertes restent libellés.
- **Service en salle** permet d’associer et de libérer un chevalet numéroté pour un résident installé, après confirmation. L’unicité est garantie en base, y compris pour des demandes simultanées. Le déplacement de table conserve l’association. Le départ de salle et la désactivation la libèrent. Les écritures sont réservées au personnel pour la salle et les actions sont auditées.
- L’admin peut ajouter, remplacer et retirer la photo dans **Identité et séjour**. JPEG et PNG sont validés côté serveur puis réencodés en JPEG sans recopier les métadonnées. La lecture est authentifiée et les réponses demandent au navigateur de ne pas les mettre en cache. Le médecin voit la photo dans la fiche et le personnel dans la fiche de tournée d’un résident actif.
- Vérifié sur base isolée : 35 tests backend, 33 tests frontend, projection dans Chromium de 320 à 1 440 px, cycle du chevalet et refus de la double attribution, ajout et lecture d’un portrait fictif, refus des écritures hors admin et retrait.
- Migrations additives `chevalet.sql` et `resident_photo.sql`. Le guide [Parcours MedTech](docs/parcours.md) centralise les trois rôles et est relié aux README, au guide de test et au circuit du plateau. Essais caméra et lecteur RFID physiques reportés à la demande de l’utilisateur. Le raccordement autonome dépend du matériel. La dictée distante reste à cadrer avant de transmettre des notes à un prestataire.

---

## Relais Codex du 2026-11-26 — intégration des trois branches

- Fusionné `feature/admin-users` puis `feature/medecin` puis `feature/personnel` dans `integration`. Les cartes, les validations de chambre, les circuits Repas et Médicaments et la relève existante sont conservés. Les résolutions gardent les règles d’accès actuelles et adaptent les apports incompatibles avec ces circuits.
- Admin : la base neuve de démo charge 16 chambres et 24 résidents par `database/setup.sql`. `seed_care.sql` complète les 12 résidents de la tournée par des dossiers fictifs ciblés par identifiant de démo, avec des créneaux et textures compatibles. Aucun nouveau bracelet n’est attribué par ce script. La configuration de migration Docker ne recharge pas les jeux de démo sur une base existante.
- Médecin : les QR imprimés par l’admin ouvrent le parcours navigateur lorsque l’adresse tient dans le format QR. Le code reste dans le fragment jusqu’à la reprise après connexion et est ensuite retiré de l’adresse. Le POST existant retourne l’identité, puis l’utilisateur confirme avant d’ouvrir le parcours de son rôle. Les anciens codes bruts restent utilisables. Aucun GET de données médicales par QR ni transfert de la gestion du bracelet.
- Personnel : intégrés salle, menus datés, planning, équipe et notes texte. L’attribution des actions reste dans la relève, séparée de la répartition indicative de l’équipe. Les tables renvoient seulement l’identité minimale et le statut du repas. Pour servir, la salle ouvre la fiche Repas existante. Les présences sont journalisées et les écritures sérialisées par table et par résident. Les lectures RFID sont opérées depuis un compte personnel authentifié, par saisie ou lecteur qui fournit le code. L’identification confirmée par QR reste disponible pour installer un résident.
- Nouvelle migration additive `database/personnel_service.sql`, applicable aussi sur une base existante. Elle conserve les éventuelles anciennes affectations de tables. `seed_service.sql` est réservé aux jeux fictifs. Les profils sont utilisés pour le planning et la vue équipe. Les droits existants sur les médicaments sont conservés. La dictée distante, le téléversement de photos, les chevalets et le pilotage matériel autonome ne font pas partie de cette intégration.
- Vérifié sur PostgreSQL 17 isolé : initialisation complète, migration relancée deux fois sans effacer les résidents ni la relève, 35 tests backend, 33 tests frontend et build. Chromium couvre la reprise du scan après connexion avec les trois rôles, la confirmation et le refus d’identité, l’accès aux fiches et aux écrans du personnel. Les tests API couvrent les droits par rôle, l’absence de session d’authentification par cookie, les refus CORS, la capacité sous écritures concurrentes et le maintien de la confirmation de risque repas. Caméra et lecteur physiques restent à vérifier.

---

## Relais Codex du 2026-11-26 — lisibilité des cartes et revue avant intégration

- Mis en avant le nom, la chambre et le statut dans les annuaires résident. La tournée personnel partage la même carte en salle et en chambre, pour les repas et les médicaments. Le statut et les alertes ont un libellé et une icône. Les cartes repas montrent tous les éléments « À éviter », les doutes d’identité, la texture, l’aide et les plateaux à revérifier à partir des données déjà fournies au personnel. Hiérarchie appliquée aussi aux chambres, aux comptes et à la relève.
- Build Angular et 31 tests frontend réussis. Vérifié dans Chromium à 320, 390 et 1 280 px, en clair et en sombre, avec nom long et alertes multiples simulés. Les parcours d’ouverture des fiches, de l’annuaire personnel et de la relève ont été essayés avec l’API locale. La matrice de lecture API confirme les accès attendus des trois rôles et le refus anonyme. Cette modification porte sur le frontend.
- Branches récupérées depuis origin et simulations de fusion refaites depuis `1f24419`. Neuf conflits pour `feature/personnel`, onze pour `feature/admin-users` et trois pour `feature/medecin`. Aucune fusion.
- `feature/personnel` : le SQL d’extension s’applique deux fois sur une base PostgreSQL 17 d’intégration isolée. Son `DROP TABLE dining_seat` doit être repris séparément après inventaire et décision sur les affectations historiques. Les notes sont accessibles via le périmètre générique personnel/admin, la vue des tables retourne des fiches résident et la lecture RFID modifie les présences sans droit spécifique au lecteur ni verrou visible sur la capacité. Valider les droits de lecture et d’écriture par fonction, y compris la lecture des médicaments et les comptes historiques sans profil. Reprendre par lots, garder la relève pour les actions attribuées et définir explicitement le lien avec les notes horodatées.
- `feature/admin-users` : le script d’origine a créé 16 chambres et 24 résidents sur une base PostgreSQL 17 vide et isolée. Le script réinitialise les tables et crée 23 QR de démo associés au médecin. Reprendre les données par scripts de démo ciblés dans `database/`, en alignant le scénario QR sur la gestion admin actuelle. Valider ensuite le jeu repris avec l’application intégrée.
- `feature/medecin` : reprendre éventuellement le point d’entrée caméra du téléphone en réutilisant l’identification authentifiée limitée à l’identité, la reprise du scan après connexion et la confirmation avant ouverture de la fiche du rôle. Conserver la gestion du bracelet dans l’administration. La réponse QR proposée contient des informations alimentaires et son URL ne s’insère pas dans le parcours d’authentification actuel. Le scan sur téléphone reste à vérifier.

---

## Relais Codex du 2026-11-26 — revue des branches distantes

- `feature/admin-users` (`c4e0ed6`) enrichit la démo avec 16 chambres, 24 résidents et des données de soin fictives. Le script complet recrée les tables et les QR de démo sont associés au médecin. Reprendre les données sur une base isolée et aligner le scénario QR avec la gestion admin.
- `feature/personnel` (`13d836c`, `e20c930`) ajoute l’interface Service, les tables, le menu hebdomadaire, le planning, les notes et les lectures RFID. Vérifier les droits de lecture et d’écriture, le lien avec la relève et les migrations PostgreSQL. Le code et les scripts touchent des fichiers modifiés dans integration.
- `feature/medecin` est toujours sur `125ec29`, déjà revu. `feature/auth` et `feature/backend-init` sont déjà dans l’ascendance d’integration. `main` (`3f8f9d2`) ajoute un workflow de déploiement du backend via un runner auto-hébergé, déclenché sur push main et configuré sans exécuter les tests Maven.
- Revue statique et simulation Git uniquement. Trois conflits médecin, onze admin et neuf personnel. Aucun changement fonctionnel intégré ni déploiement déclenché.

---

## Relais Codex du 2026-11-26 — revue de la branche médecin de Ran

- Récupéré explicitement `feature/medecin` et examiné son unique commit divergent `125ec29`. Il encode une URL dans le QR pour ouvrir une fiche dans le navigateur, ajoute un aperçu médecin et affiche le nom et la chambre sur le bracelet imprimé.
- Revue statique : le nouveau GET QR serait refusé par la politique serveur actuelle. L’ouvrir aux trois rôles avec la réponse proposée exposerait aussi les allergies et les régimes à l’administration. Le parcours de connexion ne reprend pas le scan initial, car le login redirige vers l’accueil du rôle. La simulation de fusion révèle trois conflits dans le service Angular des résidents et la fiche médecin.
- Aucune fusion réalisée. Si le scan depuis l’appareil photo du téléphone est retenu, réutiliser l’identification authentifiée limitée à l’identité, conserver la confirmation et la gestion du bracelet par l’admin, et vérifier la reprise du parcours après connexion. La branche de Ran n’a pas été exécutée pendant cette revue.

---

## Relais Codex du 2026-11-26 — désactivation d’un résident

- Ajouté « Désactiver le résident » en haut de la fiche admin, avec confirmation distincte de celle du bracelet. La fiche reste consultable, la dernière chambre reste indiquée et le résident est retiré de l’occupation et des listes actives.
- L’API admin désactive le résident et révoque son QR dans la même transaction, avec audit. L’ancien QR reste révoqué après une éventuelle réactivation depuis le formulaire, qui vérifie de nouveau la capacité de la chambre. Une modification ordinaire de la fiche conserve le statut actuel.
- Vérifié dans Chromium et via l’API sur une base isolée : annulation, confirmation, rôles, lit libéré, conservation de la fiche, répétition de la désactivation et rejet de l’ancien QR après réactivation. Les 31 tests frontend et 31 tests backend passent. Aucun résident de la base locale habituelle n’a été désactivé pendant les tests.

---

## Relais Codex du 2026-11-26 — gestion admin du bracelet et coordination du séjour

- La fiche admin place « Coordination du séjour » juste sous l’identité. Elle affiche séparément le service des repas en chambre et le besoin de coordonner l’aide au repas, avec l’état de chargement et un bouton de nouvelle tentative. Ces indicateurs sont en lecture seule et l’API de coordination reste réservée à ADMIN.
- Déplacé la gestion complète du bracelet vers la fiche admin. Seul ADMIN peut consulter les codes, en générer, remplacer ou désactiver. La route médecin précédente est fermée. L’affichage du QR reste volontaire avant impression ou téléchargement.
- ADMIN, PERSONNEL et MEDECIN peuvent identifier un résident actif via `POST /api/identification/bracelet`. La fiche s’ouvre dans l’espace du compte après confirmation. L’API renvoie seulement les éléments d’identité. L’OCR de pochette reste dans le parcours personnel et les API du dossier médical gardent leurs droits actuels.
- Vérifié sur une base Docker dédiée : droits des trois rôles, renouvellement et rejet du code précédent, refus d’un renouvellement basé sur un état périmé, révocation, coordination et parcours médecin dans Chromium. Les 31 tests frontend et les 31 tests backend passent. Caméra physique et impression papier à vérifier.

---

## Relais Codex du 2026-11-26 — bracelet et occupants des chambres

- Ajouté l’identification dans l’espace admin. Les rôles ADMIN et PERSONNEL (aides-soignants dans la démo) utilisent le même service de lecture. La réponse QR est limitée aux éléments d’identité. Le médecin garde les commandes du bracelet et doit afficher le QR avant impression ou téléchargement.
- Après identification, l’utilisateur vérifie l’identité et confirme l’ouverture de la fiche correspondant à son espace. En cas de doute, le résultat est écarté et l’écran invite à contacter un collègue. Ce refus concerne le rapprochement proposé et ne consigne pas de doute sur le dossier d’une personne dont l’identité est incertaine.
- Les cartes de chambres affichent sur demande les occupants actifs avec accès à leurs fiches. La fiche admin rappelle le numéro de chambre et distingue les occupants actuels d’une ancienne affectation. Le formulaire admin possède déjà le statut « Résident actif ». Le motif et la date de sortie restent à cadrer.
- Comparé les réponses API anonyme, médecin, admin et personnel. Vérifié dans Chromium le doute, la confirmation, les liens vers les fiches, et l’affichage volontaire du code. Lecture par saisie du code vérifiée, caméra physique non testée.

---

## Relais Codex du 2026-11-26 — saisie libre explicite

- Ajouté « Autre — saisir une valeur » aux suggestions d’allergie, gravité, régime et texture. Le choix libère le champ pour saisir une valeur. Chromium confirme sur le site local que seules les valeurs saisies sont envoyées dans les requêtes des deux formulaires.

---

## Relais Codex du 2026-11-26 — fiches résident et aide à la saisie

- Aligné l’identité et le séjour sur les fiches admin et médecin. L’admin modifie les informations administratives et conserve la vue des occupants. Le lien d’un occupant recharge la fiche, les occupants et les actions du bon résident.
- Ajouté un résumé admin « Coordination du séjour » en lecture seule. Il indique le service en chambre et le besoin de coordonner l’aide au repas, sans exposer les notes, allergies, régimes, poids, traitements ou QR. Les protections des API existantes sont conservées.
- Ajouté des suggestions filtrables pour allergie, gravité, régime et texture. La saisie libre reste possible. Les champs médico-alimentaires affichent des exemples ou des indications, sans préremplir les décisions du médecin.
- Vérifié dans Chromium : changement de résident depuis un occupant, formulaire correspondant, bloc commun identique pour un même ID, accès à l’API de coordination, refus du dossier à l’admin, choix et saisie libre sur mobile. Les 31 tests backend et les 31 tests frontend réussissent.

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

Le [guide des parcours](docs/parcours.md) décrit la projection et les gestes actuels pour les trois rôles. Les essais caméra et RFID physiques sont en attente du matériel.


> Objectif : dérouler chaque rôle et cocher chaque fonctionnalité pour repérer un éventuel problème.

### 👑 ADMINISTRATEUR (`admin` / Demo1234!)
1. **Connexion** → on arrive sur le *Tableau de bord*.
2. **Tableau de bord** : vérifier les tuiles (résidents actifs, lits occupés, taux d'occupation, comptes par rôle, dernières admissions) et l'alerte « résident(s) sans chambre ».
3. **Résidents** : liste, recherche par nom, filtre d'état (Actifs / Tous), pagination (10/page). Ouvrir une fiche (clic sur une ligne).
4. **Créer un résident** (« Nouveau résident ») : nom, dates, chambre. Vérifier les garde-fous :
   - date d'admission **antérieure** à la naissance → refus ;
   - affecter à une chambre **déjà pleine** (capacité atteinte) → refus.
5. **Modifier / désactiver** un résident. Dans **Identité et séjour**, ajouter, remplacer ou retirer une photo fictive. Sur sa fiche, utiliser **Désactiver le résident** pour enregistrer son départ. Vérifier **Coordination du séjour** et **Bracelet d’identification**. Afficher, télécharger, imprimer, renouveler ou désactiver le QR. Après renouvellement, vérifier que le nouveau code identifie le résident et que l’ancien est refusé.
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
5. Dans **Résidents**, utiliser **Identifier un résident** et vérifier le résultat avant d’ouvrir la fiche médicale. La gestion du bracelet se fait dans l’espace admin.
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
9. **Service en salle** : installer un résident, associer un numéro de chevalet, ouvrir la fiche repas et libérer le chevalet. Vérifier qu’un numéro déjà associé ne peut pas être pris par un deuxième résident.
10. Vérifier la lisibilité sur grand écran et sur mobile, les raccourcis du pied de page, le thème sombre et la déconnexion.
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
