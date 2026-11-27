# Parcours MedTech EHPAD

[Recette par compte et par fonctionnalité](recette.md) · [Exercice de saisie champ par champ](saisie-guidee.md) · [Cadrage Android et iOS](mobile.md)

## Présenter l’application

- Sur la base fictive, utilisez `admin`, `medecin`, `personnel`, `personnel2`, `personnel3` ou `service1`. Le mot de passe de démonstration est `Demo1234!`.
- Les titres, les cartes et les commandes sont lisibles dès l’ouverture, avec une taille adaptée à la largeur de l’écran. Dans l’en-tête, le logo ramène à l’accueil de votre rôle et le bouton lune ou soleil règle le thème. Le pied de page propose les raccourcis du rôle et **Haut de page**.
- Côté personnel, **Identifier un résident** et **Service en salle** sont dans l’en-tête de la tournée. **Résidents** ouvre directement l’annuaire depuis l’en-tête. **Outils** regroupe la relève, l’organisation type, l’équipe, les notes et l’assistant. Les pictogrammes indiquent les sections et les commandes. Les statuts et alertes associent texte et icône.

Les actions principales sont pleines, les actions secondaires ont un contour fin et les liens conduisent vers un autre écran. Les commandes actives se distinguent par leur fond et le focus clavier par un contour visible. Les mêmes repères s’appliquent en thème clair et sombre.

## Administration

1. Ouvrez **Résidents**, recherchez la personne et sélectionnez **Consulter la fiche**. Vérifiez le nom, la chambre et le statut.
2. Dans **Identité et séjour**, choisissez **Ajouter une photo** ou **Remplacer la photo**. Formats JPEG ou PNG, 1 Mo maximum. Utilisez **Retirer la photo** puis confirmez pour la supprimer.
3. Dans **Bracelet d’identification**, l’admin affiche, imprime, renouvelle ou désactive le QR.
4. Ouvrez **Chambres** pour vérifier l’occupation. La désactivation d’un résident libère sa place et son chevalet, puis révoque son QR.

Dans **Administration → Comptes**, créez ou modifiez un compte **Personnel** pour lui attribuer une fonction et une équipe de jour ou de nuit. La fonction **Service en salle** ouvre le parcours Tables. Un changement de fonction ou d’équipe ferme les sessions du compte concerné. Demandez à l’agent de se reconnecter.

Dans **Comptes → Affectations**, choisissez l’étage, le début et la fin du créneau et enregistrez le brouillon. Publiez-le depuis le compte ou depuis **Comptes → Planning**. L’agent le voit dans **Outils → Mes services**. Plusieurs étages nécessitent plusieurs affectations. Pour un remplacement, choisissez **Remplacer** sur le créneau puis un collègue de même fonction. Il récupère la période restante, ou tout le créneau s’il n’a pas encore commencé. Le pointage reste distinct de ce parcours.

## Médecin

1. Ouvrez **Résidents**, recherchez par nom ou chambre, puis ouvrez la fiche.
2. La photo enregistrée est visible dans **Identité et séjour**. Consultez le dossier médical et mettez à jour les allergies, le régime ou la texture selon les droits de l’espace médecin.
3. Un lien QR valide reprend après connexion. Vérifiez l’identité affichée, puis confirmez pour ouvrir la fiche du rôle connecté.

## Personnel

1. Ouvrez **Repas** ou **Médicaments**. Les champs **Créneau**, **Lieu**, **Statut** et **Nom ou chambre** filtrent le registre.
2. Ouvrez la fiche depuis la ligne du résident. Vérifiez le nom, la chambre et les alertes. Le portrait est visible dans la fiche de tournée s’il est renseigné. Utilisez les confirmations demandées pour les repas et les prises à risque.
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


### Médicaments et transmissions

- Dans la démo, un compte Personnel avec la fonction **Infirmier** peut ouvrir et tracer les prises, ainsi qu’utiliser la lecture d’étiquette de pochette.
- Côté aide-soignant, pour signaler une absence, un refus ou un doute à l’IDE, ouvrez **Outils → Transmettre un écart de prise** et consignez l’information dans la relève. Le registre des médicaments et ses validations sont réservés aux comptes habilités.
- Les tournées et les fiches du personnel s’appuient sur les étages de vos affectations en cours. Un résident sans chambre est hors de ce périmètre. Une affectation expirée ou retirée bloque aussi une validation depuis une fiche déjà ouverte.

### Service en salle

Avec le compte de démonstration **service1**, les tables constituent la page d’accueil après la connexion. Sofia peut consulter le menu, enregistrer les arrivées et départs et gérer les chevalets. Le statut du repas reste visible sur la table. La validation du service se fait depuis la tournée de l’équipe qui y est habilitée.

### Espace Cuisine

Le compte de démonstration **cuisine1** ouvre les plateaux et la publication du menu. La préparation enregistre la version des consignes et du menu du créneau. Une modification remet le plateau **À revérifier**. Après correction, actualisez les tables dans Service en salle pour voir l’état **Corrigé**.

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

- Dans **Outils → Équipe**, le pointage affiche les présences déclarées. Pour les actions confiées, consultez la relève. Lors d’une nouvelle transmission, vous pouvez désigner l’équipe de jour ou de nuit comme destinataire.
- Dans **Outils → Mes services**, consultez vos créneaux publiés et l’organisation type. Les gardes et remplacements se vérifient auprès du responsable de service.
- L’annuaire **Résidents** présente une ligne par personne. Recherchez par nom ou chambre, repérez le régime et les alertes, puis ouvrez la fiche.

## Matériel à vérifier avec l’équipe

Les essais caméra et lecteur RFID physiques sont reportés jusqu’à la mise à disposition du matériel. Le tableau **Service en salle** permet de vérifier la sélection de table, l’identification par saisie du code et les chevalets sur une base fictive.
