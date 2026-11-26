# Circuit du plateau à valider avec l’équipe EHPAD

## Qui intervient

| Acteur | Proposition |
| --- | --- |
| Médecin | Tient à jour les consignes utilisées pour le service. Les modifications sont enregistrées et les consignes incompatibles bloquent la validation concernée. |
| Cuisine | Accède à une vue limitée aux plateaux qu’elle prépare. Détermine avec l’EHPAD le minimum d’informations nécessaire pour éviter une erreur d’identification ou de préparation. |
| Personnel soignant | Consulte les consignes et confirme la vérification au moment du service. Le dossier médical reste dans l’espace médecin. |

## Scénario d’essai

1. La cuisine prépare un plateau et enregistre la version des consignes utilisée.
2. Si une consigne change, le plateau déjà préparé passe à « À revérifier ». La nouvelle version et l’heure du changement sont visibles dans la vue cuisine.
3. Une personne identifiée accuse réception pour cette version. Un changement ultérieur remet l’action en attente.
4. Le personnel vérifie le plateau à la remise. La confirmation doit correspondre à la dernière version.
5. En cas de panne ou de tableau fermé, l’établissement définit le canal de secours et la façon d’enregistrer la reprise.

## Décisions à prendre avant implémentation

- Définir avec l’établissement le rôle cuisine, les informations visibles par ce rôle et la façon de distinguer deux résidents homonymes.
- Décider qui peut confirmer une revérification et si une confirmation cuisine est indispensable au service dans tous les cas.
- Valider les notifications quand la vue cuisine est fermée et la conduite à tenir en cas d’absence ou de changement de créneau.
- Tester deux accusés simultanés, deux changements successifs et l’accès direct aux API avec un mauvais rôle.
