# Parcours MedTech EHPAD

## Présenter l’application

- Connectez-vous avec un compte de démonstration du rôle à présenter, sur une base fictive.
- Les titres, les cartes et les commandes sont lisibles dès l’ouverture, avec une taille adaptée à la largeur de l’écran. Dans l’en-tête, le logo ramène à l’accueil de votre rôle et le bouton lune ou soleil règle le thème. Le pied de page propose les raccourcis du rôle et **Haut de page**.
- Côté personnel, **Identifier un résident** et **Service en salle** sont dans l’en-tête de la tournée. **Résidents** ouvre directement l’annuaire depuis l’en-tête. **Outils** regroupe la relève, l’organisation type, l’équipe, les notes et l’assistant. Les pictogrammes indiquent les sections et les commandes. Les statuts et alertes associent texte et icône.

Les actions principales sont pleines, les actions secondaires ont un contour fin et les liens conduisent vers un autre écran. Les commandes actives se distinguent par leur fond et le focus clavier par un contour visible. Les mêmes repères s’appliquent en thème clair et sombre.

## Administration

1. Ouvrez **Résidents**, recherchez la personne et sélectionnez **Consulter la fiche**. Vérifiez le nom, la chambre et le statut.
2. Dans **Identité et séjour**, choisissez **Ajouter une photo** ou **Remplacer la photo**. Formats JPEG ou PNG, 1 Mo maximum. Utilisez **Retirer la photo** puis confirmez pour la supprimer.
3. Dans **Bracelet d’identification**, l’admin affiche, imprime, renouvelle ou désactive le QR.
4. Ouvrez **Chambres** pour vérifier l’occupation. La désactivation d’un résident libère sa place et son chevalet, puis révoque son QR.

## Médecin

1. Ouvrez **Résidents**, recherchez par nom ou chambre, puis ouvrez la fiche.
2. La photo enregistrée est visible dans **Identité et séjour**. Consultez le dossier médical et mettez à jour les allergies, le régime ou la texture selon les droits de l’espace médecin.
3. Un lien QR valide reprend après connexion. Vérifiez l’identité affichée, puis confirmez pour ouvrir la fiche du rôle connecté.

## Personnel

1. Ouvrez **Repas** ou **Médicaments**. Choisissez le créneau, le lieu et le filtre de statut.
2. Ouvrez la fiche depuis la carte. Vérifiez le nom, la chambre et les alertes. Le portrait est visible dans la fiche de tournée s’il est renseigné. Utilisez les confirmations demandées pour les repas et les prises à risque.
3. En salle, ouvrez **Service en salle**, choisissez le créneau et la table, puis **Installer un résident**. Vérifiez l’identité et confirmez sa présence.
4. Sur le résident installé, sélectionnez **Associer un chevalet**, saisissez le numéro imprimé de 1 à 9999 et confirmez. Si le numéro est déjà utilisé, vérifiez l’ancienne affectation avec l’équipe. Le chevalet est disponible après **Libérer le chevalet** et confirmation, ou après **Enregistrer le départ**. Un changement de table conserve le chevalet.
5. Sélectionnez **Ouvrir la fiche repas** pour effectuer la vérification du plateau et enregistrer le service.
6. Pour transmettre une action à poursuivre, utilisez **Outils → Relève**. Pour une note horodatée de service, utilisez **Outils → Notes de service**.

### Synchronisation entre les écrans

- Quand une modification est enregistrée, les listes Repas et Médicaments des écrans connectés se rafraîchissent. Une fiche ouverte garde les informations en cours de vérification et le serveur contrôle la version des consignes à la validation.
- En cas de coupure du flux, la liste tente une actualisation toutes les dix secondes et au retour du réseau. Vérifiez l’heure de dernière actualisation et suivez le circuit de continuité si l’écran signale une indisponibilité.

### Si une validation reste en attente

- Gardez la fiche ouverte. Si le réseau a coupé, **Réessayer la même validation** renvoie la demande initiale. Vérifiez l’état affiché après le retour du serveur avant de refaire un geste.
- Si le serveur signale une consigne modifiée, vérifiez la fiche actualisée et confirmez de nouveau si nécessaire. Si l’actualisation échoue, suivez le circuit de continuité de l’établissement.
- Dans l’Assistant, **Ouvrir la fiche de tournée** ouvre le repas ou la prise proposé. La validation se fait dans cette fiche.


### Préparation cuisine

1. Ouvrez **Repas**, sélectionnez le créneau et choisissez **Outils → Feuille de préparation**.
2. Contrôlez l’heure de dernière actualisation. Le tableau regroupe les repas à servir, salle et chambres comprises, même si la tournée est filtrée. La dernière colonne compte les repas qui demandent une vérification individuelle.
3. **Imprimer la feuille** imprime uniquement les totaux, sans identité ni chambre. Pour préparer ou étiqueter un plateau individuel, consultez les consignes à jour dans le parcours autorisé.

### Décisions à valider avec l’établissement

| Circuit | Responsable proposé | Règle à valider |
| --- | --- | --- |
| Cuisine | Responsable cuisine | Publie le menu et habilite la préparation. Une consigne modifiée après préparation impose une revérification du plateau. |
| Service des repas | Responsable de secteur | Confirme les affectations datées. L’agent affecté trace le service. La présence déclarée reste un indicateur d’effectif. |
| Soins et médicaments | Responsable des soins | Confirme le périmètre de l’équipe, les remplacements et les actions délégables selon le protocole. |
| Prescription et dispensation | Prescripteur et pharmacien, selon le circuit local | Identifier le logiciel de référence et la provenance de la version active. La tournée rattache chaque prise à cette version et exige une relecture si elle change. |

Avant de formaliser les droits, préciser qui attribue les accès par secteur, qui remplace le responsable et comment les droits temporaires expirent. Tester sur données fictives une correction de plateau, une sortie de secteur, une prescription arrêtée avec une fiche ouverte et une garde qui traverse minuit.

### Organisation de l’équipe

- Dans **Outils → Équipe**, le pointage affiche les présences déclarées. Pour les actions confiées, consultez la relève.
- Dans **Outils → Organisation type**, consultez un exemple de déroulement par fonction et par équipe. Les gardes et remplacements se vérifient auprès du responsable de service.
- L’annuaire **Résidents** présente une ligne par personne. Recherchez par nom ou chambre, repérez le régime et les alertes, puis ouvrez la fiche.

## Matériel à vérifier avec l’équipe

Les essais caméra et lecteur RFID physiques sont reportés jusqu’à la mise à disposition du matériel. Le tableau **Service en salle** permet de vérifier la sélection de table, l’identification par saisie du code et les chevalets sur une base fictive.
