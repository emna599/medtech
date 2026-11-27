# Saisie guidée MedTech sur données fictives

Ouvrez la [démo locale](http://localhost:4200). Les comptes fournis utilisent **Demo1234!**. Utilisez une fenêtre par compte, ou déconnectez-vous avant de changer d’espace.

## 0. Comparer avec un dossier déjà rempli

Avec **medecin**, ouvrez **Résidents → Marie Exemple**. Consultez les antécédents, les traitements documentés, les allergies, le régime et les trois relevés de suivi quotidien. Comparez avec **Odette Fictive**, **Lucien Imaginaire** et **Georgette Brouillon**. Avec **cuisine1**, retrouvez Marie sur le plateau de la **chambre 301** au déjeuner. La suite crée un deuxième dossier à saisir soi-même.

## 1. Administration, chambre, résidente et bracelet

Avec **admin**, créez d’abord une chambre dans **Chambres → Nouvelle chambre**.

| Champ | Valeur |
| --- | --- |
| Numéro | 305, ou autre numéro libre à partir de 306 |
| Étage | 3 |
| Capacité | 2 |

Vérifiez les deux places disponibles. Créez ensuite une fiche dans **Résidents → Nouveau résident**.

| Champ | Valeur |
| --- | --- |
| Nom | Démonstration |
| Prénom | Élise |
| Date de naissance | 18/04/1946 |
| Date d’admission | 03/11/2026 |
| Chambre | 305, ou la chambre créée |
| Statut, si proposé | Actif |

Enregistrez et vérifiez que la chambre compte une place libre. Dans **Bracelet d’identification**, générez le QR. Gardez le code pour le test d’identité. Dans **Identité et séjour → Ajouter une photo**, utilisez une image fictive JPEG ou PNG de moins de 1 Mo. Testez le remplacement, puis vérifiez l’aperçu.

## 2. Administration, compte et créneau publiable

Dans **Comptes → Nouveau compte**, saisissez les valeurs suivantes.

| Champ | Valeur |
| --- | --- |
| Identifiant | recette_elise |
| Mot de passe | AtelierRecette305! |
| Nom complet | Ariane Recette |
| Rôle | Personnel |
| Fonction | Aide-soignant(e) |
| Équipe | Équipe de jour |
| Compte actif, si proposé | Oui |

Dans **Ariane Recette → Affectations**, indiquez **Étage 3**. Choisissez comme **Début** l’heure locale actuelle moins cinq minutes et comme **Fin** l’heure actuelle plus deux heures. À 10 h, l’exemple donne 09 h 55 et 12 h 00 le même jour. Enregistrez le brouillon.

Avec **recette_elise**, ouvrez **Outils → Mes services**. Le brouillon doit être absent. Avec **admin**, publiez-le via **Comptes → Planning** ou **Affectations**. Rouvrez **Mes services** dans la session d’Ariane. Vérifiez aussi qu’Élise est visible dans l’annuaire et que les résidents d’un autre étage sont absents.

Pour tester la nuit, publiez le brouillon de **Noa Infirmier de nuit** ou ajoutez un créneau à l’étage 3, d’aujourd’hui à **21 h 00** à demain à **07 h 00**. Dans **Planning**, filtrez **Nuit** et vérifiez les deux dates. Pour le remplacement, sélectionnez un créneau publié puis un collègue actif de même fonction. Un autre créneau actif sur le même étage peut maintenir l’accès de l’ancien titulaire.

## 3. Médecin, dossier, allergies et régime

Avec **medecin**, recherchez **Élise Démonstration**, ouvrez sa fiche et choisissez **Créer le dossier**.

| Champ | Texte à coller |
| --- | --- |
| Antécédents | Exercice fictif. Un changement de chambre a été enregistré à l’admission. Le compte rendu d’accueil est disponible dans le dossier de démonstration. |
| Traitements documentés | Exercice fictif. Une fiche de suivi a été reçue à l’admission. Faire vérifier sa concordance avec le dossier de référence lors de la recette. |

Enregistrez, rechargez et comparez les deux textes. Ce formulaire documente le dossier médical. La création de prescriptions et de prises n’est pas disponible depuis cet écran.

Dans **Allergies**, ajoutez les entrées séparément.

| Allergie | Gravité |
| --- | --- |
| Arachides | Sévère |
| Sésame | Légère |

Modifiez ensuite **Sésame → Modérée** et vérifiez la mise à jour. Pour tester la suppression, ajoutez **Noisettes → Légère**, puis retirez cette troisième ligne.

Dans **Régimes alimentaires → Ajouter**, saisissez un seul régime.

| Champ | Valeur |
| --- | --- |
| Type de régime | Végétarien |
| Texture | Normale |
| Restrictions | Plateau sans viande ni poisson. |
| Intolérances | Lactose. |
| Consignes | Exercice fictif : vérifier le repère de chambre avant la remise du plateau. Présenter les plats séparément. |

Enregistrez, puis ouvrez **Résidents → Élise** dans le compte **recette_elise** et comparez les consignes visibles.

## 4. Personnel, suivi, notes, relève et identité

Sur la fiche d’Élise, ouvrez **Suivi quotidien**.

| Formulaire | Champ | Valeur |
| --- | --- | --- |
| Modifier les préférences | Préférences du résident | Préfère déjeuner près de la fenêtre et boire de l’eau à température ambiante. |
| Ajouter au suivi | Poids mesuré | 63,40 kg. Saisir 63.40 si le navigateur exige un point. |
| Ajouter au suivi | Observation | Exercice fictif : a choisi de déjeuner en salle et a participé à l’activité de lecture. |

Enregistrez les préférences et le relevé séparément. Vérifiez l’heure et l’auteur. Avec **medecin**, rouvrez la fiche et vérifiez la lecture du suivi.

Dans **Outils → Notes de service**, sélectionnez **Observation** et saisissez **Exercice fictif : la consigne du déjeuner a été relue dans la fiche.**

Dans **Outils → Relève → Nouvelle transmission**, saisissez les champs suivants.

| Champ | Valeur |
| --- | --- |
| Équipe destinataire | Équipe de nuit |
| Résident | Élise Démonstration |
| Observation | Exercice fictif : la préférence de place en salle a été enregistrée. |
| Action attendue | Vérifier que la préférence est visible, puis clôturer la transmission de recette. |

Avec **personnel_nuit**, prenez en charge l’action puis marquez-la comme faite. Avec Ariane, vérifiez la clôture. Dans **Identifier un résident**, essayez le QR actif d’Élise, confirmez l’identité, puis essayez un code fictif inconnu. Les contrôles physiques caméra et RFID se feront avec le matériel.

## 5. Cuisine et salle, menu, présence et plateau

Utilisez **Marie Exemple, chambre 301**, dont le repas est déjà planifié. Une nouvelle fiche résident ne crée pas de repas ou de prise à elle seule.

Avec **cuisine1**, remplissez **Publier un menu**.

| Champ | Valeur |
| --- | --- |
| Date | Date du jour sur la démo |
| Repas | Déjeuner |
| Entrée | Salade de concombre |
| Plat | Riz aux légumes |
| Accompagnement | Carottes rôties |
| Dessert | Compote de poires |

Avec **service1**, ouvrez **Menu de la semaine** et vérifiez le résultat. Dans **Déjeuner → Table 1 → Installer un résident**, utilisez le bracelet actif de Marie. Générez-le avec admin si nécessaire. Associez le **chevalet 305** s’il est libre et vérifiez sa présence à la table.

Avec **cuisine1**, confirmez la préparation de son plateau. Avec **medecin**, ajoutez à ses consignes **Exercice fictif : vérifier la présentation du plat avant remise.** Actualisez Cuisine et Salle. Le plateau doit afficher **À revérifier**. Confirmez la correction en Cuisine et vérifiez **Corrigé** après actualisation de la table. Enregistrez le départ ou libérez le chevalet pour terminer.

## 6. Tournées, impression et erreurs attendues

| Compte | Manipulation | Valeur ou choix | Vérification |
| --- | --- | --- | --- |
| personnel2 | Repas d’un résident planifié | Déjeuner, À faire, recherche par nom. Ouvrir la fiche et choisir **Plus tard**. | Le statut change. Testez **Servi** sur un autre repas et choisissez une quantité si l’écran le demande. |
| personnel2 | Refus et absence | Deux repas différents. Pour le refus, saisir **Exercice fictif : refus déclaré au moment du service.** | Les deux statuts restent distincts. |
| personnel3 | Prise existante | Ouvrir une prise fictive du secteur, vérifier l’identité et les alertes, puis suivre la confirmation proposée sur la démo. | Seule la prise choisie change. Il n’y a ni dose ni prescription à inventer. |
| personnel2 | Transmettre un écart de prise | Équipe **Nuit**, observation **Exercice fictif : prise non confirmée par l’agent**, action **Demander la vérification à l’IDE référent.** | La relève enregistre le message. La tournée Médicaments reste inaccessible à l’aide-soignant. |
| personnel2 | Assistant | Saisir **Qui n’a pas encore mangé ?**, puis **Résumé du service**. | Les résultats correspondent au secteur du compte et à ses droits. |
| personnel2 | Feuille de préparation | **Repas → Outils → Feuille de préparation → Imprimer la feuille**. | L’aperçu contient les totaux, sans nom ni chambre. |

Pour chaque essai, notez le compte, les valeurs saisies, ce que vous attendiez et ce que vous avez observé. Continuez avec les [quinze scénarios de recette](recette.md) pour les permissions, le réseau et l’affichage.
