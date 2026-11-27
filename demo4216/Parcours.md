# Parcours de la démo 4216

- **Administration**. Attribuer ou révoquer les badges des agents dans Comptes. Gérer les QR et les bracelets des résidents dans leur fiche.
- **Aide-soignant et infirmier**. Scanner et confirmer l’identité, puis ouvrir la tournée autorisée. Utiliser Pointage RFID avec son propre badge. Dans Relève, enregistrer une transmission pour l’équipe suivante.
- **Service en salle**. Scanner et confirmer l’identité. Si la personne est déjà installée, le panneau de sa table s’ouvre. Sinon, sélectionner une table puis confirmer l’installation. Gérer le chevalet depuis le panneau. Pointer avec le badge du compte connecté.
- **Médecin**. Identifier un résident et ouvrir le dossier médical après confirmation.

La démo partage l’API d’intégration. Une lecture par code ou clavier permet d’essayer les flux sans lecteur physique.

## Relancer depuis GitHub

Depuis la branche `integration`, démarrez la démo avec Docker Compose. Le navigateur utilise un seul point d’entrée et l’API les mêmes données PostgreSQL pour tous les profils.

```sh
docker compose -f docker-compose.yml -f docker-compose.4216.yml up -d --build frontend-4216
```

Ouvrez [la démo](http://localhost:4216/login). Cette commande est destinée à une base fictive. Le chargement est rejouable et complète les repas, le menu, les affectations et la relève de recette. Les badges existants sont conservés.

| Compte de démonstration | Profil | Code de badge fictif |
| --- | --- | --- |
| `admin` | Administration | |
| `medecin` | Médecin | |
| `personnel2` | Aide-soignant | `BADGE-DEMO-AIDE` |
| `personnel3` | Infirmier | `BADGE-DEMO-INFIRMIER` |
| `service1` | Service en salle | `BADGE-DEMO-SERVICE` |

Les cinq comptes fictifs utilisent `Demo1234!`. Dans **Scanner**, essayez `NFC-DEMO-002`. Dans **Pointage RFID**, saisissez le code du badge du compte connecté.

Deux personnes qui ouvrent la même instance travaillent sur la même base. Chaque installation Docker indépendante possède son propre volume PostgreSQL et les mêmes jeux de données fictives.
