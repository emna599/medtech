# Recette MedTech sur données fictives

[Valeurs à saisir dans les formulaires et vérifications attendues](saisie-guidee.md) · [Cadrage Android et iOS](mobile.md)

## 1. Préparer les données

Sur une base de démonstration neuve, le démarrage Docker initialise 24 résidents, 16 chambres, des tables, un menu, des repas et des prises fictifs, des consignes alimentaires et l’historique de consommation. Il ajoute aussi un brouillon de garde de nuit et une transmission destinée à cette équipe. Les comptes ci-dessous utilisent `Demo1234!`.

Sur la démo locale déjà initialisée, lancez les migrations puis les scripts fictifs pour compléter la journée. Ces commandes ne doivent viser que la base de démonstration.

```sh
docker compose up -d --build
docker compose exec -T db psql -U postgres -d medtech -v ON_ERROR_STOP=1 --single-transaction \
  -f /sql/seed_dining_accounts.sql -f /sql/seed_kitchen.sql \
  -f /sql/seed_staff_assignments.sql -f /sql/seed_recette.sql
```

La relance le même jour ajoute les éléments manquants. Elle conserve les repas et prises existants, leurs statuts et les transmissions déjà traitées. Pour rejouer un cas déjà consommé, utilisez une base fictive isolée ou choisissez un autre résident/créneau. N’inscrivez aucune donnée réelle dans cette base.

## 2. Ouvrir les sessions

Sur iPhone, ouvrez **MedTech EHPAD** après l’[installation USB](mobile.md#installer-lapplication-ios-par-usb). Connectez l’iPhone au Wi-Fi privé du Mac qui héberge l’API. Déconnectez-vous entre deux comptes. Pour les scénarios simultanés ou les changements de rôle pendant une session, utilisez un deuxième appareil ou la démo web configurée sur la même base fictive.

Pour la recette de l’application installée, commencez par Sofia, puis connectez les autres comptes. Après avoir vérifié les accueils, essayez le retour au premier plan, la déconnexion et la reprise après coupure du Wi-Fi. Sur une tournée, contrôlez l’heure de dernière actualisation après le retour réseau. Les essais matériels et l’impression iOS restent à vérifier sur les appareils concernés.

| Compte | Rôle attendu | Contrôle rapide |
| --- | --- | --- |
| `admin` | Administration | Comptes, planning, résidents, chambres et bracelets |
| `medecin` | Médecin | Annuaire, dossier médical, allergies, régime et texture |
| `personnel` | Personnel | En base neuve, profil infirmier de jour |
| `personnel2` | Aide-soignant de jour | Repas, relève et écart de prise |
| `personnel3` | Infirmier de jour | Repas et Médicaments dans les secteurs actifs |
| `personnel_nuit` | Infirmier de nuit | Créneaux publiés et relève destinée à la nuit |
| `service1` | Service en salle | Tables au démarrage, menu, places et chevalets |
| `cuisine1` | Cuisine | Plateaux, corrections et publication du menu |

Sur un volume ancien, vérifiez les fonctions dans **Administration → Comptes**. Les comptes historiques peuvent avoir été créés avant l’ajout des profils.

## 3. Tester une fonctionnalité à la fois

| Étape | Manipulation sur données fictives | Résultat attendu |
| --- | --- | --- |
| 1. Connexions | Connecter chaque compte, vérifier l’espace et se déconnecter. | Le bon espace s’ouvre. Après déconnexion, les écrans privés demandent une session. |
| 2. Administration | Créer un compte de test. Modifier sa fonction, vérifier que sa session se ferme et le désactiver. | Le compte change d’accès après reconnexion. La désactivation empêche la connexion. |
| 3. Résident, chambre et bracelet | Créer un résident fictif, lui affecter une chambre disponible, puis imprimer le bracelet. Lire son QR depuis le parcours d’identification. | L’identité doit être confirmée. Tester aussi l’ancien code après renouvellement. |
| 4. Planning | Ouvrir **Comptes → Planning**, filtrer sur Nuit puis publier le brouillon de Noa. Ouvrir **Mes services** avec le compte nuit. | Le brouillon est invisible côté agent avant publication. Le créneau publié traverse minuit et apparaît sur les deux jours dans le planning. |
| 5. Secteur et remplacement | Créer et publier un créneau actif sur un étage pour un infirmier. Ouvrir une fiche. Dans un autre navigateur, transférer le créneau au remplaçant. | Le remplaçant reçoit le temps restant. L’ancien titulaire ne peut plus valider depuis sa fiche ouverte, à moins qu’une autre affectation couvre encore cet étage. |
| 6. Relève | Avec l’aide-soignant, créer une transmission ciblée Nuit. Vérifier avec un autre compte Jour, puis prendre en charge et clôturer avec le compte Nuit. | La transmission est visible à son auteur et à la nuit. La mutation est réservée à l’équipe destinataire. Les notes restent datées. |
| 7. Menu et arrivée | Avec Cuisine, publier un menu pour aujourd’hui et le même créneau. Avec Service, consulter le menu, installer un résident par son code fictif et lui associer un chevalet. | Le menu publié apparaît. Le placement et le chevalet figurent dans la salle. |
| 8. Préparation | Avec Cuisine, sélectionner un plateau identifié par sa chambre, vérifier les consignes et confirmer la préparation. Actualiser les tables côté Service. | Le plateau devient Préparé. L’écran des tables montre son état, sans afficher les détails alimentaires du plateau. |
| 9. Modification médecin | Ajouter une consigne fictive sur le résident dont le plateau est prêt, puis actualiser les deux écrans. Confirmer la correction en Cuisine et actualiser la salle. | Les états passent à **À revérifier**, puis **Corrigé**. Une confirmation avec la version précédente est refusée. Un menu republié déclenche aussi une revérification pour son créneau. |
| 10. Tournée Repas | Avec l’aide-soignant, tester filtres, recherche, confirmation de risque, Plus tard, refus, absence et consommation sur des repas différents. Imprimer la feuille agrégée. | Les actions concernent uniquement le repas choisi. L’impression ne contient aucun nom ni chambre. |
| 11. Tournée Médicaments | Avec l’infirmier, ouvrir une prise fictive et tester une validation autorisée. Avec l’aide-soignant, ouvrir **Transmettre un écart de prise**. | La validation est réservée à l’infirmier affecté. L’aide-soignant peut ajouter une transmission. |
| 12. Suivi et assistant | Sur une fiche fictive, vérifier le suivi quotidien, l’appétit et les notes. Demander à l’Assistant ce qu’il reste à servir. | Les données restent dans les écrans autorisés. L’Assistant propose la fiche avant toute validation. |
| 13. Écrans simultanés et coupure | Garder deux tournées ouvertes. Enregistrer une action, vérifier sa propagation, puis simuler une coupure et revenir en ligne. | L’autre écran recharge l’état. Une demande relancée après une réponse perdue conserve sa référence. |
| 14. Accès croisés | Tester l’API Cuisine avec un compte de soins, Médicaments avec Cuisine et Service, Administration avec Personnel, et une fiche hors secteur. | Chaque accès direct hors périmètre est refusé. |
| 15. Affichage et matériel | Rejouer recherche et navigation sur ordinateur et mobile, en clair et en sombre. Vérifier la projection réelle quand elle est disponible. | Les libellés opérationnels restent visibles. Caméra et RFID physiques restent à essayer au retour du matériel. |

Les étapes de recette ne remplacent pas la validation de l’établissement. Les prescriptions restent à relier au logiciel de référence. Inscrivez pour chaque essai le compte, le scénario, le résultat observé et la version d’`integration`.
