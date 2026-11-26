# CLAUDE.md

Ce projet partage son contexte dans le dépôt. **Lire d'abord [`AGENTS.md`](AGENTS.md)** (vue d'ensemble, lancement Docker, règles de branches, règle « base de données identique pour tous », protocole de relais entre sessions), **puis [`JOURNAL.md`](JOURNAL.md)** (journal vivant : ce qui a été fait, les décisions, ce qui reste).

Rappels essentiels :
- Travailler sur la branche **`integration`** ; ne jamais pousser ni force-push sur `main` (fusion par pull request, après revue d'équipe).
- La base de données se change **uniquement** via les scripts SQL de `database/` (jamais à la main) — tout le monde doit avoir la même base.
- **À la fin de chaque session : mettre à jour `JOURNAL.md`, puis commit + push**, pour que le prochain (humain ou modèle) ait tout le contexte.
