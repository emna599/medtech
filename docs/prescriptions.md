# Cadrage du circuit des prescriptions

## Périmètre et décisions à valider

Cette proposition sert à la revue avec un médecin, une IDE et l’établissement. Les prises existantes continuent d’utiliser le circuit actuel de démonstration. Le dossier médical est consultable par le médecin et aucune ordonnance ne peut être créée ou modifiée par ce chantier.

| Étape | Proposition à valider |
| --- | --- |
| Source | Déterminer si la prescription de référence reste dans le dossier usager informatisé ou est saisie dans MedTech. Si elle est importée, garder l’identifiant source, sa version et son statut, puis traiter explicitement les écarts de synchronisation. |
| Prescription | Identifier le résident, le prescripteur, la version, les dates d’effet et l’état de la prescription. Demander à l’équipe médicale de définir les champs, les unités et les règles de validation. |
| Planification | Associer toute nouvelle prise planifiée à une version de prescription. Une suspension ou un arrêt bloque les prises concernées. Faire valider la gestion des prises déjà préparées, des horaires décalés et des transitions entre versions. |
| Exécution | Séparer la prise prévue, ce qui a été constaté et qui l’a enregistré. Garder les prises déjà documentées. Toute correction doit laisser une trace et un motif. |
| Exceptions | Définir l’escalade pour un refus, une absence, un doute d’identité, un changement après préparation, une panne ou un transfert. Ne pas extrapoler les règles de repas au circuit médicaments. |

## Habilitations validées pour la démo

La tournée Médicaments est réservée aux comptes Personnel avec la fonction Infirmier. L’aide-soignant transmet les écarts par la relève. Les affectations datées limitent maintenant la tournée aux étages couverts pendant le créneau de travail. La source des prescriptions et les étapes de dispensation restent à définir.

## Habilitations à préciser

- **Médecin** : proposer la création, la modification et l’arrêt des prescriptions par les prescripteurs habilités. Distinguer la possibilité de consulter de la possibilité de prescrire.
- **IDE** : convenir qui prépare, administre, trace ou signale un écart. Limiter les informations aux résidents concernés.
- **Aide-soignant** : définir avec l’établissement les actions autorisées et les situations qui doivent remonter à l’IDE.
- **Cuisine** : définir une vue séparée du circuit repas avec les seules consignes utiles à la préparation et à la revérification.
- **Administration** : gérer les comptes et les affectations. Examiner les droits hérités de PERSONNEL/ADMIN avant de modifier le modèle de rôles.

## Conditions avant développement

- Valider en atelier le scénario nominal et les exceptions, y compris une suspension juste avant la validation et deux soignants sur une même prise.
- Décider comment intégrer les prises historiques qui n’ont pas de référence de prescription. Conserver leur historique et éviter d’inventer un lien rétroactif.
- Écrire une matrice par action et par rôle, puis tester les refus côté API même en appel direct. Vérifier les droits de lecture, les validations serveur, les opérations simultanées et l’audit.
- Commencer sur un jeu fictif en environnement isolé. Le passage à des données réelles passe par les conditions d’exploitation du pilote.

Repère de cadrage : [Manuel HAS d’évaluation de la qualité des ESSMS](https://www.has-sante.fr/jcms/p_3323075/fr/manuel-d-evaluation-de-la-qualite-des-essms-v1-1-mars-2022).
